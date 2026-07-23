import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WORKERS } from './data/workers'
import {
  fetchJobsFromCloud,
  purgeDemoDataFromCloud,
} from './lib/firestoreSync'
import { isFirebaseConfigured } from './lib/firebase'
import { ensureAppGeneration } from './lib/appGeneration'
import { reconcileOrdersWithCloud } from './lib/inventoryStore'
import { LOCAL_FIRST_MODE } from './lib/localMode'
import { backfillLocalPhotosToCloud } from './lib/photoBackfill'
import { hydratePhotoPreviewsFromIdb } from './lib/photoPreviewCache'
import {
  loadJobs,
  loadSession,
  mergeJobsFromCloud,
  saveJobs,
  saveSession,
} from './lib/store'
import { AppLayout } from './components/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Hub } from './pages/Hub'
import { Intake } from './pages/Intake'
import { JobChecklist } from './pages/JobChecklist'
import { Login } from './pages/Login'
import { OrderPrintPage } from './pages/OrderPrintPage'
import { OrdersPage } from './pages/OrdersPage'
import { StocktakeDetailPage } from './pages/StocktakeDetailPage'
import { StocktakePage } from './pages/StocktakePage'
import {
  canAccessWorkshop,
  canManage,
  type Job,
  type Worker,
} from './types'
import './App.css'

/**
 * Jobs/orders cloud pull. Only disabled when VITE_LOCAL_FIRST_MODE=true is set.
 */
const CLOUD_JOB_PULL_ENABLED = !LOCAL_FIRST_MODE
const CLOUD_ORDER_PULL_ENABLED = !LOCAL_FIRST_MODE

// Drop every old aor-* local key when generation bumps (runs before first paint).
ensureAppGeneration()

function AppRoutes() {
  const [worker, setWorker] = useState<Worker | null>(() => {
    const session = loadSession()
    if (!session) return null
    const found = WORKERS.find((w) => w.id === session.workerId) ?? null
    // Themba (and any canLogin: false) stay on jobs but cannot use the app.
    if (found && found.canLogin === false) {
      saveSession(null)
      return null
    }
    return found
  })
  const [jobs, setJobs] = useState<Job[]>(() => loadJobs())

  const pullJobsFromCloud = useCallback(async () => {
    if (!CLOUD_JOB_PULL_ENABLED || !isFirebaseConfigured()) return
    try {
      await purgeDemoDataFromCloud()
      const cloudJobs = await fetchJobsFromCloud()
      if (cloudJobs) {
        const merged = mergeJobsFromCloud(cloudJobs)
        saveJobs(merged)
        setJobs(merged)
      }
    } catch (err) {
      console.warn('Firestore jobs pull failed — using local cache', err)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const count = await hydratePhotoPreviewsFromIdb()
      if (count > 0) console.info('Restored on-device photos', count)
      setJobs(loadJobs())
      // Push photos that only exist on this device up to Firebase Storage
      // so every login can see them (no-op in local mode / without config).
      const uploaded = await backfillLocalPhotosToCloud()
      if (uploaded > 0) {
        console.info('Backfilled on-device photos to cloud', uploaded)
        setJobs(loadJobs())
      }
    })()
  }, [])

  useEffect(() => {
    if (LOCAL_FIRST_MODE) return
    // Always try to delete known demo docs; never rehydrate them into the UI.
    void (async () => {
      if (!isFirebaseConfigured()) return
      try {
        const result = await purgeDemoDataFromCloud()
        console.info('Purged demo data from cloud', result)
      } catch (err) {
        console.warn('Demo purge failed', err)
      }
      await pullJobsFromCloud()
      if (CLOUD_ORDER_PULL_ENABLED) {
        try {
          await reconcileOrdersWithCloud()
          console.info('Orders reconciled with Firestore')
        } catch (err) {
          console.warn('Firestore orders sync failed — using local cache', err)
        }
      }
    })()
  }, [pullJobsFromCloud])

  useEffect(() => {
    const onStorage = () => setJobs(loadJobs())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function refreshJobs() {
    setJobs(loadJobs())
  }

  function logout() {
    saveSession(null)
    setWorker(null)
  }

  if (!worker) {
    return (
      <div className="app-shell app-shell-auth">
        <Login onLoggedIn={setWorker} />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/orders/:orderId/print"
        element={
          <div className="app-shell">
            <OrderPrintPage />
          </div>
        }
      />
      <Route
        path="*"
        element={
          <AppLayout worker={worker} jobs={jobs} onLogout={logout}>
            <Routes>
              <Route
                path="/"
                element={
                  <Hub
                    worker={worker}
                    jobs={jobs}
                    cloudPullEnabled={CLOUD_JOB_PULL_ENABLED}
                  />
                }
              />
              <Route
                path="/workshop"
                element={
                  canAccessWorkshop(worker) ? (
                    <Dashboard worker={worker} jobs={jobs} />
                  ) : (
                    <Navigate to="/orders" replace />
                  )
                }
              />
              <Route
                path="/intake"
                element={
                  canManage(worker) ? (
                    <Intake />
                  ) : (
                    <Navigate to="/workshop" replace />
                  )
                }
              />
              <Route
                path="/job/:jobId"
                element={
                  canAccessWorkshop(worker) ? (
                    <JobChecklist worker={worker} onJobsChanged={refreshJobs} />
                  ) : (
                    <Navigate to="/orders" replace />
                  )
                }
              />
              <Route path="/orders" element={<OrdersPage worker={worker} />} />
              <Route
                path="/stocktake"
                element={
                  canAccessWorkshop(worker) ? (
                    <StocktakePage worker={worker} />
                  ) : (
                    <Navigate to="/orders" replace />
                  )
                }
              />
              <Route
                path="/stocktake/:stocktakeId"
                element={
                  canAccessWorkshop(worker) ? (
                    <StocktakeDetailPage />
                  ) : (
                    <Navigate to="/orders" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
