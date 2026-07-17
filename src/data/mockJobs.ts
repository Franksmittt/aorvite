import { PACKAGE_TEMPLATES } from './templates'
import type { Job, JobNote, JobStatus, JobTask } from '../types'

function uid(seed: string) {
  return `mock-${seed}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursAgo(n: number) {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

function buildTasks(
  packageId: string,
  completeCount: number,
  skipIds: string[] = [],
  workerId = 'jovan',
): JobTask[] {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === packageId)
  if (!template) return []

  return template.steps.map((step, index) => {
    const base: JobTask = {
      id: uid(`${packageId}-task-${step.id}`),
      taskName: step.taskName,
      requiresPhoto: step.requiresPhoto,
      skippable: step.skippable,
      phase: step.phase ?? 'Work',
      stepOrder: step.stepOrder,
      status: 'Pending',
    }

    if (skipIds.includes(step.id) && step.skippable) {
      return {
        ...base,
        status: 'Skipped',
        completedAt: hoursAgo(2),
        completedByWorkerId: workerId,
        skipNote: 'Not fitted on this vehicle',
      }
    }

    if (index < completeCount) {
      return {
        ...base,
        status: 'Complete',
        completedAt: hoursAgo(completeCount - index),
        completedByWorkerId: workerId,
      }
    }

    return base
  })
}

function note(seed: string, workerId: string, text: string, hours: number): JobNote {
  return {
    id: uid(`note-${seed}`),
    workerId,
    text,
    createdAt: hoursAgo(hours),
  }
}

type MockSpec = {
  id: string
  registration: string
  make: string
  model: string
  year: string
  packageId: string
  status: JobStatus
  intakeDaysAgo: number
  assignedWorkerIds: string[]
  completeCount: number
  skipIds?: string[]
  notes?: JobNote[]
  releasedAt?: string
  workerForTasks?: string
}

function makeJob(spec: MockSpec): Job {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === spec.packageId)!
  const tasks = buildTasks(
    spec.packageId,
    spec.completeCount,
    spec.skipIds,
    spec.workerForTasks ?? spec.assignedWorkerIds[0] ?? 'jovan',
  )

  // Force status consistency for inspection / gone-out mocks
  if (spec.status === 'Final Inspection' || spec.status === 'Gone Out') {
    for (const task of tasks) {
      if (task.phase === 'Work' && task.status === 'Pending') {
        task.status = task.skippable ? 'Skipped' : 'Complete'
        task.completedAt = hoursAgo(1)
        task.completedByWorkerId = spec.workerForTasks ?? 'jovan'
        if (task.status === 'Skipped') task.skipNote = 'Not fitted on this vehicle'
      }
    }
  }

  if (spec.status === 'Gone Out') {
    for (const task of tasks) {
      if (task.status === 'Pending') {
        task.status = task.skippable ? 'Skipped' : 'Complete'
        task.completedAt = hoursAgo(1)
        task.completedByWorkerId = 'marius'
        if (task.status === 'Skipped') task.skipNote = 'Not fitted on this vehicle'
      }
    }
  }

  if (spec.status === 'Final Inspection') {
    for (const task of tasks) {
      if (task.phase === 'Final Inspection') {
        task.status = 'Pending'
        task.completedAt = undefined
        task.completedByWorkerId = undefined
        task.skipNote = undefined
      }
    }
  }

  return {
    id: spec.id,
    registration: spec.registration,
    make: spec.make,
    model: spec.model,
    year: spec.year,
    packageId: template.id,
    packageName: template.packageName,
    status: spec.status,
    intakeDate: daysAgo(spec.intakeDaysAgo),
    assignedWorkerIds: spec.assignedWorkerIds,
    notes: spec.notes ?? [],
    tasks,
    releasedAt: spec.releasedAt,
  }
}

export const MOCK_JOBS: Job[] = [
  makeJob({
    id: 'job-coming-1',
    registration: 'JP 45 GP',
    make: 'Toyota',
    model: 'Hilux 2.8 GD-6',
    year: '2023',
    packageId: 'front-bumper',
    status: 'Coming',
    intakeDaysAgo: 0,
    assignedWorkerIds: ['jovan', 'themba'],
    completeCount: 0,
    notes: [note('c1', 'marius', 'Customer dropping off tomorrow morning. Front bar + spotlights.', 3)],
  }),
  makeJob({
    id: 'job-coming-2',
    registration: 'HL 12 MP',
    make: 'Toyota',
    model: 'Land Cruiser 79',
    year: '2021',
    packageId: 'rear-bumper',
    status: 'Coming',
    intakeDaysAgo: 1,
    assignedWorkerIds: ['thando'],
    completeCount: 0,
  }),
  makeJob({
    id: 'job-shop-1',
    registration: 'CA 88 NW',
    make: 'Toyota',
    model: 'Hilux 2.8 GD-6',
    year: '2022',
    packageId: 'front-bumper',
    status: 'In Workshop',
    intakeDaysAgo: 1,
    assignedWorkerIds: ['jovan', 'themba'],
    completeCount: 6,
    skipIds: ['fb-6'],
    notes: [
      note('s1a', 'jovan', 'Broke one plastic grille clip on teardown — ordered replacement.', 5),
      note('s1b', 'themba', 'Slight scratch on LH fog surround — polished, photo in notes later if needed.', 4),
    ],
    workerForTasks: 'jovan',
  }),
  makeJob({
    id: 'job-shop-2',
    registration: 'KN 33 GP',
    make: 'Toyota',
    model: 'Hilux 2.4 GD-6',
    year: '2019',
    packageId: 'rear-bumper',
    status: 'In Workshop',
    intakeDaysAgo: 2,
    assignedWorkerIds: ['thando'],
    completeCount: 4,
    skipIds: ['rb-4'],
    notes: [note('s2', 'thando', 'No reverse camera on this bakkie — skipped camera steps.', 6)],
  }),
  makeJob({
    id: 'job-shop-3',
    registration: 'FS 19 FS',
    make: 'Toyota',
    model: 'Fortuner',
    year: '2020',
    packageId: 'suspension-lift',
    status: 'In Workshop',
    intakeDaysAgo: 2,
    assignedWorkerIds: ['jovan', 'thando'],
    completeCount: 3,
    notes: [note('s3', 'jovan', 'Waiting on rear shocks from supplier — ETA this afternoon.', 8)],
  }),
  makeJob({
    id: 'job-shop-4',
    registration: 'WC 77 WC',
    make: 'Ford',
    model: 'Ranger',
    year: '2024',
    packageId: 'lights-accessories',
    status: 'In Workshop',
    intakeDaysAgo: 0,
    assignedWorkerIds: ['themba'],
    completeCount: 2,
  }),
  makeJob({
    id: 'job-inspect-1',
    registration: 'GP 01 AA',
    make: 'Toyota',
    model: 'Hilux 2.8 GD-6',
    year: '2021',
    packageId: 'front-bumper',
    status: 'Final Inspection',
    intakeDaysAgo: 3,
    assignedWorkerIds: ['jovan', 'themba'],
    completeCount: 99,
    skipIds: ['fb-5', 'fb-6', 'fb-qa-winch'],
    notes: [
      note('i1', 'jovan', 'Wiring joins heat-shrunk. Sensors tested before shell went on.', 10),
      note('i1b', 'themba', 'Ready for Marius final inspection / client release.', 2),
    ],
  }),
  makeJob({
    id: 'job-inspect-2',
    registration: 'LIM 55 L',
    make: 'Toyota',
    model: 'Land Cruiser 79',
    year: '2018',
    packageId: 'suspension-lift',
    status: 'Final Inspection',
    intakeDaysAgo: 4,
    assignedWorkerIds: ['thando', 'jovan'],
    completeCount: 99,
    notes: [note('i2', 'thando', 'Alignment booked — report photo still needed on final checklist.', 3)],
  }),
  makeJob({
    id: 'job-out-1',
    registration: 'ND 22 ZN',
    make: 'Toyota',
    model: 'Hilux 2.8 GD-6',
    year: '2020',
    packageId: 'rear-bumper',
    status: 'Gone Out',
    intakeDaysAgo: 6,
    assignedWorkerIds: ['themba'],
    completeCount: 99,
    skipIds: ['rb-qa-tow'],
    releasedAt: daysAgo(1),
    notes: [note('o1', 'marius', 'Released to client. All lights and sensors OK.', 24)],
  }),
  makeJob({
    id: 'job-out-2',
    registration: 'EC 90 EC',
    make: 'Toyota',
    model: 'Hilux 2.4 GD-6',
    year: '2017',
    packageId: 'exhaust-upgrade',
    status: 'Gone Out',
    intakeDaysAgo: 8,
    assignedWorkerIds: ['jovan'],
    completeCount: 99,
    releasedAt: daysAgo(3),
  }),
  makeJob({
    id: 'job-out-3',
    registration: 'MP 14 BB',
    make: 'Toyota',
    model: 'Land Cruiser 76',
    year: '2019',
    packageId: 'front-bumper',
    status: 'Gone Out',
    intakeDaysAgo: 10,
    assignedWorkerIds: ['jovan', 'thando'],
    completeCount: 99,
    releasedAt: daysAgo(5),
    notes: [note('o3', 'jaco', 'Client happy. Spotlights aim adjusted on release.', 48)],
  }),
]
