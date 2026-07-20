import { PACKAGE_TEMPLATES } from './templates'
import type { Job, JobTask } from '../types'

/** Stable id so reloads / re-deploys update the same card instead of duplicating. */
export const PAJERO_JOB_ID = 'live-mp37nsgp-2026-07-20'

/** 20 Jul 2026 08:50 SAST */
const START_AT = '2026-07-20T06:50:00.000Z'
/** 20 Jul 2026 09:08 SAST — rear wheels off */
const WHEELS_OFF_AT = '2026-07-20T07:08:00.000Z'

function buildTasks(packageId: string): JobTask[] {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === packageId)
  if (!template) throw new Error(`Unknown package ${packageId}`)
  return template.steps.map((step, index) => ({
    id: `${PAJERO_JOB_ID}-t${index + 1}`,
    taskName: step.taskName,
    requiresPhoto: step.requiresPhoto,
    skippable: step.skippable,
    phase: step.phase ?? 'Work',
    stepOrder: step.stepOrder,
    status: 'Pending' as const,
    ...(step.photoMode ? { photoMode: step.photoMode } : {}),
    ...(step.minPhotos ? { minPhotos: step.minPhotos } : {}),
    ...(step.photoMode === 'walkaround' ? { photos: [] } : {}),
  }))
}

/**
 * Real workshop book-ins we push with the app when Firestore writes
 * are not available from the agent environment.
 * Matched by stable id / registration — safe to re-run.
 */
export function getLiveBookIns(): Job[] {
  const packageId = 'rear-suspension-trailer-plug'
  const template = PACKAGE_TEMPLATES.find((p) => p.id === packageId)!
  const tasks = buildTasks(packageId)

  return [
    {
      id: PAJERO_JOB_ID,
      registration: 'MP37NSGP',
      make: 'Mitsubishi',
      model: 'Pajero Sport',
      year: '2022',
      packageId: template.id,
      packageName: template.packageName,
      status: 'In Workshop',
      intakeDate: START_AT,
      assignedWorkerIds: ['thando', 'themba'],
      notes: [
        {
          id: `${PAJERO_JOB_ID}-note-2`,
          workerId: 'themba',
          text: '09h08 — Rear wheels off. Progress photos taken on the floor (WhatsApp).',
          createdAt: WHEELS_OFF_AT,
        },
        {
          id: `${PAJERO_JOB_ID}-note-1`,
          workerId: 'thando',
          text: 'Booked in by Thando. Work: rear suspension + trailer plug. Start 08h50. Thando and Themba on this car.',
          createdAt: START_AT,
        },
      ],
      auditLog: [
        {
          id: `${PAJERO_JOB_ID}-audit-3`,
          at: WHEELS_OFF_AT,
          workerId: 'themba',
          action: 'note_added',
          summary: '09h08 — Rear wheels off',
        },
        {
          id: `${PAJERO_JOB_ID}-audit-1`,
          at: START_AT,
          workerId: 'thando',
          action: 'note_added',
          summary: 'Booked in · rear suspension + trailer plug · start 08h50',
        },
        {
          id: `${PAJERO_JOB_ID}-audit-2`,
          at: START_AT,
          workerId: 'themba',
          action: 'timer_started',
          summary: 'Work timer started',
        },
      ],
      tasks,
      timerStartedAt: START_AT,
      timerSecondsAccumulated: 0,
    },
  ]
}
