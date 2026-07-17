import { MOCK_JOBS } from '../data/mockJobs'
import { PACKAGE_TEMPLATES } from '../data/templates'
import type { Job, JobNote, JobTask, Session } from '../types'
import { isTaskResolved } from '../types'

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
    tasks,
  }

  const jobs = loadJobs()
  jobs.unshift(job)
  saveJobs(jobs)
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
}): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const task = job.tasks.find((t) => t.id === opts.taskId)
  if (!task) return null

  if (task.requiresPhoto && !opts.photoDataUrl) {
    throw new Error('Photo required')
  }

  task.status = 'Complete'
  task.completedAt = new Date().toISOString()
  task.completedByWorkerId = opts.workerId
  task.skipNote = undefined
  if (opts.photoDataUrl) {
    task.media = {
      id: uid(),
      dataUrl: opts.photoDataUrl,
      capturedAt: new Date().toISOString(),
    }
  }

  if (!job.assignedWorkerIds.includes(opts.workerId)) {
    job.assignedWorkerIds = [...job.assignedWorkerIds, opts.workerId]
  }

  return finalizeTaskProgress(job)
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

export function toggleJobTimer(opts: { jobId: string }): Job | null {
  const job = getJob(opts.jobId)
  if (!job) return null

  const now = Date.now()
  if (job.timerStartedAt) {
    const elapsed = Math.floor((now - new Date(job.timerStartedAt).getTime()) / 1000)
    job.timerSecondsAccumulated = (job.timerSecondsAccumulated ?? 0) + elapsed
    job.timerStartedAt = undefined
  } else {
    job.timerStartedAt = new Date().toISOString()
    if (job.status === 'Coming') job.status = 'In Workshop'
  }

  updateJob(job)
  return job
}
