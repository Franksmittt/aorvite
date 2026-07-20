import { useRef, useState } from 'react'
import { compressImage } from '../lib/compressImage'

type Props = {
  onCaptured: (dataUrl: string) => void
  label?: string
}

export function PhotoCapture({ onCaptured, label = 'Take photo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBusy(true)
    setError(null)
    try {
      const dataUrl = await compressImage(file)
      onCaptured(dataUrl)
      if (navigator.vibrate) navigator.vibrate(100)
    } catch {
      setError('Could not process photo. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="photo-capture">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
      />
      <button
        type="button"
        className="btn btn-camera"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'Processing photo…' : label}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
