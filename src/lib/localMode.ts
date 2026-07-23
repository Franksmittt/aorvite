/**
 * Optional kill switch: set VITE_LOCAL_FIRST_MODE=true (Vercel env or .env.local)
 * to pause Firebase sync so jobs + photos stay on the device only.
 * Defaults to OFF — with Firebase env vars set, photos go to Storage and
 * jobs/orders sync to Firestore so every login sees the same data.
 */
export const LOCAL_FIRST_MODE =
  String(import.meta.env.VITE_LOCAL_FIRST_MODE ?? '').toLowerCase() === 'true'

export function localFirstStatusLabel(): string {
  return LOCAL_FIRST_MODE
    ? 'Local phone mode (Firebase sync paused)'
    : ''
}
