export type JobStatus =
  | 'Coming'
  | 'In Workshop'
  | 'Final Inspection'
  | 'Gone Out'

export type TaskStatus = 'Pending' | 'Complete' | 'Skipped'
export type TaskPhase = 'Work' | 'Final Inspection'
export type WorkerRole = 'Owner' | 'Manager' | 'Staff' | 'Orders'

export type Worker = {
  id: string
  fullName: string
  role: WorkerRole
  pin: string
}

export type PhotoMode = 'single' | 'walkaround'

export type WalkaroundSlotId =
  | 'front'
  | 'front-right'
  | 'right'
  | 'back-right'
  | 'back'
  | 'back-left'
  | 'left'
  | 'front-left'

export type TaskTemplateStep = {
  id: string
  taskName: string
  requiresPhoto: boolean
  skippable: boolean
  phase?: TaskPhase
  stepOrder: number
  /** Pre-inspection etc. — multi-angle capture */
  photoMode?: PhotoMode
  minPhotos?: number
}

export type PackageTemplate = {
  id: string
  packageName: string
  steps: TaskTemplateStep[]
}

export type TaskMedia = {
  id: string
  /** Local preview / offline fallback */
  dataUrl?: string
  /** Firebase Storage download URL when connected */
  url?: string
  storagePath?: string
  capturedAt: string
}

/** One photo in a multi-photo / walkaround set */
export type TaskPhoto = {
  id: string
  slotId?: WalkaroundSlotId
  slotLabel: string
  dataUrl?: string
  url?: string
  storagePath?: string
  capturedAt: string
  capturedByWorkerId: string
}

export type JobTask = {
  id: string
  taskName: string
  requiresPhoto: boolean
  skippable: boolean
  phase: TaskPhase
  stepOrder: number
  status: TaskStatus
  completedAt?: string
  completedByWorkerId?: string
  skipNote?: string
  /** Legacy single-photo field (still used for non-walkaround steps) */
  media?: TaskMedia
  photoMode?: PhotoMode
  minPhotos?: number
  /** Draft + submitted walkaround / multi photos */
  photos?: TaskPhoto[]
  /** Once set, photos are locked — no delete / swap */
  photosLockedAt?: string
}

export type JobNote = {
  id: string
  workerId: string
  text: string
  createdAt: string
}

export type AuditAction =
  | 'photo_captured'
  | 'photo_deleted'
  | 'walkaround_submitted'
  | 'note_added'
  | 'task_completed'
  | 'task_skipped'
  | 'timer_started'
  | 'timer_stopped'

export type AuditEvent = {
  id: string
  at: string
  workerId: string
  action: AuditAction
  summary: string
  taskId?: string
  taskName?: string
  photoId?: string
  slotLabel?: string
}

export type Job = {
  id: string
  registration: string
  make: string
  model: string
  year: string
  packageId: string
  packageName: string
  status: JobStatus
  intakeDate: string
  assignedWorkerIds: string[]
  notes: JobNote[]
  tasks: JobTask[]
  auditLog?: AuditEvent[]
  releasedAt?: string
  timerStartedAt?: string
  timerSecondsAccumulated?: number
}

export type Tool = {
  id: string
  name: string
  category: string
  location: string
  expectedQty: number
  estimatedValueZar: number
}

export type StocktakeLine = {
  toolId: string
  toolName: string
  expectedQty: number
  countedQty: number
  status: 'Present' | 'Missing' | 'Short'
  note?: string
}

export type Stocktake = {
  id: string
  workerId: string
  createdAt: string
  lines: StocktakeLine[]
  missingCount: number
  shortCount: number
  liabilityZar: number
  acknowledged: boolean
}

export type PaymentMethod = 'Account' | 'EFT' | 'Cash'

export type Supplier = {
  id: string
  name: string
  defaultPayment: PaymentMethod
  hasAccount: boolean
  notes?: string
  active: boolean
}

export type OrderItemStatus =
  | 'Requested'
  | 'On Order'
  | 'Received'
  | 'Partial'
  | 'Unavailable'
  | 'Cancelled'

export type PartsOrderStatus =
  | 'Open'
  | 'Issued'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled'

export type OrderLine = {
  id: string
  catalogId?: string
  name: string
  qty: number
  qtyReceived: number
  unit?: string
  note?: string
  status: OrderItemStatus
  allocatedJobId?: string
  allocatedRegistration?: string
}

/** vehicle = linked to a client job; workshop = manual / supplies / non-vehicle */
export type OrderPurpose = 'vehicle' | 'workshop'

export type PartsOrder = {
  id: string
  orderNumber: string
  createdAt: string
  requestedByWorkerId: string
  /** Defaults to vehicle when a job is set; workshop for manual supplies orders */
  purpose?: OrderPurpose
  jobId?: string
  jobRegistration?: string
  supplierId: string
  supplierName: string
  paymentMethod?: PaymentMethod
  status: PartsOrderStatus
  lines: OrderLine[]
  issuedByWorkerId?: string
  issuedAt?: string
  receivedAt?: string
  receivedByWorkerId?: string
  notes?: string
}

export type Session = {
  workerId: string
}

export function canManage(worker: Worker): boolean {
  return worker.role === 'Owner' || worker.role === 'Manager'
}

/** Owner / manager signs vehicles out to clients */
export function canFinalInspect(worker: Worker): boolean {
  return worker.role === 'Owner' || worker.role === 'Manager'
}

export function canIssueOrders(worker: Worker): boolean {
  return worker.role === 'Orders' || worker.role === 'Owner' || worker.role === 'Manager'
}

export function canAccessWorkshop(worker: Worker): boolean {
  return worker.role !== 'Orders'
}

export function isTaskResolved(status: TaskStatus): boolean {
  return status === 'Complete' || status === 'Skipped'
}

export function jobProgress(job: Job): number {
  if (job.tasks.length === 0) return 0
  const done = job.tasks.filter((task) => isTaskResolved(task.status)).length
  return Math.round((done / job.tasks.length) * 100)
}

export function orderLineOutstanding(line: OrderLine): number {
  return Math.max(0, line.qty - line.qtyReceived)
}
