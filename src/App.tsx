import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WORKERS } from './data/workers'
import {
  fetchJobsFromCloud,
  purgeDemoDataFromCloud,
} from './lib/firestoreSync'
import { isFirebaseConfigured } from './lib/firebase'
import { APP_GENERATION, ensureAppGeneration } from './lib/appGeneration'
import { reconcileOrdersWithCloud } from './lib/inventoryStore'
import {
  loadJobs,
  loadSession,
  mergeJobsFromCloud,
  saveJobs,
  saveSession,
} from './lib/store'
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
 * Cloud pull was rehydrating old demo jobs from Firestore.
 * Keep uploads/sync for NEW work, but do not pull the full jobs list until
 * the workshop has a clean slate for real testing.
 *
 * Orders MUST pull — Yogs on another phone needs Jaco’s requests.
 */
const CLOUD_JOB_PULL_ENABLED = false
const CLOUD_ORDER_PULL_ENABLED = true

// Drop every old aor-* local key when generation bumps (runs before first paint).
ensureAppGeneration()

function AppRoutes() {
  const [worker, setWorker] = useState<Worker | null>(() => {
    const session = loadSession()
    if (!session) return null
    return WORKERS.find((w) => w.id === session.workerId) ?? null
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
    return <Login onLoggedIn={setWorker} buildId={APP_GENERATION} />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Hub
            worker={worker}
            onLogout={logout}
            buildId={APP_GENERATION}
            cloudPullEnabled={CLOUD_JOB_PULL_ENABLED}
          />
        }
      />
      <Route
        path="/workshop"
        element={
          canAccessWorkshop(worker) ? (
            <Dashboard worker={worker} jobs={jobs} onLogout={logout} />
          ) : (
            <Navigate to="/orders" replace />
          )
        }
      />
      <Route
        path="/intake"
        element={
          canManage(worker) ? <Intake /> : <Navigate to="/workshop" replace />
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
      <Route path="/orders/:orderId/print" element={<OrderPrintPage />} />
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
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
