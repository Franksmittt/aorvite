/** In-memory photo previews for the current browser tab.
 * localStorage cannot hold full JPEG dataUrls (quota). Keep previews here
 * and persist only cloud URLs / metadata in aor-jobs-v5.
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
}

export function getCachedPhotoPreview(key: string): string | undefined {
  return previewByKey.get(key)
}

export function clearCachedPhotoPreview(key: string) {
  previewByKey.delete(key)
}
