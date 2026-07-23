import type { Job, JobTask, TaskPhoto } from '../types'
import { syncJobToCloud } from './firestoreSync'
import { idbGetPhoto } from './photoIdb'
import { getCachedPhotoPreview, photoPreviewKey } from './photoPreviewCache'
import { firebaseEnabled, loadJobs, saveJobs } from './store'
import { uploadJobPhoto } from './uploadPhoto'

async function localDataUrl(key: string): Promise<string | undefined> {
  const cached = getCachedPhotoPreview(key)
  if (cached) return cached
  try {
    return await idbGetPhoto(key)
  } catch {
    return undefined
  }
}

async function backfillTaskMedia(job: Job, task: JobTask): Promise<boolean> {
  if (!task.media || task.media.url) return false
  const key = photoPreviewKey({ jobId: job.id, taskId: task.id })
  const dataUrl = await localDataUrl(key)
  if (!dataUrl) return false
  const uploaded = await uploadJobPhoto({
    jobId: job.id,
    taskId: task.id,
    workerId: task.completedByWorkerId ?? 'backfill',
    dataUrl,
  })
  if (!uploaded.url.startsWith('http')) return false
  task.media = { ...task.media, url: uploaded.url, storagePath: uploaded.storagePath }
  return true
}

async function backfillTaskPhoto(
  job: Job,
  task: JobTask,
  photo: TaskPhoto,
): Promise<boolean> {
  if (photo.url) return false
  const key = photoPreviewKey({ jobId: job.id, taskId: task.id, photoId: photo.id })
  const dataUrl = await localDataUrl(key)
  if (!dataUrl) return false
  const uploaded = await uploadJobPhoto({
    jobId: job.id,
    taskId: task.id,
    workerId: photo.capturedByWorkerId || 'backfill',
    dataUrl,
    photoKey: photo.slotId ?? photo.id,
  })
  if (!uploaded.url.startsWith('http')) return false
  photo.url = uploaded.url
  photo.storagePath = uploaded.storagePath
  return true
}

/**
 * Upload photos that were captured while Firebase sync was paused (or failing)
 * and only exist on this device. Runs on app start; safe to re-run — photos
 * that already have a cloud URL are skipped. Failures (offline, locked rules)
 * are logged and retried on the next app load.
 */
export async function backfillLocalPhotosToCloud(): Promise<number> {
  if (!firebaseEnabled()) return 0

  const jobs = loadJobs()
  let uploadedCount = 0
  const changedJobs: Job[] = []

  for (const job of jobs) {
    let jobChanged = false
    for (const task of job.tasks) {
      try {
        if (await backfillTaskMedia(job, task)) {
          uploadedCount += 1
          jobChanged = true
        }
      } catch (err) {
        console.warn('Photo backfill failed (task media)', job.id, task.id, err)
      }
      for (const photo of task.photos ?? []) {
        try {
          if (await backfillTaskPhoto(job, task, photo)) {
            uploadedCount += 1
            jobChanged = true
          }
        } catch (err) {
          console.warn('Photo backfill failed (photo)', job.id, task.id, photo.id, err)
        }
      }
    }
    if (jobChanged) changedJobs.push(job)
  }

  if (changedJobs.length > 0) {
    saveJobs(jobs)
    for (const job of changedJobs) {
      try {
        await syncJobToCloud(job)
      } catch (err) {
        console.warn('Photo backfill job sync failed', job.id, err)
      }
    }
  }

  return uploadedCount
}
