import { MOCK_JOBS } from '../data/mockJobs'
import { PACKAGE_TEMPLATES } from '../data/templates'
import { WALKAROUND_MIN_PHOTOS, walkaroundSlotLabel } from '../data/walkaround'
import type {
  AuditAction,
  AuditEvent,
  Job,
  JobNote,
  JobTask,
  Session,
  TaskMedia,
  TaskPhoto,
  WalkaroundSlotId,
} from '../types'
import { isTaskResolved } from '../types'
import { syncJobToCloud } from './firestoreSync'
import { isFirebaseConfigured } from './firebase'

const JOBS_KEY = 'aor-jobs-v3'
const SESSION_KEY = 'aor-session'
const SEEDED_KEY = 'aor-seeded-v3'

function uid(): string {
  return crypto.randomUUID()
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(100)
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function ensureSeeded() {
  if (localStorage.getItem(SEEDED_KEY) === '1') return
  if (!localStorage.getItem(JOBS_KEY)) {
    saveJobs(MOCK_JOBS)
  }
  localStorage.setItem(SEEDED_KEY, '1')
}

export function resetToMockJobs() {
  saveJobs(MOCK_JOBS)
  localStorage.setItem(SEEDED_KEY, '1')
}

export function loadJobs(): Job[] {
  ensureSeeded()
  const raw = localStorage.getItem(JOBS_KEY)
  if (!raw) return []
  try {
    const jobs = JSON.parse(raw) as Job[]
    let migrated = false

    for (const job of jobs) {
      if (!job.assignedWorkerIds) {
        job.assignedWorkerIds = []
        migrated = true
      }
      if (!job.notes) {
        job.notes = []
        migrated = true
      }
      if (!job.auditLog) {
        job.auditLog = []
        migrated = true
      }
      if ((job.status as string) === 'Pending') {
        job.status = 'Coming'
        migrated = true
      }
      if ((job.status as string) === 'In Progress') {
        job.status = 'In Workshop'
        migrated = true
      }
      if ((job.status as string) === 'Complete') {
        job.status = 'Gone Out'
        migrated = true
      }

      for (const task of job.tasks) {
        if (!task.phase) {
          task.phase = 'Work'
          migrated = true
        }
        const looksLikeWalkaround =
          /pre-inspection/i.test(task.taskName) &&
          (/corner|walkaround|walk-around/i.test(task.taskName) ||
            task.photoMode === 'walkaround')
        if (looksLikeWalkaround && task.photoMode !== 'walkaround') {
          task.photoMode = 'walkaround'
          task.minPhotos = WALKAROUND_MIN_PHOTOS
          task.photos = task.photos ?? []
          if (/all 4 corners/i.test(task.taskName)) {
            task.taskName = 'Pre-inspection walkaround photos (8 angles)'
          }
          migrated = true
        }
        if (task.photoMode === 'walkaround' && !task.photos) {
          task.photos = []
          migrated = true
        }
        if (
          task.photoMode === 'walkaround' &&
          task.status === 'Complete' &&
          !task.photosLockedAt
        ) {
          task.photosLockedAt = task.completedAt ?? new Date().toISOString()
          migrated = true
        }
      }
    }

    if (migrated) saveJobs(jobs)
    return jobs
  } catch {
    return []
  }
}

export function saveJobs(jobs: Job[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
}

function taskStatusRank(status: JobTask['status']): number {
  if (status === 'Complete') return 2
  if (status === 'Skipped') return 1
  return 0
}

function taskHasMedia(task: JobTask): boolean {
  return Boolean(task.media?.url || task.media?.dataUrl)
}

function mergeTaskMedia(
  local?: TaskMedia,
  cloud?: TaskMedia,
): TaskMedia | undefined {
  if (!local && !cloud) return undefined
  if (!local) return cloud
  if (!cloud) return local
  return {
    id: cloud.id || local.id,
    capturedAt: cloud.capturedAt || local.capturedAt,
    ...(cloud.url || local.url
      ? { url: cloud.url || local.url }
      : {}),
    ...(local.dataUrl || cloud.dataUrl
      ? { dataUrl: local.dataUrl || cloud.dataUrl }
      : {}),
    ...(cloud.storagePath || local.storagePath
      ? { storagePath: cloud.storagePath || local.storagePath }
      : {}),
  }
}

function mergePhotos(local?: TaskPhoto[], cloud?: TaskPhoto[]): TaskPhoto[] {
  const byId = new Map<string, TaskPhoto>()
  for (const photo of cloud ?? []) byId.set(photo.id, photo)
  for (const photo of local ?? []) {
    const existing = byId.get(photo.id)
    if (!existing) {
      byId.set(photo.id, photo)
      continue
    }
    byId.set(photo.id, {
      ...existing,
      ...photo,
      url: photo.url || existing.url,
      dataUrl: photo.dataUrl || existing.dataUrl,
      storagePath: photo.storagePath || existing.storagePath,
    })
  }
  return [...byId.values()].sort((a, b) =>
    a.capturedAt < b.capturedAt ? -1 : 1,
  )
}

function mergeAudit(local?: AuditEvent[], cloud?: AuditEvent[]): AuditEvent[] {
  const byId = new Map<string, AuditEvent>()
  for (const event of cloud ?? []) byId.set(event.id, event)
  for (const event of local ?? []) byId.set(event.id, event)
  return [...byId.values()].sort((a, b) => (a.at < b.at ? 1 : -1))
}

function mergeJob(local: Job, cloud: Job): Job {
  const cloudTasks = new Map(cloud.tasks.map((t) => [t.id, t]))
  const localTasks = new Map(local.tasks.map((t) => [t.id, t]))
  const taskIds = new Set([...cloudTasks.keys(), ...localTasks.keys()])

  const tasks: JobTask[] = [...taskIds].map((id) => {
    const lt = localTasks.get(id)
    const ct = cloudTasks.get(id)
    if (!lt) return ct!
    if (!ct) return lt

    const preferCloud =
      taskStatusRank(ct.status) > taskStatusRank(lt.status) ||
      (taskStatusRank(ct.status) === taskStatusRank(lt.status) &&
        Boolean(ct.completedAt) &&
        (!lt.completedAt || ct.completedAt! >= lt.completedAt))

    const base = preferCloud ? ct : lt
    const other = preferCloud ? lt : ct
    const media = mergeTaskMedia(lt.media, ct.media) ?? base.media

    return {
      ...other,
      ...base,
      media: taskHasMedia({ media } as JobTask) ? media : base.media ?? other.media,
      photos: mergePhotos(lt.photos, ct.photos),
      photoMode: base.photoMode ?? other.photoMode,
      minPhotos: base.minPhotos ?? other.minPhotos,
      photosLockedAt: base.photosLockedAt ?? other.photosLockedAt,
      completedAt: base.completedAt ?? other.completedAt,
      completedByWorkerId: base.completedByWorkerId ?? other.completedByWorkerId,
      skipNote: base.skipNote ?? other.skipNote,
    }
  })

  tasks.sort((a, b) => a.stepOrder - b.stepOrder)

  const notes = [...(cloud.notes ?? [])]
  for (const note of local.notes ?? []) {
    if (!notes.some((n) => n.id === note.id)) notes.push(note)
  }
  notes.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const assigned = new Set([
    ...(cloud.assignedWorkerIds ?? []),
    ...(local.assignedWorkerIds ?? []),
  ])

  return {
    ...local,
    ...cloud,
    tasks,
    notes,
    auditLog: mergeAudit(local.auditLog, cloud.auditLog),
    assignedWorkerIds: [...assigned],
    timerSecondsAccumulated: Math.max(
      local.timerSecondsAccumulated ?? 0,
      cloud.timerSecondsAccumulated ?? 0,
    ),
    timerStartedAt: cloud.timerStartedAt ?? local.timerStartedAt,
    releasedAt: cloud.releasedAt ?? local.releasedAt,
  }
}

function appendAudit(
  job: Job,
  opts: {
    workerId: string
    action: AuditAction
    summary: string
    taskId?: string
    taskName?: string
    photoId?: string
    slotLabel?: string
  },
) {
  const event: AuditEvent = {
    id: uid(),
    at: new Date().toISOString(),
    workerId: opts.workerId,
    action: opts.action,
    summary: opts.summary,
    ...(opts.taskId ? { taskId: opts.taskId } : {}),
    ...(opts.taskName ? { taskName: opts.taskName } : {}),
    ...(opts.photoId ? { photoId: opts.photoId } : {}),
    ...(opts.slotLabel ? { slotLabel: opts.slotLabel } : {}),
  }
  job.auditLog = [event, ...(job.auditLog ?? [])]
}

/** Merge cloud + local so a Firestore pull never wipes photos taken on this device. */
export function mergeJobsFromCloud(cloudJobs: Job[]): Job[] {
  const localJobs = loadJobs()
  const byId = new Map<string, Job>()

  for (const job of localJobs) byId.set(job.id, job)
  for (const cloudJob of cloudJobs) {
    const local = byId.get(cloudJob.id)
    byId.set(cloudJob.id, local ? mergeJob(local, cloudJob) : cloudJob)
  }

  return [...byId.values()].sort((a, b) =>
    a.intakeDate < b.intakeDate ? 1 : -1,
  )
}

export function createJob(input: {
  registration: string
  make: string
  model: string
  year: string
  packageId: string
  assignedWorkerIds?: string[]
}): Job {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === input.packageId)
  if (!template) throw new Error('Unknown package')

  const tasks: JobTask[] = template.steps.map((step) => ({
    id: uid(),
    taskName: step.taskName,
    requiresPhoto: step.requiresPhoto,
    skippable: step.skippable,
    phase: step.phase ?? 'Work',
    stepOrder: step.stepOrder,
    status: 'Pending',
    ...(step.photoMode ? { photoMode: step.photoMode } : {}),
    ...(step.minPhotos ? { minPhotos: step.minPhotos } : {}),
    ...(step.photoMode === 'walkaround' ? { photos: [] } : {}),
  }))

  const job: Job = {
    id: uid(),
    registration: input.registration.trim().toUpperCase(),
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year.trim(),
    packageId: template.id,
    packageName: template.packageName,
    status: 'Coming',
    intakeDate: new Date().toISOString(),
    assignedWorkerIds: input.assignedWorkerIds ?? [],
    notes: [],
    auditLog: [],
    tasks,
  }

  const jobs = loadJobs()
  jobs.unshift(job)
  saveJobs(jobs)
  void syncJobToCloud(job)
  return job
}

export function getJob(jobId: string): Job | undefined {
  return loadJobs().find((j) => j.id === jobId)
}

export function updateJob(job: Job) {
  const jobs = loadJobs()
  const idx = jobs.findIndex((j) => j.id === job.id)
  if (idx === -1) return
  jobs[idx] = job
  saveJobs(jobs)
  void syncJobToCloud(job)
}

function finalizeTaskProgress(job: Job) {
  const workTasks = job.tasks.filter((task) => task.phase !== 'Final Inspection')
  const inspectionTasks = job.tasks.filter((task) => task.phase === 'Final Inspection')
  const workDone = workTasks.every((task) => isTaskResolved(task.status))
  const inspectionDone =
    inspectionTasks.length > 0 &&
    inspectionTasks.every((task) => isTaskResolved(task.status))
  const anyWorkStarted = workTasks.some((task) => isTaskResolved(task.status))

  if (inspectionDone) {
    job.status = 'Gone Out'
    job.releasedAt = job.releasedAt ?? new Date().toISOString()
  } else if (workDone) {
    job.status = 'Final Inspection'
  } else if (anyWorkStarted) {
    job.status = 'In Workshop'
  } else {
    job.status = 'Coming'
  }

  updateJob(job)
  vibrate()
  return job
}

export function completeTask(opts: {
  jobId: string
  taskId: string
  workerId: string
  photoDataUrl?: string
  photoUrl?: string
  storagePath?: string
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const task = job.tasks.find((t) => t.id === opts.taskId)
  if (!task) return null

  if (task.photoMode === 'walkaround') {
    throw new Error('Use walkaround submit for this step')
  }

  if (task.requiresPhoto && !opts.photoDataUrl && !opts.photoUrl) {
    throw new Error('Photo required')
  }

  task.status = 'Complete'
  task.completedAt = new Date().toISOString()
  task.completedByWorkerId = opts.workerId
  task.skipNote = undefined
  if (opts.photoDataUrl || opts.photoUrl) {
    // Never write `undefined` fields — Firestore rejects them and sync fails.
    const mediaId = uid()
    task.media = {
      id: mediaId,
      capturedAt: new Date().toISOString(),
      // Keep local preview so other logins on this device always see the photo,
      // even if cloud pull is delayed. Prefer cloud URL when rendering.
      ...(opts.photoDataUrl ? { dataUrl: opts.photoDataUrl } : {}),
      ...(opts.photoUrl ? { url: opts.photoUrl } : {}),
      ...(opts.storagePath ? { storagePath: opts.storagePath } : {}),
    }
    appendAudit(job, {
      workerId: opts.workerId,
      action: 'photo_captured',
      summary: `Photo captured for “${task.taskName}”`,
      taskId: task.id,
      taskName: task.taskName,
      photoId: mediaId,
    })
  }

  appendAudit(job, {
    workerId: opts.workerId,
    action: 'task_completed',
    summary: `Completed “${task.taskName}”`,
    taskId: task.id,
    taskName: task.taskName,
  })

  if (!job.assignedWorkerIds.includes(opts.workerId)) {
    job.assignedWorkerIds = [...job.assignedWorkerIds, opts.workerId]
  }

  return finalizeTaskProgress(job)
}

export function addWalkaroundPhoto(opts: {
  jobId: string
  taskId: string
  workerId: string
  slotId: WalkaroundSlotId
  photoDataUrl?: string
  photoUrl?: string
  storagePath?: string
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const task = job.tasks.find((t) => t.id === opts.taskId)
  if (!task) return null
  if (task.photoMode !== 'walkaround') {
    throw new Error('Not a walkaround step')
  }
  if (task.photosLockedAt || task.status === 'Complete') {
    throw new Error('Walkaround already submitted — photos are locked')
  }
  if (!opts.photoDataUrl && !opts.photoUrl) {
    throw new Error('Photo required')
  }

  const slotLabel = walkaroundSlotLabel(opts.slotId)
  task.photos = task.photos ?? []

  const existing = task.photos.find((p) => p.slotId === opts.slotId)
  if (existing) {
    task.photos = task.photos.filter((p) => p.id !== existing.id)
    appendAudit(job, {
      workerId: opts.workerId,
      action: 'photo_deleted',
      summary: `Replaced ${slotLabel} photo on “${task.taskName}”`,
      taskId: task.id,
      taskName: task.taskName,
      photoId: existing.id,
      slotLabel,
    })
  }

  const photo: TaskPhoto = {
    id: uid(),
    slotId: opts.slotId,
    slotLabel,
    capturedAt: new Date().toISOString(),
    capturedByWorkerId: opts.workerId,
    ...(opts.photoDataUrl ? { dataUrl: opts.photoDataUrl } : {}),
    ...(opts.photoUrl ? { url: opts.photoUrl } : {}),
    ...(opts.storagePath ? { storagePath: opts.storagePath } : {}),
  }
  task.photos.push(photo)

  appendAudit(job, {
    workerId: opts.workerId,
    action: 'photo_captured',
    summary: `Captured ${slotLabel} · ${new Date(photo.capturedAt).toLocaleString()}`,
    taskId: task.id,
    taskName: task.taskName,
    photoId: photo.id,
    slotLabel,
  })

  if (!job.assignedWorkerIds.includes(opts.workerId)) {
    job.assignedWorkerIds = [...job.assignedWorkerIds, opts.workerId]
  }

  if (job.status === 'Coming') job.status = 'In Workshop'
  updateJob(job)
  vibrate()
  return job
}

export function deleteWalkaroundPhoto(opts: {
  jobId: string
  taskId: string
  workerId: string
  photoId: string
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const task = job.tasks.find((t) => t.id === opts.taskId)
  if (!task) return null
  if (task.photosLockedAt || task.status === 'Complete') {
    throw new Error('Walkaround already submitted — cannot delete photos')
  }

  const photo = (task.photos ?? []).find((p) => p.id === opts.photoId)
  if (!photo) throw new Error('Photo not found')

  task.photos = (task.photos ?? []).filter((p) => p.id !== opts.photoId)
  appendAudit(job, {
    workerId: opts.workerId,
    action: 'photo_deleted',
    summary: `Deleted ${photo.slotLabel} photo (taken ${new Date(photo.capturedAt).toLocaleString()})`,
    taskId: task.id,
    taskName: task.taskName,
    photoId: photo.id,
    slotLabel: photo.slotLabel,
  })

  updateJob(job)
  vibrate()
  return job
}

export function submitWalkaround(opts: {
  jobId: string
  taskId: string
  workerId: string
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const task = job.tasks.find((t) => t.id === opts.taskId)
  if (!task) return null
  if (task.photoMode !== 'walkaround') {
    throw new Error('Not a walkaround step')
  }
  if (task.status === 'Complete') {
    throw new Error('Already submitted')
  }

  const min = task.minPhotos ?? WALKAROUND_MIN_PHOTOS
  const photos = task.photos ?? []
  if (photos.length < min) {
    throw new Error(`Need ${min} photos — ${photos.length} taken`)
  }

  const slots = new Set(photos.map((p) => p.slotId).filter(Boolean))
  if (slots.size < min) {
    throw new Error(`Fill all ${min} walkaround angles before submitting`)
  }

  const now = new Date().toISOString()
  task.status = 'Complete'
  task.completedAt = now
  task.completedByWorkerId = opts.workerId
  task.photosLockedAt = now
  task.skipNote = undefined

  appendAudit(job, {
    workerId: opts.workerId,
    action: 'walkaround_submitted',
    summary: `Submitted walkaround (${photos.length} photos) — locked`,
    taskId: task.id,
    taskName: task.taskName,
  })
  appendAudit(job, {
    workerId: opts.workerId,
    action: 'task_completed',
    summary: `Completed “${task.taskName}”`,
    taskId: task.id,
    taskName: task.taskName,
  })

  if (!job.assignedWorkerIds.includes(opts.workerId)) {
    job.assignedWorkerIds = [...job.assignedWorkerIds, opts.workerId]
  }

  return finalizeTaskProgress(job)
}

export function firebaseEnabled(): boolean {
  return isFirebaseConfigured()
}

export function skipTask(opts: {
  jobId: string
  taskId: string
  workerId: string
  note?: string
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const task = job.tasks.find((t) => t.id === opts.taskId)
  if (!task) return null

  if (!task.skippable) {
    throw new Error('This step cannot be skipped')
  }

  task.status = 'Skipped'
  task.completedAt = new Date().toISOString()
  task.completedByWorkerId = opts.workerId
  task.skipNote = opts.note?.trim() || 'Not fitted on this vehicle'
  task.media = undefined

  appendAudit(job, {
    workerId: opts.workerId,
    action: 'task_skipped',
    summary: `Skipped “${task.taskName}”${task.skipNote ? ` — ${task.skipNote}` : ''}`,
    taskId: task.id,
    taskName: task.taskName,
  })

  if (!job.assignedWorkerIds.includes(opts.workerId)) {
    job.assignedWorkerIds = [...job.assignedWorkerIds, opts.workerId]
  }

  return finalizeTaskProgress(job)
}

export function addJobNote(opts: {
  jobId: string
  workerId: string
  text: string
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const text = opts.text.trim()
  if (!text) throw new Error('Note cannot be empty')

  const note: JobNote = {
    id: uid(),
    workerId: opts.workerId,
    text,
    createdAt: new Date().toISOString(),
  }

  job.notes = [note, ...(job.notes ?? [])]
  appendAudit(job, {
    workerId: opts.workerId,
    action: 'note_added',
    summary: `Note: ${text}`,
  })
  updateJob(job)
  vibrate()
  return job
}

export function setAssignedWorkers(opts: {
  jobId: string
  workerIds: string[]
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null
  job.assignedWorkerIds = opts.workerIds
  updateJob(job)
  return job
}

export function toggleJobTimer(opts: { jobId: string; workerId?: string }): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const now = Date.now()
  if (job.timerStartedAt) {
    const elapsed = Math.floor((now - new Date(job.timerStartedAt).getTime()) / 1000)
    job.timerSecondsAccumulated = (job.timerSecondsAccumulated ?? 0) + elapsed
    job.timerStartedAt = undefined
    if (opts.workerId) {
      appendAudit(job, {
        workerId: opts.workerId,
        action: 'timer_stopped',
        summary: `Work timer stopped (+${elapsed}s)`,
      })
    }
  } else {
    job.timerStartedAt = new Date().toISOString()
    if (job.status === 'Coming') job.status = 'In Workshop'
    if (opts.workerId) {
      appendAudit(job, {
        workerId: opts.workerId,
        action: 'timer_started',
        summary: 'Work timer started',
      })
    }
  }

  updateJob(job)
  return job
}
