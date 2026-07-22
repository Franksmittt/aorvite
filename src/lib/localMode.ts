/**
 * Temporary workshop mode while Firebase rules are locked.
 * Jobs + photos stay on this phone (IndexedDB). Flip to false after rules are fixed.
 */
export const LOCAL_FIRST_MODE = true

export function localFirstStatusLabel(): string {
  return LOCAL_FIRST_MODE
    ? 'Local phone mode (Firebase sync paused)'
    : ''
}
