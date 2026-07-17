import { useState } from 'react'
import { WALKAROUND_SLOTS } from '../data/walkaround'
import type { TaskPhoto, WalkaroundSlotId } from '../types'
import { PhotoCapture } from './PhotoCapture'

type Props = {
  photos: TaskPhoto[]
  locked: boolean
  busy?: boolean
  minPhotos: number
  onCapture: (slotId: WalkaroundSlotId, dataUrl: string) => void | Promise<void>
  onDelete: (photoId: string) => void
  onSubmit: () => void
}

function photoSrc(photo: TaskPhoto) {
  return photo.url || photo.dataUrl || ''
}

export function WalkaroundCapture({
  photos,
  locked,
  busy = false,
  minPhotos,
  onCapture,
  onDelete,
  onSubmit,
}: Props) {
  const [activeSlot, setActiveSlot] = useState<WalkaroundSlotId | null>(null)
  const filled = photos.length
  const ready = filled >= minPhotos && !locked

  function photoForSlot(slotId: WalkaroundSlotId) {
    return photos.find((p) => p.slotId === slotId)
  }

  return (
    <div className="walkaround">
      <div className="walkaround-progress">
        <strong>
          {filled}/{minPhotos} angles
        </strong>
        <span className="muted">
          {locked
            ? 'Submitted — photos locked'
            : 'Walk around the vehicle. Delete & retake until you submit.'}
        </span>
      </div>

      <div className="walkaround-grid">
        {WALKAROUND_SLOTS.map((slot) => {
          const photo = photoForSlot(slot.id)
          const src = photo ? photoSrc(photo) : ''
          const isActive = activeSlot === slot.id

          return (
            <div
              key={slot.id}
              className={`walkaround-slot ${photo ? 'filled' : ''} ${isActive ? 'active' : ''}`}
            >
              <p className="walkaround-slot-label">{slot.shortLabel}</p>

              {src ? (
                <>
                  <img src={src} alt={slot.label} className="walkaround-thumb" />
                  {photo && (
                    <p className="walkaround-time muted">
                      {new Date(photo.capturedAt).toLocaleTimeString()}
                    </p>
                  )}
                  {!locked && photo && (
                    <div className="walkaround-slot-actions">
                      <button
                        type="button"
                        className="btn btn-ghost qty-btn"
                        onClick={() => setActiveSlot(slot.id)}
                      >
                        Retake
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost qty-btn"
                        onClick={() => onDelete(photo.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="walkaround-empty"
                  disabled={locked || busy}
                  onClick={() => setActiveSlot(slot.id)}
                >
                  Tap to photo
                </button>
              )}

              {!locked && isActive && (
                <div className="walkaround-capture-panel">
                  <PhotoCapture
                    label={`Camera · ${slot.label}`}
                    onCaptured={(dataUrl) => {
                      void (async () => {
                        await onCapture(slot.id, dataUrl)
                        setActiveSlot(null)
                      })()
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setActiveSlot(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!locked && (
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!ready || busy}
          onClick={onSubmit}
        >
          {ready
            ? 'Submit walkaround (locks photos)'
            : `Need ${minPhotos - filled} more photo${minPhotos - filled === 1 ? '' : 's'}`}
        </button>
      )}
    </div>
  )
}
