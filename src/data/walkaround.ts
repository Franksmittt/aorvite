import type { WalkaroundSlotId } from '../types'

export type WalkaroundSlot = {
  id: WalkaroundSlotId
  label: string
  shortLabel: string
}

/** Clockwise vehicle walkaround — minimum 8 pre-inspection photos */
export const WALKAROUND_SLOTS: WalkaroundSlot[] = [
  { id: 'front', label: 'Front', shortLabel: 'Front' },
  { id: 'front-right', label: 'Front right corner', shortLabel: 'FR corner' },
  { id: 'right', label: 'Right side', shortLabel: 'Right' },
  { id: 'back-right', label: 'Back right corner', shortLabel: 'BR corner' },
  { id: 'back', label: 'Back', shortLabel: 'Back' },
  { id: 'back-left', label: 'Back left corner', shortLabel: 'BL corner' },
  { id: 'left', label: 'Left side', shortLabel: 'Left' },
  { id: 'front-left', label: 'Front left corner', shortLabel: 'FL corner' },
]

export const WALKAROUND_MIN_PHOTOS = WALKAROUND_SLOTS.length

export function walkaroundSlotLabel(id: WalkaroundSlotId): string {
  return WALKAROUND_SLOTS.find((s) => s.id === id)?.label ?? id
}
