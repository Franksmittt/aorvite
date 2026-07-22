import { idbGetAllPhotoEntries, idbPutPhoto } from './photoIdb'

/** In-memory photo previews for fast render.
 * Durable copy lives in IndexedDB (local-first). localStorage only keeps job metadata.
 */
const previewByKey = new Map<string, string>()

export function photoPreviewKey(parts: {
  jobId: string
  taskId: string
  photoId?: string
}): string {
  return parts.photoId
    ? `${parts.jobId}:${parts.taskId}:${parts.photoId}`
    : `${parts.jobId}:${parts.taskId}`
}

export function cachePhotoPreview(key: string, dataUrl: string | undefined) {
  if (!dataUrl) return
  if (!dataUrl.startsWith('data:')) return
  previewByKey.set(key, dataUrl)
  void idbPutPhoto(key, dataUrl).catch((err) => {
    console.warn('IndexedDB photo save failed', err)
  })
}

export function getCachedPhotoPreview(key: string): string | undefined {
  return previewByKey.get(key)
}

export function clearCachedPhotoPreview(key: string) {
  previewByKey.delete(key)
}

/** Load all on-device photos into memory after refresh. */
export async function hydratePhotoPreviewsFromIdb(): Promise<number> {
  try {
    const entries = await idbGetAllPhotoEntries()
    for (const entry of entries) {
      previewByKey.set(entry.key, entry.dataUrl)
    }
    return entries.length
  } catch (err) {
    console.warn('IndexedDB photo hydrate failed', err)
    return 0
  }
}
