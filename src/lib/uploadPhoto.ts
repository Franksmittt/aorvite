import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseStorage, isFirebaseConfigured } from './firebase'

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/** Upload compressed JPEG to Firebase Storage. Falls back to data URL if Firebase not configured. */
export async function uploadJobPhoto(opts: {
  jobId: string
  taskId: string
  workerId: string
  dataUrl: string
}): Promise<{ url: string; storagePath?: string }> {
  if (!isFirebaseConfigured()) {
    return { url: opts.dataUrl }
  }

  const storage = getFirebaseStorage()
  if (!storage) return { url: opts.dataUrl }

  const path = `jobs/${opts.jobId}/tasks/${opts.taskId}/${opts.workerId}-${Date.now()}.jpg`
  const storageRef = ref(storage, path)
  const blob = dataUrlToBlob(opts.dataUrl)
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
    customMetadata: {
      jobId: opts.jobId,
      taskId: opts.taskId,
      workerId: opts.workerId,
    },
  })
  const url = await getDownloadURL(storageRef)
  return { url, storagePath: path }
}
