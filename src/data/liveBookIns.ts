import { PACKAGE_TEMPLATES } from './templates'
import type { Job, JobTask } from '../types'

/** Stable id so reloads / re-deploys update the same card instead of duplicating. */
export const PAJERO_JOB_ID = 'live-mp37nsgp-2026-07-20'
export const DMAX_JOB_ID = 'live-dmax-acvtfs40jtd212313'
export const HILUX_JOB_ID = 'live-hilux-lr90ccgp-2026-07-22'

/** 20 Jul 2026 08:50 SAST */
const PAJERO_START = '2026-07-20T06:50:00.000Z'
const PAJERO_WHEELS = '2026-07-20T07:08:00.000Z'
const PAJERO_DONE = '2026-07-20T10:30:00.000Z'

/** D-Max book-in ~ morning strip underway */
const DMAX_START = '2026-07-20T08:00:00.000Z'

/** Hilux front bumper — 22 Jul 2026 morning SAST */
const HILUX_START = '2026-07-22T06:30:00.000Z'
/** Progress update ~ strip bash plate underway */
const HILUX_STRIP = '2026-07-22T06:58:00.000Z'
/** OEM strip done — unpacking new bumper */
const HILUX_UNPACK = '2026-07-22T07:02:00.000Z'

const HILUX_STRIP_DONE_IDS = new Set([
  'fb-1',
  'fb-strip-1',
  'fb-strip-covers',
  'fb-strip-2',
  'fb-strip-harness',
  'fb-strip-bumper',
  'fb-strip-mid-cover',
  'fb-strip-crashbar',
  'fb-strip-bash',
  'fb-2',
])

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

function doneTask(
  id: string,
  taskName: string,
  stepOrder: number,
  at: string,
  workerId = 'themba',
): JobTask {
  return {
    id,
    taskName,
    requiresPhoto: false,
    skippable: false,
    phase: 'Work',
    stepOrder,
    status: 'Complete',
    completedAt: at,
    completedByWorkerId: workerId,
  }
}

function pendingTask(
  id: string,
  taskName: string,
  stepOrder: number,
  opts?: { requiresPhoto?: boolean; photoMode?: JobTask['photoMode']; minPhotos?: number },
): JobTask {
  const photoMode = opts?.photoMode
  return {
    id,
    taskName,
    requiresPhoto: opts?.requiresPhoto ?? false,
    skippable: false,
    phase: 'Work',
    stepOrder,
    status: 'Pending',
    ...(photoMode ? { photoMode } : {}),
    ...(opts?.minPhotos ? { minPhotos: opts.minPhotos } : {}),
    ...(photoMode === 'walkaround' || photoMode === 'multi' ? { photos: [] } : {}),
  }
}

function pajeroJob(): Job {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === 'rear-suspension-trailer-plug')!

  const tasks: JobTask[] = [
    doneTask(`${PAJERO_JOB_ID}-v3-brake`, 'Brake lines and ABS wiring checked for stretch / clearance', 1, PAJERO_DONE),
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

  return {
    id: PAJERO_JOB_ID,
    registration: 'MP37NSGP',
    make: 'Mitsubishi',
    model: 'Pajero Sport',
    year: '2022',
    packageId: template.id,
    packageName: template.packageName,
    status: 'In Workshop',
    intakeDate: PAJERO_START,
    assignedWorkerIds: ['thando', 'themba'],
    notes: [
      {
        id: `${PAJERO_JOB_ID}-note-4`,
        workerId: 'themba',
        text: 'Vehicle complete. Upload now: (1) 4 shock photos before wheels on, (2) trailer plug installed & tested photos, (3) final 8-angle walkaround. Then Jaco releases.',
        createdAt: PAJERO_DONE,
      },
      {
        id: `${PAJERO_JOB_ID}-note-3`,
        workerId: 'themba',
        text: 'Shocks only — no springs. Each rear shock: top bolt + bottom bolt. Trailer plug tested OK.',
        createdAt: PAJERO_WHEELS,
      },
      {
        id: `${PAJERO_JOB_ID}-note-1`,
        workerId: 'thando',
        text: 'Booked in by Thando. Work: rear shocks + trailer plug. Start 08h50.',
        createdAt: PAJERO_START,
      },
    ],
    auditLog: [
      {
        id: `${PAJERO_JOB_ID}-audit-5`,
        at: PAJERO_DONE,
        workerId: 'themba',
        action: 'note_added',
        summary: 'Work complete — open for retrospective photo upload',
      },
      {
        id: `${PAJERO_JOB_ID}-audit-2`,
        at: PAJERO_START,
        workerId: 'themba',
        action: 'timer_started',
        summary: 'Work timer started',
      },
    ],
    tasks,
    timerSecondsAccumulated: Math.floor(
      (new Date(PAJERO_DONE).getTime() - new Date(PAJERO_START).getTime()) / 1000,
    ),
  }
}

function dmaxJob(): Job {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === 'dmax-mcc-leaf-winch')!

  const tasks: JobTask[] = [
    walkaroundTask(
      `${DMAX_JOB_ID}-t1`,
      'Book-in walkaround photos (8 angles)',
      1,
      'Pending',
    ),

    // Leaf — priority first complete; already stripped
    multiTask(
      `${DMAX_JOB_ID}-leaf-1`,
      'Rear wheels off — photos',
      10,
      2,
      'Complete',
      { completedAt: DMAX_START, completedByWorkerId: 'themba', photosLockedAt: DMAX_START },
    ),
    {
      id: `${DMAX_JOB_ID}-leaf-2`,
      taskName: 'Rear leaf packs out — photo of mounts / U-bolts / hardware bagged',
      requiresPhoto: true,
      skippable: false,
      phase: 'Work',
      stepOrder: 11,
      status: 'Complete',
      completedAt: DMAX_START,
      completedByWorkerId: 'themba',
    },
    multiTask(
      `${DMAX_JOB_ID}-leaf-3`,
      'Extra leaf fitted both sides — pack stacked correctly',
      12,
      2,
      'Pending',
    ),
    multiTask(
      `${DMAX_JOB_ID}-leaf-4`,
      'Leaf packs refitted — U-bolts / centre bolts torqued; photo both sides',
      13,
      2,
      'Pending',
    ),
    pendingTask(`${DMAX_JOB_ID}-leaf-5`, 'Rear wheels on — wheel nuts snugged (final torque after alignment)', 14),

    // Front strip — already done
    {
      id: `${DMAX_JOB_ID}-strip-1`,
      taskName:
        'Grille off — top plastic clips + Phillips under ISUZU badge; retain fasteners',
      requiresPhoto: true,
      skippable: false,
      phase: 'Work',
      stepOrder: 20,
      status: 'Complete',
      completedAt: DMAX_START,
      completedByWorkerId: 'themba',
    },
    {
      id: `${DMAX_JOB_ID}-strip-2`,
      taskName:
        'Bumper off — wheel-arch clips/screws, lower 10mm screws/nuts, underbody clips; unplug fog/sensor looms',
      requiresPhoto: true,
      skippable: false,
      phase: 'Work',
      stepOrder: 21,
      status: 'Complete',
      completedAt: DMAX_START,
      completedByWorkerId: 'themba',
    },
    pendingTask(
      `${DMAX_JOB_ID}-strip-3`,
      'Skid plate / crash beam / bumper supports removed as required for MCC — bag & label OEM bolts',
      22,
      { requiresPhoto: true },
    ),

    pendingTask(`${DMAX_JOB_ID}-mcc-1`, 'MCC chassis mounts / brackets fitted and torqued', 30, {
      requiresPhoto: true,
    }),
    pendingTask(`${DMAX_JOB_ID}-mcc-2`, 'Runva winch mounted to MCC / winch plate — bolts torqued', 31, {
      requiresPhoto: true,
    }),
    pendingTask(`${DMAX_JOB_ID}-mcc-3`, 'Winch power, earth, and control loom routed and connected', 32, {
      requiresPhoto: true,
    }),
    pendingTask(`${DMAX_JOB_ID}-mcc-4`, 'MCC bumper shell trial-fitted — gaps / recovery points checked', 33),
    multiTask(
      `${DMAX_JOB_ID}-mcc-5`,
      'Indicators, fog lights, DRL, and spotlights (brights) fitted to MCC',
      34,
      2,
      'Pending',
    ),
    pendingTask(
      `${DMAX_JOB_ID}-mcc-6`,
      'Light looms joined — heat-shrink/solder; routed clear of heat and pinch points',
      35,
      { requiresPhoto: true },
    ),
    pendingTask(`${DMAX_JOB_ID}-mcc-7`, 'MCC bumper final fit — mount bolts, washers, nylocks seated', 36, {
      requiresPhoto: true,
    }),
    pendingTask(
      `${DMAX_JOB_ID}-mcc-8`,
      'Function test: indicators, fog, DRL, spotlights, and Runva winch',
      37,
    ),

    pendingTask(`${DMAX_JOB_ID}-tow-1`, 'New tow ball fitted and torqued', 40, { requiresPhoto: true }),

    multiTask(
      `${DMAX_JOB_ID}-rub-1`,
      'Rubberising — external company on premises (not AOR labour); confirm areas done',
      50,
      2,
      'Pending',
    ),

    pendingTask(`${DMAX_JOB_ID}-align-1`, 'Wheel alignment completed — alignment report received', 60, {
      requiresPhoto: true,
    }),
    pendingTask(`${DMAX_JOB_ID}-align-2`, 'Wheel nuts re-torqued after alignment', 61),

    walkaroundTask(
      `${DMAX_JOB_ID}-final`,
      'Final completed vehicle walkaround (8 angles)',
      70,
      'Pending',
    ),
    {
      id: `${DMAX_JOB_ID}-qa-lights`,
      taskName: 'Re-test MCC lights + Runva winch after full fitment',
      requiresPhoto: false,
      skippable: false,
      phase: 'Final Inspection',
      stepOrder: 107,
      status: 'Pending',
    },
    {
      id: `${DMAX_JOB_ID}-qa-tow`,
      taskName: 'Tow ball / tow points checked',
      requiresPhoto: false,
      skippable: false,
      phase: 'Final Inspection',
      stepOrder: 108,
      status: 'Pending',
    },
    {
      id: `${DMAX_JOB_ID}-release`,
      taskName: 'Manager release: vehicle is safe, clean, and ready for the client',
      requiresPhoto: false,
      skippable: false,
      phase: 'Final Inspection',
      stepOrder: 199,
      status: 'Pending',
    },
  ]

  return {
    id: DMAX_JOB_ID,
    registration: 'ACVTFS40JTD212313',
    make: 'Isuzu',
    model: 'D-Max',
    year: '2025/2026',
    packageId: template.id,
    packageName: template.packageName,
    status: 'In Workshop',
    intakeDate: DMAX_START,
    assignedWorkerIds: [],
    notes: [
      {
        id: `${DMAX_JOB_ID}-note-1`,
        workerId: 'jaco',
        text: 'Brand new — no plates. VIN in windscreen: ACVTFS40JTD212313. Model 2025/2026.',
        createdAt: DMAX_START,
      },
      {
        id: `${DMAX_JOB_ID}-note-2`,
        workerId: 'jaco',
        text: 'Scope: extra leaf rear · MCC front bumper (indicators, fog, DRL, spotlights/brights) · Runva winch · new tow ball · rubberising (external on premises) · alignment before handoff.',
        createdAt: DMAX_START,
      },
      {
        id: `${DMAX_JOB_ID}-note-3`,
        workerId: 'jaco',
        text: 'Priority: leaf springs first to complete. Tow ball last easy job before alignment. Rubberising last (outside company).',
        createdAt: DMAX_START,
      },
      {
        id: `${DMAX_JOB_ID}-note-4`,
        workerId: 'jaco',
        text: 'Started: front bumper + grille off; rear wheels off; leaf packs out. Upload 8 book-in walkaround photos (front becomes job thumbnail).',
        createdAt: DMAX_START,
      },
      {
        id: `${DMAX_JOB_ID}-note-5`,
        workerId: 'jaco',
        text: 'Strip notes (D-Max): grille — top plastic clips + Phillips under badge. Bumper — wheel-arch clips/screws, lower 10mm fasteners, underbody clips; unplug fog/sensor looms before pull. Bag OEM bolts for MCC mounts.',
        createdAt: DMAX_START,
      },
    ],
    auditLog: [
      {
        id: `${DMAX_JOB_ID}-audit-1`,
        at: DMAX_START,
        workerId: 'jaco',
        action: 'note_added',
        summary: 'Booked in · VIN ACVTFS40JTD212313 · MCC/leaf/winch/tow/rubberise',
      },
      {
        id: `${DMAX_JOB_ID}-audit-2`,
        at: DMAX_START,
        workerId: 'jaco',
        action: 'timer_started',
        summary: 'Work timer started',
      },
    ],
    tasks,
    timerStartedAt: DMAX_START,
    timerSecondsAccumulated: 0,
  }
}

function hiluxJob(): Job {
  const template = PACKAGE_TEMPLATES.find((p) => p.id === 'front-bumper')!
  const tasks: JobTask[] = template.steps.map((step) => {
    const done = HILUX_STRIP_DONE_IDS.has(step.id)
    return {
      id: `${HILUX_JOB_ID}-${step.id}`,
      taskName: step.taskName,
      requiresPhoto: step.requiresPhoto,
      skippable: step.skippable,
      phase: step.phase ?? 'Work',
      stepOrder: step.stepOrder,
      status: done ? ('Complete' as const) : ('Pending' as const),
      ...(done
        ? {
            completedAt: HILUX_UNPACK,
            completedByWorkerId: 'marius2',
          }
        : {}),
      ...(step.photoMode ? { photoMode: step.photoMode } : {}),
      ...(step.minPhotos ? { minPhotos: step.minPhotos } : {}),
      ...(step.photoMode === 'walkaround' || step.photoMode === 'multi'
        ? { photos: [] }
        : {}),
    }
  })

  return {
    id: HILUX_JOB_ID,
    registration: 'LR90CCGP',
    make: 'Toyota',
    model: 'Hilux 2.4 GD-6',
    year: '—',
    packageId: template.id,
    packageName: template.packageName,
    status: 'In Workshop',
    intakeDate: HILUX_START,
    assignedWorkerIds: ['marius2'],
    notes: [
      {
        id: `${HILUX_JOB_ID}-note-1`,
        workerId: 'jaco',
        text: 'Front bumper fitment. Assigned to Marius 2 (probation start 22 Jul 2026). Confirm year model if needed.',
        createdAt: HILUX_START,
      },
      {
        id: `${HILUX_JOB_ID}-note-2`,
        workerId: 'jaco',
        text: 'Strip order (Hilux): (1) top cover above grille, (2) 2 wheel-arch front covers, (3) bottom bumper screws + wheel-arch clips, (4) bumper loose — unplug harness (light plug + 1 PDC each side), (5) bumper off, (6) plastic cover between bash plate and crash bar, (7) steel crash bar + its 2 plastic covers, (8) bash plate off. Bag & retain all fasteners.',
        createdAt: HILUX_START,
      },
      {
        id: `${HILUX_JOB_ID}-note-3`,
        workerId: 'jaco',
        text: 'Progress: bumper / covers / crash bar strip photos taken. Busy stripping the bash plate now — photo when off, then fully stripped chassis photo.',
        createdAt: HILUX_STRIP,
      },
      {
        id: `${HILUX_JOB_ID}-note-4`,
        workerId: 'jaco',
        text: 'OEM strip complete — bash plate off (photo). Stripped views: underneath + front-left + front + front-right. Now unpacking the new bumper from its wrapping.',
        createdAt: HILUX_UNPACK,
      },
    ],
    auditLog: [
      {
        id: `${HILUX_JOB_ID}-audit-1`,
        at: HILUX_START,
        workerId: 'jaco',
        action: 'note_added',
        summary: 'Booked in · LR90CCGP Hilux 2.4 GD-6 · front bumper · Marius 2',
      },
      {
        id: `${HILUX_JOB_ID}-audit-2`,
        at: HILUX_START,
        workerId: 'jaco',
        action: 'note_added',
        summary: 'Strip steps · bumper / harness / wheel-arch covers',
      },
      {
        id: `${HILUX_JOB_ID}-audit-3`,
        at: HILUX_STRIP,
        workerId: 'jaco',
        action: 'note_added',
        summary: 'Crash bar + covers steps added · bash plate strip in progress',
      },
      {
        id: `${HILUX_JOB_ID}-audit-4`,
        at: HILUX_UNPACK,
        workerId: 'jaco',
        action: 'note_added',
        summary: 'OEM strip complete · unpacking new bumper',
      },
    ],
    tasks,
    timerStartedAt: HILUX_START,
    timerSecondsAccumulated: 0,
  }
}

/**
 * Real workshop book-ins we push with the app when Firestore writes
 * are not available from the agent environment.
 */
export function getLiveBookIns(): Job[] {
  return [hiluxJob(), dmaxJob(), pajeroJob()]
}
