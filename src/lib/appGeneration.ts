/** Bump this whenever we need every browser to drop old local/demo state. */
export const APP_GENERATION = 'r7-2026-07-17'

export const APP_GENERATION_KEY = 'aor-app-generation'

export function wipeAllAorLocalData() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith('aor-')) keys.push(key)
  }
  for (const key of keys) localStorage.removeItem(key)
}

/** Returns true if this browser just wiped because generation changed. */
export function ensureAppGeneration(): boolean {
  if (typeof localStorage === 'undefined') return false
  const current = localStorage.getItem(APP_GENERATION_KEY)
  if (current === APP_GENERATION) return false
  wipeAllAorLocalData()
  localStorage.setItem(APP_GENERATION_KEY, APP_GENERATION)
  return true
}
