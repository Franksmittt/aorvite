import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import type { Job, PartsOrder, Stocktake, Supplier } from '../types'
import { getDb, isFirebaseConfigured } from './firebase'

const JOBS = 'jobs'
const ORDERS = 'orders'
const STOCKTAKES = 'stocktakes'
const SUPPLIERS = 'suppliers'

function requireDb(): Firestore {
  const db = getDb()
  if (!db) throw new Error('Firebase not configured')
  return db
}

export async function syncJobToCloud(job: Job): Promise<void> {
  if (!isFirebaseConfigured()) return
  const db = requireDb()
  await setDoc(doc(db, JOBS, job.id), job, { merge: true })
}

export async function fetchJobsFromCloud(): Promise<Job[] | null> {
  if (!isFirebaseConfigured()) return null
  const db = requireDb()
  const snap = await getDocs(query(collection(db, JOBS), orderBy('intakeDate', 'desc')))
  return snap.docs.map((d) => d.data() as Job)
}

export async function syncOrderToCloud(order: PartsOrder): Promise<void> {
  if (!isFirebaseConfigured()) return
  const db = requireDb()
  await setDoc(doc(db, ORDERS, order.id), order, { merge: true })
}

export async function fetchOrdersFromCloud(): Promise<PartsOrder[] | null> {
  if (!isFirebaseConfigured()) return null
  const db = requireDb()
  const snap = await getDocs(query(collection(db, ORDERS), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => d.data() as PartsOrder)
}

export async function syncStocktakeToCloud(stocktake: Stocktake): Promise<void> {
  if (!isFirebaseConfigured()) return
  const db = requireDb()
  await setDoc(doc(db, STOCKTAKES, stocktake.id), stocktake, { merge: true })
}

export async function syncSupplierToCloud(supplier: Supplier): Promise<void> {
  if (!isFirebaseConfigured()) return
  const db = requireDb()
  await setDoc(doc(db, SUPPLIERS, supplier.id), supplier, { merge: true })
}

export async function fetchSuppliersFromCloud(): Promise<Supplier[] | null> {
  if (!isFirebaseConfigured()) return null
  const db = requireDb()
  const snap = await getDocs(collection(db, SUPPLIERS))
  return snap.docs.map((d) => d.data() as Supplier)
}
