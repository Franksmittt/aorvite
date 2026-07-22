import { useId, useState } from 'react'
import { compressImage } from '../lib/compressImage'

type Props = {
  onCaptured: (dataUrl: string) => void | Promise<void>
  label?: string
}

/**
 * Gallery / camera picker. Uses a real <label htmlFor> hit target so iOS Safari
 * reliably fires change after choosing a photo from the library.
 */
export function PhotoCapture({ onCaptured, label = 'Take / choose photo' }: Props) {
  const inputId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Clear after reading the File reference so the same image can be re-picked.
    if (!file) {
      e.target.value = ''
      return
    }

    setBusy(true)
    setError(null)
    try {
      const dataUrl = await compressImage(file)
      await onCaptured(dataUrl)
      if (navigator.vibrate) navigator.vibrate(100)
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Could not process photo. Try again or pick a JPG/PNG.'
      setError(message)
    } finally {
      e.target.value = ''
      setBusy(false)
    }
  }

  return (
    <div className="photo-capture">
      <input
        id={inputId}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          void handleChange(e)
        }}
      />
      <label
        htmlFor={inputId}
        className={`btn btn-camera ${busy ? 'is-disabled' : ''}`}
        aria-disabled={busy}
        onClick={(e) => {
          if (busy) e.preventDefault()
        }}
      >
        {busy ? 'Saving photo…' : label}
      </label>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
