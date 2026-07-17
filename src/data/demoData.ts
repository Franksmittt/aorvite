import type { Job, PartsOrder } from '../types'

/** Old seeded demo jobs that were synced into Firestore */
export const DEMO_JOB_IDS = new Set([
  'job-coming-1',
  'job-coming-2',
  'job-shop-1',
  'job-shop-2',
  'job-shop-3',
  'job-shop-4',
  'job-inspect-1',
  'job-inspect-2',
  'job-out-1',
  'job-out-2',
  'job-out-3',
])

/** Old seeded demo orders that were synced into Firestore */
export const DEMO_ORDER_IDS = new Set([
  'ord-1',
  'ord-2',
  'ord-3',
  'ord-4',
  'ord-5',
])

export function isDemoJob(job: Job): boolean {
  if (DEMO_JOB_IDS.has(job.id)) return true
  // Mock seed used ids like mock-front-bumper-task-fb-1
  if (job.tasks?.some((task) => task.id.startsWith('mock-'))) return true
  if (job.notes?.some((note) => note.id.startsWith('mock-'))) return true
  return false
}

export function isDemoOrder(order: PartsOrder): boolean {
  return DEMO_ORDER_IDS.has(order.id)
}

export function stripDemoJobs(jobs: Job[]): Job[] {
  return jobs.filter((job) => !isDemoJob(job))
}

export function stripDemoOrders(orders: PartsOrder[]): PartsOrder[] {
  return orders.filter((order) => !isDemoOrder(order))
}
