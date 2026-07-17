import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WORKERS } from './data/workers'
import {
  fetchJobsFromCloud,
  purgeDemoDataFromCloud,
} from './lib/firestoreSync'
import { isFirebaseConfigured } from './lib/firebase'
import { wipeLocalOrdersStorage } from './lib/inventoryStore'
import {
  loadJobs,
  loadSession,
  mergeJobsFromCloud,
  saveJobs,
  saveSession,
  wipeLocalJobsStorage,
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

const DEMO_PURGE_FLAG = 'aor-purged-demo-v1'

function ensureLocalDemoWipe() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(DEMO_PURGE_FLAG) === '1') return
  wipeLocalJobsStorage()
  wipeLocalOrdersStorage()
  saveJobs([])
}

// Run before first paint so old local seed never flashes in.
ensureLocalDemoWipe()

function AppRoutes() {
  const [worker, setWorker] = useState<Worker | null>(() => {
    const session = loadSession()
    if (!session) return null
    return WORKERS.find((w) => w.id === session.workerId) ?? null
  })
  const [jobs, setJobs] = useState<Job[]>(() => loadJobs())
  const [bootstrapped, setBootstrapped] = useState(false)

  const pullJobsFromCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) return
    try {
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

  // Delete seeded docs from Firestore, then pull only real jobs.
  useEffect(() => {
    void (async () => {
      try {
        if (isFirebaseConfigured()) {
          const result = await purgeDemoDataFromCloud()
          console.info('Purged demo data from cloud', result)
        }
        localStorage.setItem(DEMO_PURGE_FLAG, '1')
        await pullJobsFromCloud()
        setJobs(loadJobs())
      } catch (err) {
        console.warn('Demo purge / cloud pull failed', err)
        localStorage.setItem(DEMO_PURGE_FLAG, '1')
      } finally {
        setBootstrapped(true)
      }
    })()
  }, [pullJobsFromCloud])

  useEffect(() => {
    const onStorage = () => setJobs(loadJobs())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Re-merge when someone logs in so photos from other sessions are visible.
  useEffect(() => {
    if (!worker || !bootstrapped) return
    void pullJobsFromCloud()
    setJobs(loadJobs())
  }, [worker, pullJobsFromCloud, bootstrapped])

  function refreshJobs() {
    setJobs(loadJobs())
  }

  function logout() {
    saveSession(null)
    setWorker(null)
  }

  if (!worker) {
    return <Login onLoggedIn={setWorker} />
  }

  return (
    <Routes>
      <Route path="/" element={<Hub worker={worker} onLogout={logout} />} />
      <Route
        path="/workshop"
        element={
          canAccessWorkshop(worker) ? (
            <Dashboard
              worker={worker}
              jobs={jobs}
              onLogout={logout}
            />
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
