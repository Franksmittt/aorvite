const MAX_WIDTH = 1080
const JPEG_QUALITY = 0.7

/** Downscale + compress a camera capture before upload/storage. */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load image'))
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width)
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)

        // Help GC on low-end phones
        canvas.width = 0
        canvas.height = 0

        resolve(dataUrl)
      }
      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
