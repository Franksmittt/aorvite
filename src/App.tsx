import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WORKERS } from './data/workers'
import { fetchJobsFromCloud } from './lib/firestoreSync'
import { isFirebaseConfigured } from './lib/firebase'
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

function AppRoutes() {
  const [worker, setWorker] = useState<Worker | null>(() => {
    const session = loadSession()
    if (!session) return null
    return WORKERS.find((w) => w.id === session.workerId) ?? null
  })
  const [jobs, setJobs] = useState<Job[]>(() => loadJobs())

  const pullJobsFromCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) return
    try {
      const cloudJobs = await fetchJobsFromCloud()
      if (cloudJobs && cloudJobs.length > 0) {
        const merged = mergeJobsFromCloud(cloudJobs)
        saveJobs(merged)
        setJobs(merged)
      }
    } catch (err) {
      console.warn('Firestore jobs pull failed — using local cache', err)
    }
  }, [])

  useEffect(() => {
    const onStorage = () => setJobs(loadJobs())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    void pullJobsFromCloud()
  }, [pullJobsFromCloud])

  // Re-merge when someone logs in so photos from other sessions are visible.
  useEffect(() => {
    if (!worker) return
    void pullJobsFromCloud()
    setJobs(loadJobs())
  }, [worker, pullJobsFromCloud])

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
              onJobsChanged={refreshJobs}
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
