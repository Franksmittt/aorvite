import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ROLE_LABELS } from '../data/workers'
import { firebaseStatusLabel, isFirebaseConfigured } from '../lib/firebase'
import { LOCAL_FIRST_MODE, localFirstStatusLabel } from '../lib/localMode'
import {
  loadOrders,
  ORDERS_CHANGED_EVENT,
} from '../lib/inventoryStore'
import {
  canAccessWorkshop,
  canIssueOrders,
  canManage,
  jobProgress,
  type Job,
  type PartsOrder,
  type Worker,
} from '../types'
import { jobFrontThumb } from '../lib/jobThumbnail'

type Props = {
  worker: Worker
  jobs: Job[]
  cloudPullEnabled?: boolean
}

function statusTone(status: Job['status']) {
  if (status === 'Gone Out') return 'tone-done'
  if (status === 'Final Inspection') return 'tone-inspect'
  if (status === 'In Workshop') return 'tone-active'
  return 'tone-pending'
}

export function Hub({ worker, jobs, cloudPullEnabled }: Props) {
  const workshop = canAccessWorkshop(worker)
  const ordersFocus = worker.role === 'Orders'
  const manager = canManage(worker)

  const [orders, setOrders] = useState<PartsOrder[]>(() => loadOrders())

  useEffect(() => {
    const refresh = () => setOrders(loadOrders())
    window.addEventListener('storage', refresh)
    window.addEventListener(ORDERS_CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(ORDERS_CHANGED_EVENT, refresh)
    }
  }, [])

  const coming = jobs.filter((j) => j.status === 'Coming')
  const inShop = jobs.filter((j) => j.status === 'In Workshop')
  const inspect = jobs.filter((j) => j.status === 'Final Inspection')
  const goneOut = jobs.filter((j) => j.status === 'Gone Out')

  const openOrders = orders.filter(
    (o) => o.status === 'Open' || o.status === 'Issued' || o.status === 'Partially Received',
  )
  const requested = orders.filter((o) => o.status === 'Open')
  const issued = orders.filter((o) => o.status === 'Issued' || o.status === 'Partially Received')

  const floorJobs = useMemo(() => {
    return [...inShop, ...inspect]
      .sort((a, b) => jobProgress(a) - jobProgress(b))
      .slice(0, 6)
  }, [inShop, inspect])

  const attentionOrders = openOrders.slice(0, 5)

  return (
    <div className="screen screen-stack hub-screen">
      <PageHeader
        kicker="Ops"
        title="Control"
        subtitle="Floor, parts, and tools at a glance."
        actions={
          manager ? (
            <Link to="/intake" className="btn btn-primary">
              Book in vehicle
            </Link>
          ) : ordersFocus ? (
            <Link to="/orders" className="btn btn-primary">
              Open orders
            </Link>
          ) : workshop ? (
            <Link to="/workshop" className="btn btn-primary">
              Open workshop
            </Link>
          ) : null
        }
      />

      <section className="dash-panel dash-brief" aria-label="Floor brief">
        <div className="dash-panel-head">
          <div>
            <p className="dash-eyebrow">Floor brief</p>
            <h2>What needs eyes right now</h2>
          </div>
          <p className="dash-meta">
            {worker.fullName} · {ROLE_LABELS[worker.role]}
          </p>
        </div>
        <p className="dash-brief-copy">
          {inShop.length} in the bay
          {inspect.length ? ` · ${inspect.length} waiting final inspection` : ''}
          {requested.length ? ` · ${requested.length} parts request${requested.length === 1 ? '' : 's'} open` : ''}
          {issued.length ? ` · ${issued.length} with supplier` : ''}
          {!jobs.length && !orders.length
            ? 'Nothing on the board yet — book a vehicle or raise a parts request to start.'
            : '.'}
        </p>
        <p className={`dash-sync ${LOCAL_FIRST_MODE ? 'firebase-off' : isFirebaseConfigured() ? 'firebase-on' : 'firebase-off'}`}>
          {LOCAL_FIRST_MODE
            ? localFirstStatusLabel()
            : `${firebaseStatusLabel()}${!cloudPullEnabled ? ' · local jobs only' : ''}`}
        </p>
        {LOCAL_FIRST_MODE ? (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Finish the job on this phone. Photos are stored on-device. Turn Firebase sync back on later when rules are fixed.
          </p>
        ) : null}
      </section>

      {workshop ? (
        <section className="pipeline-summary" aria-label="Job pipeline">
          <div>
            <strong>{coming.length}</strong>
            <span>Coming</span>
          </div>
          <div>
            <strong>{inShop.length}</strong>
            <span>In shop</span>
          </div>
          <div>
            <strong>{inspect.length}</strong>
            <span>Inspect</span>
          </div>
          <div>
            <strong>{goneOut.length}</strong>
            <span>Gone out</span>
          </div>
        </section>
      ) : (
        <section className="pipeline-summary pipeline-summary-orders" aria-label="Orders snapshot">
          <div>
            <strong>{requested.length}</strong>
            <span>Requests</span>
          </div>
          <div>
            <strong>{issued.length}</strong>
            <span>With supplier</span>
          </div>
          <div>
            <strong>{orders.filter((o) => o.status === 'Received').length}</strong>
            <span>Received</span>
          </div>
          <div>
            <strong>{openOrders.length}</strong>
            <span>Open total</span>
          </div>
        </section>
      )}

      <div className="dash-split">
        {workshop ? (
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <p className="dash-eyebrow">Workshop</p>
                <h2>On the floor</h2>
              </div>
              <Link to="/workshop" className="btn btn-ghost btn-compact">
                Full board
              </Link>
            </div>
            {floorJobs.length === 0 ? (
              <p className="muted empty">No active jobs in the bay</p>
            ) : (
              <ul className="dash-list">
                {floorJobs.map((job) => {
                  const pct = jobProgress(job)
                  const thumb = jobFrontThumb(job)
                  return (
                    <li key={job.id}>
                      <Link to={`/job/${job.id}`} className="dash-row">
                        {thumb ? (
                          <img src={thumb} alt="" className="dash-row-thumb" />
                        ) : (
                          <div className="dash-row-thumb dash-row-thumb-empty" aria-hidden />
                        )}
                        <div className="dash-row-main">
                          <strong>{job.registration}</strong>
                          <span>
                            {job.year} {job.make} {job.model} · {job.packageName}
                          </span>
                        </div>
                        <div className="dash-row-side">
                          <span className={`dash-pill ${statusTone(job.status)}`}>
                            {job.status}
                          </span>
                          <span className="dash-pct">{pct}%</span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        ) : null}

        <section className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <p className="dash-eyebrow">Parts</p>
              <h2>Open orders</h2>
            </div>
            <Link to="/orders" className="btn btn-ghost btn-compact">
              {canIssueOrders(worker) ? 'Issue / receive' : 'Request parts'}
            </Link>
          </div>
          {attentionOrders.length === 0 ? (
            <p className="muted empty">No open parts orders</p>
          ) : (
            <ul className="dash-list">
              {attentionOrders.map((order) => (
                <li key={order.id}>
                  <Link to="/orders" className="dash-row">
                    <div className="dash-row-main">
                      <strong>{order.orderNumber}</strong>
                      <span>
                        {order.purpose === 'vehicle' && order.jobRegistration
                          ? order.jobRegistration
                          : 'Workshop supplies'}
                        {order.supplierName ? ` · ${order.supplierName}` : ''}
                      </span>
                    </div>
                    <div className="dash-row-side">
                      <span className="dash-pill tone-pending">{order.status}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="hub-grid">
        {workshop && (
          <Link to="/workshop" className="hub-card">
            <span className="hub-kicker">Floor</span>
            <strong>Workshop</strong>
            <p>Jobs, checklists, walkarounds, timers</p>
          </Link>
        )}

        <Link to="/orders" className={`hub-card ${ordersFocus ? 'hub-card-accent' : ''}`}>
          <span className="hub-kicker">Parts</span>
          <strong>Order</strong>
          <p>
            {canIssueOrders(worker)
              ? 'Accept requests → issue → print → receive'
              : 'Request parts — syncs to Yogs on every phone'}
          </p>
        </Link>

        {workshop && (
          <Link to="/stocktake" className="hub-card">
            <span className="hub-kicker">Tools</span>
            <strong>Stocktake</strong>
            <p>Count tools. Sign off missing — you pay.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
