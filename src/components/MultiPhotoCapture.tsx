import { useState } from 'react'
import type { TaskPhoto } from '../types'
import { PhotoCapture } from './PhotoCapture'

type Props = {
  photos: TaskPhoto[]
  locked: boolean
  busy?: boolean
  minPhotos: number
  label?: string
  onCapture: (dataUrl: string) => void | Promise<void>
  onDelete: (photoId: string) => void
  onSubmit: () => void
}

function photoSrc(photo: TaskPhoto) {
  return photo.url || photo.dataUrl || ''
}

export function MultiPhotoCapture({
  photos,
  locked,
  busy = false,
  minPhotos,
  label = 'photos',
  onCapture,
  onDelete,
  onSubmit,
}: Props) {
  const [adding, setAdding] = useState(false)
  const filled = photos.length
  const ready = filled >= minPhotos && !locked

  return (
    <div className="walkaround multi-photo">
      <div className="walkaround-progress">
        <strong>
          {filled}/{minPhotos} {label}
        </strong>
        <span className="muted">
          {locked
            ? 'Submitted — photos locked'
            : `Add at least ${minPhotos}, then submit.`}
        </span>
      </div>

      <div className="multi-photo-grid">
        {photos.map((photo, index) => {
          const src = photoSrc(photo)
          return (
            <div key={photo.id} className="walkaround-slot filled">
              <p className="walkaround-slot-label">Photo {index + 1}</p>
              {src ? (
                <img src={src} alt={photo.slotLabel} className="walkaround-thumb" />
              ) : null}
              <p className="walkaround-time muted">
                {new Date(photo.capturedAt).toLocaleTimeString()}
              </p>
              {!locked && (
                <div className="walkaround-slot-actions">
                  <button
                    type="button"
                    className="btn btn-ghost qty-btn"
                    onClick={() => onDelete(photo.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {!locked && (
          <div className={`walkaround-slot ${adding ? 'active' : ''}`}>
            <p className="walkaround-slot-label">Add</p>
            {adding ? (
              <PhotoCapture
                label="Take / choose photo"
                onCaptured={(dataUrl) => {
                  void onCapture(dataUrl)
                  setAdding(false)
                }}
              />
            ) : (
              <button
                type="button"
                className="btn btn-camera"
                disabled={busy}
                onClick={() => setAdding(true)}
              >
                Add photo
              </button>
            )}
          </div>
        )}
      </div>

      {!locked && (
        <button
          type="button"
          className="btn btn-yes btn-block"
          disabled={!ready || busy}
          onClick={onSubmit}
        >
          {busy
            ? 'Saving…'
            : ready
              ? `Submit ${filled} photos`
              : `Need ${minPhotos - filled} more`}
        </button>
      )}
    </div>
  )
}
