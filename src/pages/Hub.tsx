import { Link } from 'react-router-dom'
import { ROLE_LABELS } from '../data/workers'
import { firebaseStatusLabel, isFirebaseConfigured } from '../lib/firebase'
import {
  canAccessWorkshop,
  canIssueOrders,
  type Worker,
} from '../types'

type Props = {
  worker: Worker
  onLogout: () => void
  buildId?: string
  cloudPullEnabled?: boolean
}

export function Hub({ worker, onLogout, buildId, cloudPullEnabled }: Props) {
  const workshop = canAccessWorkshop(worker)
  const ordersFocus = worker.role === 'Orders'

  return (
    <div className="screen screen-stack hub-screen">
      <header className="screen-header row">
        <div>
          <p className="brand brand-hero">Absolute Offroad</p>
          <h1 className="title-secondary">Control</h1>
          <p className="sub">
            {worker.fullName} · {ROLE_LABELS[worker.role]}
          </p>
          <p className={`sub ${isFirebaseConfigured() ? 'firebase-on' : 'firebase-off'}`}>
            {firebaseStatusLabel()}
            {!cloudPullEnabled ? ' · local jobs only' : ''}
          </p>
          <p className="build-stamp">Build {buildId ?? '—'} · aorvite.vercel.app</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onLogout}>
          Sign out
        </button>
      </header>

      <div className="hub-grid">
        {workshop && (
          <Link to="/workshop" className="hub-card">
            <span className="hub-kicker">Floor</span>
            <strong>Workshop</strong>
            <p>Jobs, checklists, photos, notes, timers</p>
          </Link>
        )}

        <Link to="/orders" className={`hub-card ${ordersFocus ? 'hub-card-accent' : ''}`}>
          <span className="hub-kicker">Parts</span>
          <strong>Order</strong>
          <p>
            {canIssueOrders(worker)
              ? 'Accept staff requests → issue → print → receive (live sync)'
              : 'Request parts — syncs to Yogs on every phone'}
          </p>
        </Link>

        {workshop && (
          <Link to="/stocktake" className="hub-card">
            <span className="hub-kicker">Tools</span>
            <strong>Stocktake</strong>
            <p>Count tools. If you sign off and it is missing — you pay.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
