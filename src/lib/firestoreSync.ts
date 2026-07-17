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

/** Firestore rejects `undefined` fields — strip them before every write. */
function toFirestoreData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Keep local dataUrl previews on-device only — sync cloud URL/path to Firestore. */
function jobForCloud(job: Job): Job {
  return {
    ...job,
    tasks: job.tasks.map((task) => {
      let next = task

      if (task.media) {
        const { dataUrl: _unused, ...cloudMedia } = task.media
        if (!cloudMedia.url && !cloudMedia.storagePath) {
          const { media: _media, ...rest } = task
          next = rest
        } else {
          next = { ...task, media: cloudMedia }
        }
      }

      if (next.photos?.length) {
        next = {
          ...next,
          photos: next.photos
            .map((photo) => {
              const { dataUrl: _d, ...cloudPhoto } = photo
              if (!cloudPhoto.url && !cloudPhoto.storagePath) return null
              return cloudPhoto
            })
            .filter((p): p is NonNullable<typeof p> => Boolean(p)),
        }
      }

      return next
    }),
  }
}

export async function syncJobToCloud(job: Job): Promise<void> {
  if (!isFirebaseConfigured()) return
  const db = requireDb()
  await setDoc(doc(db, JOBS, job.id), toFirestoreData(jobForCloud(job)), {
    merge: true,
  })
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
  await setDoc(doc(db, ORDERS, order.id), toFirestoreData(order), { merge: true })
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
  await setDoc(doc(db, STOCKTAKES, stocktake.id), toFirestoreData(stocktake), {
    merge: true,
  })
}

export async function syncSupplierToCloud(supplier: Supplier): Promise<void> {
  if (!isFirebaseConfigured()) return
  const db = requireDb()
  await setDoc(doc(db, SUPPLIERS, supplier.id), toFirestoreData(supplier), {
    merge: true,
  })
}

export async function fetchSuppliersFromCloud(): Promise<Supplier[] | null> {
  if (!isFirebaseConfigured()) return null
  const db = requireDb()
  const snap = await getDocs(collection(db, SUPPLIERS))
  return snap.docs.map((d) => d.data() as Supplier)
}
