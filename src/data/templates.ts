import type { PackageTemplate, TaskTemplateStep } from '../types'

const FINAL_INSPECTION: TaskTemplateStep[] = [
  {
    id: 'qa-1',
    stepOrder: 100,
    phase: 'Final Inspection',
    taskName: 'Full walk-around: no new scratches, dents, marks, or loose trim',
    requiresPhoto: false,
    skippable: false,
  },
  {
    id: 'qa-2',
    stepOrder: 101,
    phase: 'Final Inspection',
    taskName: 'All lights tested: indicators, hazards, DRL, spotlights, brake and reverse lights',
    requiresPhoto: false,
    skippable: false,
  },
  {
    id: 'qa-3',
    stepOrder: 102,
    phase: 'Final Inspection',
    taskName: 'Parking sensors / PDC tested and working',
    requiresPhoto: false,
    skippable: true,
  },
  {
    id: 'qa-4',
    stepOrder: 103,
    phase: 'Final Inspection',
    taskName: 'Camera / radar tested and correctly aligned',
    requiresPhoto: false,
    skippable: true,
  },
  {
    id: 'qa-5',
    stepOrder: 104,
    phase: 'Final Inspection',
    taskName: 'Dashboard checked: no new warning lights or fault messages',
    requiresPhoto: false,
    skippable: false,
  },
  {
    id: 'qa-6',
    stepOrder: 105,
    phase: 'Final Inspection',
    taskName: 'Road test: steering straight, no vibration, rattles, or unusual noise',
    requiresPhoto: false,
    skippable: false,
  },
  {
    id: 'qa-7',
    stepOrder: 106,
    phase: 'Final Inspection',
    taskName: 'Final fastener, clip, washer, and wiring safety check completed',
    requiresPhoto: false,
    skippable: false,
  },
]

const FINAL_RELEASE: TaskTemplateStep[] = [
  {
    id: 'qa-photo',
    stepOrder: 198,
    phase: 'Final Inspection',
    taskName: 'Final vehicle condition and completed work photos',
    requiresPhoto: true,
    skippable: false,
  },
  {
    id: 'qa-release',
    stepOrder: 199,
    phase: 'Final Inspection',
    taskName: 'Manager release: vehicle is safe, clean, and ready for the client',
    requiresPhoto: false,
    skippable: false,
  },
]

/** Shared electrical / loom quality gates used on bumper & lighting jobs */
const WIRING_WORKMANSHIP: TaskTemplateStep[] = [
  {
    id: 'wire-1',
    stepOrder: 40,
    taskName: 'Old sensor / light plugs identified and labelled before disconnect',
    requiresPhoto: false,
    skippable: false,
  },
  {
    id: 'wire-2',
    stepOrder: 41,
    taskName: 'Joins / splices: heat-shrink or soldered joints — no twist-tape only',
    requiresPhoto: true,
    skippable: false,
  },
  {
    id: 'wire-3',
    stepOrder: 42,
    taskName: 'Loom routed away from sharp edges, exhaust heat, and pinch points',
    requiresPhoto: false,
    skippable: false,
  },
  {
    id: 'wire-4',
    stepOrder: 43,
    taskName: 'Photo of completed loom and joins before bumper shell goes on',
    requiresPhoto: true,
    skippable: false,
  },
  {
    id: 'wire-5',
    stepOrder: 44,
    taskName: 'Function test before final fit: sensors, indicators, DRL, spotlights',
    requiresPhoto: false,
    skippable: false,
  },
]

export const PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    id: 'front-bumper',
    packageName: 'Front Bumper Fitment',
    steps: [
      { id: 'fb-1', stepOrder: 1, taskName: '1. Pre-inspection walkaround photos (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      // Strip order (Hilux): bumper off → mid cover → crash bar + covers → bash plate → stripped photos → unpack new bumper
      { id: 'fb-strip-1', stepOrder: 2, taskName: '2. Strip top cover above the grille — retain clips/fasteners; photo', requiresPhoto: true, skippable: false },
      { id: 'fb-strip-covers', stepOrder: 3, taskName: '3. Remove 2 covers in front of the wheel arches — photo of both covers', requiresPhoto: true, skippable: false },
      { id: 'fb-strip-2', stepOrder: 4, taskName: '4. Remove bottom bumper screws + wheel-arch clips (both sides); photo', requiresPhoto: true, skippable: false },
      { id: 'fb-strip-harness', stepOrder: 5, taskName: '5. Bumper loose — unplug harness: light plug + 1 PDC each side; photo L/R', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'fb-strip-bumper', stepOrder: 6, taskName: '6. Front bumper off on the ground — 2 photos', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'fb-strip-mid-cover', stepOrder: 7, taskName: '7. Remove plastic cover between bash plate and crash bar; photo', requiresPhoto: true, skippable: false },
      { id: 'fb-strip-crashbar', stepOrder: 8, taskName: '8. Remove steel crash bar + its 2 plastic covers — photo covers + crash bar', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 3 },
      { id: 'fb-strip-bash', stepOrder: 9, taskName: '9. Remove bash plate (skid plate) — bag bolts; photo', requiresPhoto: true, skippable: false },
      { id: 'fb-2', stepOrder: 10, taskName: '10. Fully stripped front — underneath + front-left + front + front-right', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 4 },
      { id: 'fb-unpack', stepOrder: 11, taskName: '11. Unpack new bumper from wrapping — inspect for damage; photo', requiresPhoto: true, skippable: false },
      // Chassis brackets on first — bolts snug only; final torque after bumper gap set
      { id: 'fb-brackets', stepOrder: 12, taskName: '12. Chassis bumper-mount brackets fitted — bolts snug only (not final torque); 3 photos', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 3 },
      // 4 bumper lights: outer L/R = DRL+park+indicator combo; centre 2 = fogs. Piggyback into OEM light backs (no extra plugs).
      { id: 'fb-lights-mount', stepOrder: 13, taskName: '13. Confirm 4 prebuilt bumper lights — outer L/R combo (DRL/park/indicator) + 2 centre fogs; photo all 4', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 4 },
      { id: 'fb-lights-remove-l', stepOrder: 14, taskName: '14. Remove vehicle LEFT light for piggyback access — photo light off vehicle', requiresPhoto: true, skippable: false },
      { id: 'fb-lights-remove-r', stepOrder: 15, taskName: '15. Remove vehicle RIGHT light for piggyback access — photo light off vehicle', requiresPhoto: true, skippable: false },
      { id: 'fb-lights-wire-l', stepOrder: 16, taskName: '16. Wire outer LEFT combo into back of vehicle L light (piggyback splice — DRL/park/indicator); photo join', requiresPhoto: true, skippable: false },
      { id: 'fb-lights-wire-r', stepOrder: 17, taskName: '17. Wire outer RIGHT combo into back of vehicle R light (piggyback splice — DRL/park/indicator); photo join', requiresPhoto: true, skippable: false },
      { id: 'fb-lights-wire-fog', stepOrder: 18, taskName: '18. Wire centre fog lights into vehicle fog circuit (piggyback L+R); photo both joins', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'fb-lights-joins', stepOrder: 19, taskName: '19. All light splices heat-shrink/soldered — no twist-tape; loom clear of heat/pinch; photo joins', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'fb-lights-refit-l', stepOrder: 20, taskName: '20. Refit vehicle LEFT light — fasteners seated and tightened; photo', requiresPhoto: true, skippable: false },
      { id: 'fb-lights-refit-r', stepOrder: 21, taskName: '21. Refit vehicle RIGHT light — fasteners seated and tightened; photo', requiresPhoto: true, skippable: false },
      { id: 'fb-lights-test', stepOrder: 22, taskName: '22. Function test lights: DRL/park L+R, indicator L+R+hazards, both fogs — photo each mode working', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 4 },
      { id: 'fb-3', stepOrder: 23, taskName: '23. Front parking sensors seated (L/R) — 4 photos: top + side each side', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 4 },
      { id: 'fb-5', stepOrder: 24, taskName: 'Spotlights / light bar mounts fitted (if on job)', requiresPhoto: false, skippable: true },
      { id: 'fb-6', stepOrder: 25, taskName: 'Front camera / radar remounted (if fitted)', requiresPhoto: false, skippable: true },
      { id: 'fb-8', stepOrder: 50, taskName: 'Photo of masked cut lines before cutting', requiresPhoto: true, skippable: false },
      { id: 'fb-9', stepOrder: 51, taskName: 'Chassis bracket bolts final-torqued after bumper gaps set — washers/nylocks seated; photo', requiresPhoto: true, skippable: false },
      { id: 'fb-10', stepOrder: 52, taskName: 'Photo of drilled pin holes with rust-proofing', requiresPhoto: true, skippable: false },
      { id: 'fb-11', stepOrder: 53, taskName: 'Final alignment gap photos', requiresPhoto: true, skippable: false },
      ...FINAL_INSPECTION,
      { id: 'fb-qa-gap', stepOrder: 107, phase: 'Final Inspection', taskName: 'Bumper alignment, body clearance, recovery points, and mounting torque verified', requiresPhoto: false, skippable: false },
      { id: 'fb-qa-pdc', stepOrder: 108, phase: 'Final Inspection', taskName: 'Front parking sensors / PDC function test before handoff — walk past L and R; confirm beep/display', requiresPhoto: false, skippable: false },
      { id: 'fb-qa-wire', stepOrder: 109, phase: 'Final Inspection', taskName: 'Re-test after final fit: DRL/park, indicators/hazards, both fogs, sensors — no dash faults', requiresPhoto: false, skippable: false },
      { id: 'fb-qa-winch', stepOrder: 110, phase: 'Final Inspection', taskName: 'Winch operation, isolator, rope, and remote tested', requiresPhoto: false, skippable: true },
      ...FINAL_RELEASE,
    ],
  },
  {
    id: 'rear-bumper',
    packageName: 'Rear Bumper / Tow Bar Fitment',
    steps: [
      { id: 'rb-1', stepOrder: 1, taskName: 'Pre-inspection walkaround photos (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      { id: 'rb-2', stepOrder: 2, taskName: 'Photo of stripped rear chassis / bumper mounts — hardware counted', requiresPhoto: true, skippable: false },
      { id: 'rb-3', stepOrder: 3, taskName: 'Rear parking sensors transferred and seated correctly (L/R)', requiresPhoto: false, skippable: true },
      { id: 'rb-4', stepOrder: 4, taskName: 'Reverse camera remounted and aligned', requiresPhoto: false, skippable: true },
      { id: 'rb-5', stepOrder: 5, taskName: 'Number plate lights / loom transferred', requiresPhoto: false, skippable: true },
      ...WIRING_WORKMANSHIP.map((s, i) => ({ ...s, id: `rb-${s.id}`, stepOrder: 20 + i })),
      { id: 'rb-7', stepOrder: 50, taskName: 'Photo of mount bolts, washers, and nylocks torqued', requiresPhoto: true, skippable: false },
      { id: 'rb-8', stepOrder: 51, taskName: 'Final rear alignment photos', requiresPhoto: true, skippable: false },
      ...FINAL_INSPECTION,
      { id: 'rb-qa-tow', stepOrder: 107, phase: 'Final Inspection', taskName: 'Tow bar, safety-chain points, tow plug, and trailer lights tested', requiresPhoto: false, skippable: true },
      { id: 'rb-qa-wire', stepOrder: 108, phase: 'Final Inspection', taskName: 'Electrical re-test: rear sensors, reverse camera, plate lights', requiresPhoto: false, skippable: false },
      { id: 'rb-qa-clearance', stepOrder: 109, phase: 'Final Inspection', taskName: 'Rear bumper alignment, tailgate clearance, and mounting torque verified', requiresPhoto: false, skippable: false },
      ...FINAL_RELEASE,
    ],
  },
  {
    id: 'suspension-lift',
    packageName: 'Suspension Lift Kit',
    steps: [
      { id: 'sl-1', stepOrder: 1, taskName: 'Pre-inspection walkaround photos (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      { id: 'sl-2', stepOrder: 2, taskName: 'Old springs/shocks removed — photo of mounts; all hardware bagged/counted', requiresPhoto: true, skippable: false },
      { id: 'sl-3', stepOrder: 3, taskName: 'New springs seated correctly', requiresPhoto: false, skippable: false },
      { id: 'sl-4', stepOrder: 4, taskName: 'Shock bolts torqued — photo of each corner', requiresPhoto: true, skippable: false },
      { id: 'sl-5', stepOrder: 5, taskName: 'Brake lines and ABS wiring checked for stretch / clearance', requiresPhoto: false, skippable: false },
      { id: 'sl-6', stepOrder: 6, taskName: 'Height sensors / headlight leveling checked', requiresPhoto: false, skippable: true },
      { id: 'sl-7', stepOrder: 7, taskName: 'Final ride-height photos', requiresPhoto: true, skippable: false },
      ...FINAL_INSPECTION,
      { id: 'sl-qa-align', stepOrder: 107, phase: 'Final Inspection', taskName: 'Wheel alignment completed and alignment report received', requiresPhoto: true, skippable: false },
      { id: 'sl-qa-torque', stepOrder: 108, phase: 'Final Inspection', taskName: 'Wheel nuts and suspension fasteners re-torqued after road test', requiresPhoto: false, skippable: false },
      { id: 'sl-qa-height', stepOrder: 109, phase: 'Final Inspection', taskName: 'Ride height measured; steering, brake lines, and driveshaft angles rechecked', requiresPhoto: false, skippable: false },
      ...FINAL_RELEASE,
    ],
  },
  {
    id: 'rear-suspension-trailer-plug',
    packageName: 'Rear Shocks + Trailer Plug',
    steps: [
      { id: 'rst-1', stepOrder: 1, taskName: 'Pre-inspection walkaround photos (8 angles)', requiresPhoto: true, skippable: true, photoMode: 'walkaround', minPhotos: 8 },
      { id: 'rst-wheels', stepOrder: 2, taskName: 'Remove rear wheels — 2 photos', requiresPhoto: true, skippable: true, photoMode: 'multi', minPhotos: 2 },
      { id: 'rst-susp-left', stepOrder: 3, taskName: 'Left-side suspension condition — 2 photos', requiresPhoto: true, skippable: true, photoMode: 'multi', minPhotos: 2 },
      { id: 'rst-susp-right', stepOrder: 4, taskName: 'Right-side suspension condition — 2 photos', requiresPhoto: true, skippable: true, photoMode: 'multi', minPhotos: 2 },
      { id: 'rst-shocks', stepOrder: 5, taskName: 'Shock replacement photos — 4 photos (before wheels back on)', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 4 },
      { id: 'rst-5', stepOrder: 6, taskName: 'Brake lines and ABS wiring checked for stretch / clearance', requiresPhoto: false, skippable: false },
      { id: 'rst-plug', stepOrder: 7, taskName: 'Trailer plug installed & tested — photos', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'rst-final-walk', stepOrder: 8, taskName: 'Final completed vehicle walkaround (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      {
        id: 'rst-qa-release',
        stepOrder: 199,
        phase: 'Final Inspection',
        taskName: 'Manager release: vehicle is safe, clean, and ready for the client',
        requiresPhoto: false,
        skippable: false,
      },
    ],
  },
  {
    id: 'lights-accessories',
    packageName: 'Lights / Accessories Fitment',
    steps: [
      { id: 'la-1', stepOrder: 1, taskName: 'Pre-inspection walkaround photos (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      { id: 'la-2', stepOrder: 2, taskName: 'Mount points marked — photo before drilling', requiresPhoto: true, skippable: false },
      { id: 'la-3', stepOrder: 3, taskName: 'Spotlights / light bar / accessories mounted with correct hardware', requiresPhoto: false, skippable: false },
      { id: 'la-4', stepOrder: 4, taskName: 'Bonnet / fender / rock guards fitted (if on job)', requiresPhoto: false, skippable: true },
      ...WIRING_WORKMANSHIP.map((s, i) => ({ ...s, id: `la-${s.id}`, stepOrder: 20 + i })),
      { id: 'la-5', stepOrder: 50, taskName: 'Photo of completed mounts and loom', requiresPhoto: true, skippable: false },
      ...FINAL_INSPECTION,
      { id: 'la-qa-lights', stepOrder: 107, phase: 'Final Inspection', taskName: 'All fitted lights aim-tested and switch/relay operation confirmed', requiresPhoto: false, skippable: false },
      ...FINAL_RELEASE,
    ],
  },
  {
    id: 'exhaust-upgrade',
    packageName: 'Exhaust Upgrade',
    steps: [
      { id: 'ex-1', stepOrder: 1, taskName: 'Pre-inspection walkaround photos (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      { id: 'ex-2', stepOrder: 2, taskName: 'Old system removed — hangers, gaskets, and hardware accounted for', requiresPhoto: false, skippable: false },
      { id: 'ex-3', stepOrder: 3, taskName: 'New system fitted — flanges, clamps, and hangers seated', requiresPhoto: true, skippable: false },
      { id: 'ex-4', stepOrder: 4, taskName: 'Clearance check vs chassis, fuel, and brake lines', requiresPhoto: false, skippable: false },
      { id: 'ex-5', stepOrder: 5, taskName: 'Photo of final underbody exhaust fitment', requiresPhoto: true, skippable: false },
      ...FINAL_INSPECTION,
      { id: 'ex-qa-leak', stepOrder: 107, phase: 'Final Inspection', taskName: 'Engine run: no exhaust leaks, no hanging contact, no new dash faults', requiresPhoto: false, skippable: false },
      ...FINAL_RELEASE,
    ],
  },
  {
    id: 'dmax-mcc-leaf-winch',
    packageName: 'MCC Bumper · Extra Leaf · Runva Winch · Tow · Rubberise',
    steps: [
      { id: 'dmx-1', stepOrder: 1, taskName: 'Book-in walkaround photos (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },

      // --- Leaf springs first to complete ---
      { id: 'dmx-leaf-1', stepOrder: 10, taskName: 'Rear wheels off — photos', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'dmx-leaf-2', stepOrder: 11, taskName: 'Rear leaf packs out — photo of mounts / U-bolts / hardware bagged', requiresPhoto: true, skippable: false },
      { id: 'dmx-leaf-3', stepOrder: 12, taskName: 'Extra leaf fitted both sides — pack stacked correctly', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'dmx-leaf-4', stepOrder: 13, taskName: 'Leaf packs refitted — U-bolts / centre bolts torqued; photo both sides', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'dmx-leaf-5', stepOrder: 14, taskName: 'Rear wheels on — wheel nuts snugged (final torque after alignment)', requiresPhoto: false, skippable: false },

      // --- Front strip (research: D-Max grille + bumper) ---
      { id: 'dmx-strip-1', stepOrder: 20, taskName: 'Grille off — top plastic clips + Phillips under ISUZU badge; retain fasteners', requiresPhoto: true, skippable: false },
      { id: 'dmx-strip-2', stepOrder: 21, taskName: 'Bumper off — wheel-arch clips/screws, lower 10mm screws/nuts, underbody clips; unplug fog/sensor looms', requiresPhoto: true, skippable: false },
      { id: 'dmx-strip-3', stepOrder: 22, taskName: 'Skid plate / crash beam / bumper supports removed as required for MCC — bag & label OEM bolts', requiresPhoto: true, skippable: false },

      // --- MCC + Runva + lights ---
      { id: 'dmx-mcc-1', stepOrder: 30, taskName: 'MCC chassis mounts / brackets fitted and torqued', requiresPhoto: true, skippable: false },
      { id: 'dmx-mcc-2', stepOrder: 31, taskName: 'Runva winch mounted to MCC / winch plate — bolts torqued', requiresPhoto: true, skippable: false },
      { id: 'dmx-mcc-3', stepOrder: 32, taskName: 'Winch power, earth, and control loom routed and connected', requiresPhoto: true, skippable: false },
      { id: 'dmx-mcc-4', stepOrder: 33, taskName: 'MCC bumper shell trial-fitted — gaps / recovery points checked', requiresPhoto: false, skippable: false },
      { id: 'dmx-mcc-5', stepOrder: 34, taskName: 'Indicators, fog lights, DRL, and spotlights (brights) fitted to MCC', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },
      { id: 'dmx-mcc-6', stepOrder: 35, taskName: 'Light looms joined — heat-shrink/solder; routed clear of heat and pinch points', requiresPhoto: true, skippable: false },
      { id: 'dmx-mcc-7', stepOrder: 36, taskName: 'MCC bumper final fit — mount bolts, washers, nylocks seated', requiresPhoto: true, skippable: false },
      { id: 'dmx-mcc-8', stepOrder: 37, taskName: 'Function test: indicators, fog, DRL, spotlights, and Runva winch', requiresPhoto: false, skippable: false },

      // --- Tow ball last easy job before alignment ---
      { id: 'dmx-tow-1', stepOrder: 40, taskName: 'New tow ball fitted and torqued', requiresPhoto: true, skippable: false },

      // --- Rubberising last (external) ---
      { id: 'dmx-rub-1', stepOrder: 50, taskName: 'Rubberising — external company on premises (not AOR labour); confirm areas done', requiresPhoto: true, skippable: false, photoMode: 'multi', minPhotos: 2 },

      // --- Alignment before handoff ---
      { id: 'dmx-align-1', stepOrder: 60, taskName: 'Wheel alignment completed — alignment report received', requiresPhoto: true, skippable: false },
      { id: 'dmx-align-2', stepOrder: 61, taskName: 'Wheel nuts re-torqued after alignment', requiresPhoto: false, skippable: false },

      { id: 'dmx-final-walk', stepOrder: 70, taskName: 'Final completed vehicle walkaround (8 angles)', requiresPhoto: true, skippable: false, photoMode: 'walkaround', minPhotos: 8 },
      ...FINAL_INSPECTION,
      { id: 'dmx-qa-lights', stepOrder: 107, phase: 'Final Inspection', taskName: 'Re-test MCC lights + Runva winch after full fitment', requiresPhoto: false, skippable: false },
      { id: 'dmx-qa-tow', stepOrder: 108, phase: 'Final Inspection', taskName: 'Tow ball / tow points checked', requiresPhoto: false, skippable: false },
      ...FINAL_RELEASE,
    ],
  },
]
