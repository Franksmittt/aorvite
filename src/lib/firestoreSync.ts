import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import {
  DEMO_JOB_IDS,
  DEMO_ORDER_IDS,
  isDemoJob,
  isDemoOrder,
  stripDemoJobs,
  stripDemoOrders,
} from '../data/demoData'
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
  if (isDemoJob(job)) return
  const db = requireDb()
  await setDoc(doc(db, JOBS, job.id), toFirestoreData(jobForCloud(job)), {
    merge: true,
  })
}

export async function fetchJobsFromCloud(): Promise<Job[] | null> {
  if (!isFirebaseConfigured()) return null
  const db = requireDb()
  const snap = await getDocs(query(collection(db, JOBS), orderBy('intakeDate', 'desc')))
  return stripDemoJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job))
}

export async function syncOrderToCloud(order: PartsOrder): Promise<void> {
  if (!isFirebaseConfigured()) return
  if (isDemoOrder(order)) return
  const db = requireDb()
  try {
    await setDoc(doc(db, ORDERS, order.id), toFirestoreData(order), { merge: true })
  } catch (err) {
    console.error('Failed to sync order to Firestore', order.id, order.orderNumber, err)
    throw err
  }
}

function mapOrderDocs(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>,
): PartsOrder[] {
  return stripDemoOrders(
    docs.map((d) => ({ id: d.id, ...d.data() }) as PartsOrder),
  ).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function fetchOrdersFromCloud(): Promise<PartsOrder[] | null> {
  if (!isFirebaseConfigured()) return null
  const db = requireDb()
  // No orderBy — avoids hard failure when an index/field is missing.
  const snap = await getDocs(collection(db, ORDERS))
  return mapOrderDocs(snap.docs)
}

/** Live orders feed so Yogs sees Jaco’s request without refreshing. */
export function subscribeOrdersFromCloud(
  onChange: (orders: PartsOrder[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {}
  const db = requireDb()
  return onSnapshot(
    collection(db, ORDERS),
    (snap) => onChange(mapOrderDocs(snap.docs)),
    (err) => {
      console.error('Orders realtime sync failed', err)
      onError?.(err)
    },
  )
}

/** Wipe seeded demo docs out of Firestore so they stop reappearing on every device. */
export async function purgeDemoDataFromCloud(): Promise<{
  jobs: number
  orders: number
}> {
  if (!isFirebaseConfigured()) return { jobs: 0, orders: 0 }
  const db = requireDb()
  let jobs = 0
  let orders = 0

  for (const id of DEMO_JOB_IDS) {
    try {
      await deleteDoc(doc(db, JOBS, id))
      jobs += 1
    } catch {
      /* already gone */
    }
  }

  for (const id of DEMO_ORDER_IDS) {
    try {
      await deleteDoc(doc(db, ORDERS, id))
      orders += 1
    } catch {
      /* already gone */
    }
  }

  // Catch any leftover seed jobs that used mock-* task/note ids
  try {
    const snap = await getDocs(collection(db, JOBS))
    for (const d of snap.docs) {
      const job = { id: d.id, ...d.data() } as Job
      if (!isDemoJob(job)) continue
      await deleteDoc(d.ref)
      jobs += 1
    }
  } catch (err) {
    console.warn('Demo job scan failed', err)
  }

  try {
    const snap = await getDocs(collection(db, ORDERS))
    for (const d of snap.docs) {
      const order = { id: d.id, ...d.data() } as PartsOrder
      if (!isDemoOrder(order)) continue
      await deleteDoc(d.ref)
      orders += 1
    }
  } catch (err) {
    console.warn('Demo order scan failed', err)
  }

  return { jobs, orders }
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
