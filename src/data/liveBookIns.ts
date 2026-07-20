import { PACKAGE_TEMPLATES } from './templates'
import type { Job, JobTask } from '../types'

/** Stable id so reloads / re-deploys update the same card instead of duplicating. */
export const PAJERO_JOB_ID = 'live-mp37nsgp-2026-07-20'

/** 20 Jul 2026 08:50 SAST */
const START_AT = '2026-07-20T06:50:00.000Z'
/** 20 Jul 2026 09:08 SAST — rear wheels off */
const WHEELS_OFF_AT = '2026-07-20T07:08:00.000Z'
/** Work finished — uploading photos retrospectively */
const DONE_AT = '2026-07-20T10:30:00.000Z'

function multiTask(
  id: string,
  taskName: string,
  stepOrder: number,
  minPhotos: number,
  status: JobTask['status'],
  extra?: Partial<JobTask>,
): JobTask {
  return {
    id,
    taskName,
    requiresPhoto: true,
    skippable: false,
    phase: 'Work',
    stepOrder,
    status,
    photoMode: 'multi',
    minPhotos,
    photos: [],
    ...extra,
  }
}

function walkaroundTask(
  id: string,
  taskName: string,
  stepOrder: number,
  status: JobTask['status'],
  extra?: Partial<JobTask>,
): JobTask {
  return {
    id,
    taskName,
    requiresPhoto: true,
    skippable: false,
    phase: 'Work',
    stepOrder,
    status,
    photoMode: 'walkaround',
    minPhotos: 8,
    photos: [],
    ...extra,
  }
}

/**
 * Real workshop book-ins we push with the app when Firestore writes
 * are not available from the agent environment.
 * Matched by stable id / registration — safe to re-run.
 *
 * MP37NSGP work is done — checklist is only the photo packs still to upload.
 */
export function getLiveBookIns(): Job[] {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === 'rear-suspension-trailer-plug')!

  const tasks: JobTask[] = [
    {
      id: `${PAJERO_JOB_ID}-v3-brake`,
      taskName: 'Brake lines and ABS wiring checked for stretch / clearance',
      requiresPhoto: false,
      skippable: false,
      phase: 'Work',
      stepOrder: 1,
      status: 'Complete',
      completedAt: DONE_AT,
      completedByWorkerId: 'themba',
    },
    multiTask(
      `${PAJERO_JOB_ID}-v3-shocks`,
      'Shock replacement photos — 4 photos (before wheels back on)',
      2,
      4,
      'Pending',
    ),
    multiTask(
      `${PAJERO_JOB_ID}-v3-plug`,
      'Trailer plug installed & tested — photos',
      3,
      2,
      'Pending',
    ),
    walkaroundTask(
      `${PAJERO_JOB_ID}-v3-final`,
      'Final completed vehicle walkaround (8 angles)',
      4,
      'Pending',
    ),
    {
      id: `${PAJERO_JOB_ID}-v3-release`,
      taskName: 'Manager release: vehicle is safe, clean, and ready for the client',
      requiresPhoto: false,
      skippable: false,
      phase: 'Final Inspection',
      stepOrder: 199,
      status: 'Pending',
    },
  ]

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
          id: `${PAJERO_JOB_ID}-note-4`,
          workerId: 'themba',
          text: 'Vehicle complete. Upload now: (1) 4 shock photos before wheels on, (2) trailer plug installed & tested photos, (3) final 8-angle walkaround. Then Jaco releases.',
          createdAt: DONE_AT,
        },
        {
          id: `${PAJERO_JOB_ID}-note-3`,
          workerId: 'themba',
          text: 'Shocks only — no springs. Each rear shock: top bolt + bottom bolt. Trailer plug tested OK.',
          createdAt: WHEELS_OFF_AT,
        },
        {
          id: `${PAJERO_JOB_ID}-note-2`,
          workerId: 'themba',
          text: '09h08 — Rear wheels off.',
          createdAt: WHEELS_OFF_AT,
        },
        {
          id: `${PAJERO_JOB_ID}-note-1`,
          workerId: 'thando',
          text: 'Booked in by Thando. Work: rear shocks + trailer plug. Start 08h50. Thando and Themba on this car.',
          createdAt: START_AT,
        },
      ],
      auditLog: [
        {
          id: `${PAJERO_JOB_ID}-audit-5`,
          at: DONE_AT,
          workerId: 'themba',
          action: 'note_added',
          summary: 'Work complete — open for retrospective photo upload',
        },
        {
          id: `${PAJERO_JOB_ID}-audit-4`,
          at: WHEELS_OFF_AT,
          workerId: 'themba',
          action: 'note_added',
          summary: 'Shocks only — top + bottom bolt each side; no springs',
        },
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
          summary: 'Booked in · rear shocks + trailer plug · start 08h50',
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
      timerStartedAt: undefined,
      timerSecondsAccumulated: Math.floor(
        (new Date(DONE_AT).getTime() - new Date(START_AT).getTime()) / 1000,
      ),
    },
  ]
}
