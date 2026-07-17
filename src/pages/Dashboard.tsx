import { Link } from 'react-router-dom'
import { ROLE_LABELS, WORKERS } from '../data/workers'
import { canManage, jobProgress, type Job, type Worker } from '../types'

type Props = {
  worker: Worker
  jobs: Job[]
  onLogout: () => void
}

function statusClass(status: Job['status']) {
  if (status === 'Gone Out') return 'badge badge-done'
  if (status === 'Final Inspection') return 'badge badge-inspection'
  if (status === 'In Workshop') return 'badge badge-active'
  return 'badge badge-pending'
}

function workerNames(ids: string[]) {
  if (ids.length === 0) return 'Unassigned'
  return ids
    .map((id) => WORKERS.find((w) => w.id === id)?.fullName ?? id)
    .join(', ')
}

function JobRow({ job }: { job: Job }) {
  const pct = jobProgress(job)
  return (
    <Link to={`/job/${job.id}`} className="job-card">
      <div className="job-card-top">
        <span className="plate">{job.registration}</span>
        <span className="progress-pct">{pct}%</span>
      </div>
      <span className="muted">
        {job.year} {job.make} {job.model}
      </span>
      <span className="muted">{job.packageName}</span>
      <span className="muted">Assigned: {workerNames(job.assignedWorkerIds)}</span>
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={statusClass(job.status)}>{job.status}</span>
    </Link>
  )
}

function JobSection({
  title,
  jobs,
  empty,
}: {
  title: string
  jobs: Job[]
  empty: string
}) {
  return (
    <section className="section">
      <h2>
        {title}
        <span className="section-count">{jobs.length}</span>
      </h2>
      {jobs.length === 0 ? (
        <p className="muted empty">{empty}</p>
      ) : (
        <ul className="job-list group">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Dashboard({ worker, jobs, onLogout }: Props) {
  const coming = jobs.filter((j) => j.status === 'Coming')
  const workshop = jobs.filter((j) => j.status === 'In Workshop')
  const inspections = jobs.filter((j) => j.status === 'Final Inspection')
  const goneOut = jobs.filter((j) => j.status === 'Gone Out')

  return (
    <div className="screen">
      <header className="screen-header row">
        <div>
          <Link to="/" className="link-back">
            ‹ Control
          </Link>
          <p className="brand">Absolute Offroad</p>
          <h1>Workshop</h1>
          <p className="sub">
            {worker.fullName} · {ROLE_LABELS[worker.role]}
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onLogout}>
          Sign out
        </button>
      </header>

      {canManage(worker) && (
        <div className="action-stack">
          <Link to="/intake" className="btn btn-primary btn-block">
            Book in vehicle
          </Link>
        </div>
      )}

      <div className="pipeline-summary">
        <div>
          <strong>{coming.length}</strong>
          <span>Coming</span>
        </div>
        <div>
          <strong>{workshop.length}</strong>
          <span>In shop</span>
        </div>
        <div>
          <strong>{inspections.length}</strong>
          <span>Inspect</span>
        </div>
        <div>
          <strong>{goneOut.length}</strong>
          <span>Gone out</span>
        </div>
      </div>

      <JobSection title="Coming in" jobs={coming} empty="Nothing booked ahead" />
      <JobSection title="In the workshop" jobs={workshop} empty="No jobs on the floor" />
      <JobSection
        title="Final inspection"
        jobs={inspections}
        empty="Nothing waiting for release"
      />
      <JobSection title="Gone out" jobs={goneOut} empty="No completed jobs yet" />
    </div>
  )
}
