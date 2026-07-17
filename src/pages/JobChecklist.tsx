import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PhotoCapture } from '../components/PhotoCapture'
import { WalkaroundCapture } from '../components/WalkaroundCapture'
import { WALKAROUND_MIN_PHOTOS } from '../data/walkaround'
import { WORKERS } from '../data/workers'
import {
  addJobNote,
  addWalkaroundPhoto,
  completeTask,
  deleteWalkaroundPhoto,
  firebaseEnabled,
  getJob,
  skipTask,
  submitWalkaround,
  toggleJobTimer,
} from '../lib/store'
import { uploadJobPhoto } from '../lib/uploadPhoto'
import {
  canFinalInspect,
  isTaskResolved,
  jobProgress,
  type AuditAction,
  type Job,
  type JobTask,
  type WalkaroundSlotId,
  type Worker,
} from '../types'

type Props = {
  worker: Worker
  onJobsChanged: () => void
}

function formatTimer(job: Job) {
  let seconds = job.timerSecondsAccumulated ?? 0
  if (job.timerStartedAt) {
    seconds += Math.floor((Date.now() - new Date(job.timerStartedAt).getTime()) / 1000)
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${String(s).padStart(2, '0')}s`
}

function auditLabel(action: AuditAction) {
  switch (action) {
    case 'photo_captured':
      return 'Photo taken'
    case 'photo_deleted':
      return 'Photo deleted'
    case 'walkaround_submitted':
      return 'Walkaround submitted'
    case 'note_added':
      return 'Note'
    case 'task_completed':
      return 'Task done'
    case 'task_skipped':
      return 'Task skipped'
    case 'timer_started':
      return 'Timer start'
    case 'timer_stopped':
      return 'Timer stop'
    default:
      return action
  }
}

function photoSrc(photo: { url?: string; dataUrl?: string }) {
  return photo.url || photo.dataUrl || ''
}

export function JobChecklist({ worker, onJobsChanged }: Props) {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | null>(() => (jobId ? getJob(jobId) ?? null : null))
  const [pendingPhotoTaskId, setPendingPhotoTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [walkaroundBusy, setWalkaroundBusy] = useState(false)

  // Always re-read from shared store when opening a job / switching user session.
  useEffect(() => {
    if (!jobId) {
      setJob(null)
      return
    }
    setJob(getJob(jobId) ?? null)
  }, [jobId, worker.id])

  const nextPending = useMemo(
    () =>
      job?.tasks.find(
        (task) =>
          task.status === 'Pending' &&
          (task.phase !== 'Final Inspection' || canFinalInspect(worker)),
      ),
    [job, worker],
  )

  if (!job) {
    return (
      <div className="screen">
        <p className="error-text">Job not found</p>
        <Link to="/workshop" className="btn btn-primary">
          Back to workshop
        </Link>
      </div>
    )
  }

  const showQa = canFinalInspect(worker) && job.status === 'Gone Out'
  const pct = jobProgress(job)
  const auditLog = job.auditLog ?? []

  function refresh(updated: Job) {
    setJob({
      ...updated,
      notes: [...updated.notes],
      tasks: [...updated.tasks],
      auditLog: [...(updated.auditLog ?? [])],
    })
    onJobsChanged()
  }

  async function markDone(taskId: string, photoDataUrl?: string) {
    setError(null)
    try {
      let photoUrl: string | undefined
      let storagePath: string | undefined
      let localPreview = photoDataUrl

      if (photoDataUrl) {
        const uploaded = await uploadJobPhoto({
          jobId: job!.id,
          taskId,
          workerId: worker.id,
          dataUrl: photoDataUrl,
        })
        photoUrl = uploaded.url.startsWith('http') ? uploaded.url : undefined
        storagePath = uploaded.storagePath
        if (!photoUrl) localPreview = uploaded.url
      }

      const updated = completeTask({
        jobId: job!.id,
        taskId,
        workerId: worker.id,
        photoDataUrl: localPreview,
        photoUrl,
        storagePath,
      })
      if (updated) refresh(updated)
      setPendingPhotoTaskId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete task')
    }
  }

  function mediaSrc(task: JobTask) {
    return task.media?.url || task.media?.dataUrl || ''
  }

  async function onWalkaroundCapture(taskId: string, slotId: WalkaroundSlotId, dataUrl: string) {
    setError(null)
    setWalkaroundBusy(true)
    try {
      const uploaded = await uploadJobPhoto({
        jobId: job!.id,
        taskId,
        workerId: worker.id,
        dataUrl,
        photoKey: slotId,
      })
      const photoUrl = uploaded.url.startsWith('http') ? uploaded.url : undefined
      const updated = addWalkaroundPhoto({
        jobId: job!.id,
        taskId,
        workerId: worker.id,
        slotId,
        photoDataUrl: photoUrl ? dataUrl : uploaded.url,
        photoUrl,
        storagePath: uploaded.storagePath,
      })
      if (updated) refresh(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save photo')
    } finally {
      setWalkaroundBusy(false)
    }
  }

  function onWalkaroundDelete(taskId: string, photoId: string) {
    setError(null)
    try {
      const updated = deleteWalkaroundPhoto({
        jobId: job!.id,
        taskId,
        workerId: worker.id,
        photoId,
      })
      if (updated) refresh(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete photo')
    }
  }

  function onWalkaroundSubmit(taskId: string) {
    setError(null)
    try {
      const updated = submitWalkaround({
        jobId: job!.id,
        taskId,
        workerId: worker.id,
      })
      if (updated) refresh(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit walkaround')
    }
  }

  function markSkipped(taskId: string) {
    setError(null)
    try {
      const updated = skipTask({
        jobId: job!.id,
        taskId,
        workerId: worker.id,
      })
      if (updated) refresh(updated)
      setPendingPhotoTaskId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not skip task')
    }
  }

  function submitNote(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const updated = addJobNote({
        jobId: job!.id,
        workerId: worker.id,
        text: noteText,
      })
      if (updated) {
        refresh(updated)
        setNoteText('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add note')
    }
  }

  function onToggleTimer() {
    const updated = toggleJobTimer({ jobId: job!.id, workerId: worker.id })
    if (updated) refresh(updated)
  }

  function workerName(id?: string) {
    if (!id) return '—'
    return WORKERS.find((w) => w.id === id)?.fullName ?? id
  }

  const assigned =
    job.assignedWorkerIds.length > 0
      ? job.assignedWorkerIds.map(workerName).join(', ')
      : 'Unassigned'

  return (
    <div className="screen screen-stack">
      <header className="screen-header">
        <Link to="/workshop" className="link-back">
          ‹ Workshop
        </Link>
        <p className="plate huge">{job.registration}</p>
        <p className="sub">
          {job.year} {job.make} {job.model}
        </p>
        <p className="sub">{job.packageName}</p>
        <p className="sub">Assigned: {assigned}</p>
        <div className="job-meta-row">
          <span
            className={`badge ${
              job.status === 'Gone Out'
                ? 'badge-done'
                : job.status === 'Final Inspection'
                  ? 'badge-inspection'
                  : job.status === 'In Workshop'
                    ? 'badge-active'
                    : 'badge-pending'
            }`}
          >
            {job.status}
          </span>
          <span className="progress-pct big">{pct}%</span>
        </div>
        <div className="progress-track tall" aria-hidden>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="timer-row">
        <span className="muted">Work timer: {formatTimer(job)}</span>
        <button type="button" className="btn btn-ghost" onClick={onToggleTimer}>
          {job.timerStartedAt ? 'Stop timer' : 'Start timer'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="section">
        <h2>Notes</h2>
        <form className="note-form" onSubmit={submitNote}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Broke a clip, scratched panel, waiting on parts…"
            rows={3}
          />
          <button type="submit" className="btn btn-primary btn-block">
            Add note
          </button>
        </form>
        {job.notes.length === 0 ? (
          <p className="muted empty">No notes yet</p>
        ) : (
          <ul className="notes-list">
            {job.notes.map((n) => (
              <li key={n.id} className="note-item">
                <p className="note-text">{n.text}</p>
                <p className="muted">
                  {workerName(n.workerId)} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {job.status === 'Final Inspection' && !canFinalInspect(worker) && (
        <div className="inspection-banner">
          <span className="inspection-banner-icon">✓</span>
          <div>
            <p className="task-name">Workshop work complete</p>
            <p className="muted">
              Only Marius (Workshop Manager) can complete final inspection before
              the vehicle goes out to the client.
            </p>
          </div>
        </div>
      )}

      {showQa ? (
        <section className="section">
          <h2>Completed job record</h2>
          <ul className="qa-list">
            {job.tasks.map((task) => (
              <li key={task.id} className="qa-item">
                <div>
                  <p className="task-name">{task.taskName}</p>
                  <p className="muted">
                    {task.status === 'Skipped'
                      ? 'Not fitted'
                      : workerName(task.completedByWorkerId)}
                    {task.completedAt
                      ? ` · ${new Date(task.completedAt).toLocaleString()}`
                      : ''}
                  </p>
                  {task.status === 'Skipped' && (
                    <p className="skip-note">{task.skipNote ?? 'Not on this vehicle'}</p>
                  )}
                </div>
                {task.photoMode === 'walkaround' && (task.photos?.length ?? 0) > 0 ? (
                  <div className="walkaround-review-grid">
                    {task.photos!.map((photo) => {
                      const src = photoSrc(photo)
                      if (!src) return null
                      return (
                        <figure key={photo.id} className="walkaround-review-item">
                          <img src={src} alt={photo.slotLabel} className="qa-photo" />
                          <figcaption className="muted">
                            {photo.slotLabel}
                            <br />
                            {new Date(photo.capturedAt).toLocaleString()}
                          </figcaption>
                        </figure>
                      )
                    })}
                  </div>
                ) : task.media && mediaSrc(task) ? (
                  <img src={mediaSrc(task)} alt={task.taskName} className="qa-photo" />
                ) : task.status === 'Skipped' ? null : (
                  <p className="muted">No photo</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="section">
          <h2>Checklist</h2>
          <ul className="task-list">
            {job.tasks
              .filter(
                (task) => task.phase !== 'Final Inspection' || canFinalInspect(worker),
              )
              .map((task) => {
                const isNext = nextPending?.id === task.id
                const done = task.status === 'Complete'
                const skipped = task.status === 'Skipped'
                const resolved = isTaskResolved(task.status)
                const isWalkaround = task.photoMode === 'walkaround'
                const locked = Boolean(task.photosLockedAt) || done

                return (
                  <li
                    key={task.id}
                    className={`task-item ${done ? 'done' : ''} ${skipped ? 'skipped' : ''} ${isNext ? 'current' : ''}`}
                  >
                    <div className="task-row">
                      <span
                        className={`task-icon ${done ? 'ok' : skipped ? 'skip' : isNext ? 'warn' : ''}`}
                      >
                        {done ? '✓' : skipped ? '–' : isNext ? '!' : '○'}
                      </span>
                      <div className="task-body">
                        {task.phase === 'Final Inspection' && (
                          <p className="phase-label">Final inspection</p>
                        )}
                        <p className="task-name">{task.taskName}</p>
                        {done && task.completedByWorkerId && (
                          <p className="muted">Done by {workerName(task.completedByWorkerId)}</p>
                        )}
                        {!resolved && isWalkaround && (
                          <p className="muted">
                            Minimum {task.minPhotos ?? WALKAROUND_MIN_PHOTOS} walkaround
                            photos required
                          </p>
                        )}
                        {!resolved && task.requiresPhoto && !isWalkaround && (
                          <p className="muted">Photo required</p>
                        )}
                        {!resolved && task.skippable && (
                          <p className="muted">Optional — skip if not fitted</p>
                        )}
                        {skipped && (
                          <p className="skip-note">
                            {task.skipNote ?? 'Not on this vehicle'}
                          </p>
                        )}
                        {done && isWalkaround && task.photosLockedAt && (
                          <p className="muted">
                            Locked {new Date(task.photosLockedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {isWalkaround && (isNext || done) && (
                      <div className="task-actions">
                        <WalkaroundCapture
                          photos={task.photos ?? []}
                          locked={locked}
                          busy={walkaroundBusy}
                          minPhotos={task.minPhotos ?? WALKAROUND_MIN_PHOTOS}
                          onCapture={(slotId, dataUrl) =>
                            onWalkaroundCapture(task.id, slotId, dataUrl)
                          }
                          onDelete={(photoId) => onWalkaroundDelete(task.id, photoId)}
                          onSubmit={() => onWalkaroundSubmit(task.id)}
                        />
                      </div>
                    )}

                    {isNext && !resolved && !isWalkaround && (
                      <div className="task-actions">
                        {task.requiresPhoto ? (
                          pendingPhotoTaskId === task.id ? (
                            <PhotoCapture
                              label="Open camera"
                              onCaptured={(dataUrl) => {
                                void markDone(task.id, dataUrl)
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              className="btn btn-camera"
                              onClick={() => setPendingPhotoTaskId(task.id)}
                            >
                              {firebaseEnabled()
                                ? 'Take photo (uploads to cloud)'
                                : 'Take photo'}
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            className="btn btn-yes"
                            onClick={() => markDone(task.id)}
                          >
                            Done
                          </button>
                        )}

                        {task.skippable && (
                          <button
                            type="button"
                            className="btn btn-skip"
                            onClick={() => markSkipped(task.id)}
                          >
                            Not on this vehicle
                          </button>
                        )}
                      </div>
                    )}

                    {done && !isWalkaround && task.media && mediaSrc(task) && (
                      <img src={mediaSrc(task)} alt="" className="thumb" />
                    )}
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      <section className="section">
        <h2>
          Audit log <span className="section-count">{auditLog.length}</span>
        </h2>
        <p className="muted">
          Backlog of photo times, deletes, notes, and submissions for this job.
        </p>
        {auditLog.length === 0 ? (
          <p className="muted empty">No activity yet</p>
        ) : (
          <ul className="audit-list">
            {auditLog.map((event) => (
              <li key={event.id} className={`audit-item audit-${event.action}`}>
                <div className="audit-top">
                  <span className="audit-action">{auditLabel(event.action)}</span>
                  <span className="muted">{new Date(event.at).toLocaleString()}</span>
                </div>
                <p className="audit-summary">{event.summary}</p>
                <p className="muted">
                  {workerName(event.workerId)}
                  {event.slotLabel ? ` · ${event.slotLabel}` : ''}
                  {event.taskName ? ` · ${event.taskName}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
