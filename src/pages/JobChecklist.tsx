import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PhotoCapture } from '../components/PhotoCapture'
import { WORKERS } from '../data/workers'
import {
  addJobNote,
  completeTask,
  firebaseEnabled,
  getJob,
  skipTask,
  toggleJobTimer,
} from '../lib/store'
import { uploadJobPhoto } from '../lib/uploadPhoto'
import {
  canFinalInspect,
  isTaskResolved,
  jobProgress,
  type Job,
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

export function JobChecklist({ worker, onJobsChanged }: Props) {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | null>(() => (jobId ? getJob(jobId) ?? null : null))
  const [pendingPhotoTaskId, setPendingPhotoTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

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

  function refresh(updated: Job) {
    setJob({ ...updated, notes: [...updated.notes], tasks: [...updated.tasks] })
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
        // If still a data URL (mock mode), keep it locally
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

  function mediaSrc(task: { media?: { url?: string; dataUrl?: string } }) {
    return task.media?.url || task.media?.dataUrl || ''
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
    const updated = toggleJobTimer({ jobId: job!.id })
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
                {task.media && mediaSrc(task) ? (
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
                        {!resolved && task.requiresPhoto && (
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
                      </div>
                    </div>

                    {isNext && !resolved && (
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
                            {firebaseEnabled() ? 'Take photo (uploads to cloud)' : 'Take photo'}
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

                    {done && task.media && mediaSrc(task) && (
                      <img src={mediaSrc(task)} alt="" className="thumb" />
                    )}
                  </li>
                )
              })}
          </ul>
        </section>
      )}
    </div>
  )
}
