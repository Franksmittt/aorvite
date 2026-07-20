import type { Job } from '../types'

/** Front walkaround photo for job cards — prefers cloud URL, then local preview. */
export function jobFrontThumb(job: Job): string | null {
  for (const task of job.tasks) {
    if (task.photoMode !== 'walkaround' || !task.photos?.length) continue
    const front = task.photos.find((p) => p.slotId === 'front')
    const src = front?.url || front?.dataUrl
    if (src) return src
  }
  for (const task of job.tasks) {
    const photos = task.photos
    if (!photos?.length) continue
    const src = photos[0].url || photos[0].dataUrl
    if (src) return src
  }
  for (const task of job.tasks) {
    const src = task.media?.url || task.media?.dataUrl
    if (src) return src
  }
  return null
}
