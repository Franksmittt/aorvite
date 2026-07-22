const MAX_WIDTH = 1080
const JPEG_QUALITY = 0.7

function canvasToJpeg(img: CanvasImageSource, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported on this phone')
  ctx.drawImage(img, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  canvas.width = 0
  canvas.height = 0
  return dataUrl
}

function loadViaImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('Could not read that image. Try a JPG/PNG from Camera Roll.'))
    img.src = dataUrl
  })
}

/** Downscale + compress a camera/gallery image before upload/storage. */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name)) {
    throw new Error('That file is not an image. Pick a photo.')
  }

  // Prefer createImageBitmap — handles more formats on modern mobile browsers.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, MAX_WIDTH / Math.max(bitmap.width, 1))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const dataUrl = canvasToJpeg(bitmap, width, height)
      bitmap.close()
      return dataUrl
    } catch {
      // Fall through to FileReader + <img> path.
    }
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })

  if (!dataUrl) throw new Error('Could not read image file')

  const img = await loadViaImageElement(dataUrl)
  const scale = Math.min(1, MAX_WIDTH / Math.max(img.width, 1))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  return canvasToJpeg(img, width, height)
}
