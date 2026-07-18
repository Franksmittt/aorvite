import { Link, useParams } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { WORKERS } from '../data/workers'
import { getStocktake } from '../lib/inventoryStore'

export function StocktakeDetailPage() {
  const { stocktakeId } = useParams()
  const stocktake = stocktakeId ? getStocktake(stocktakeId) : undefined

  if (!stocktake) {
    return (
      <div className="screen screen-stack">
        <p className="error-text">Stocktake not found</p>
        <Link to="/stocktake" className="btn btn-primary">
          Back
        </Link>
      </div>
    )
  }

  const name =
    WORKERS.find((w) => w.id === stocktake.workerId)?.fullName ?? stocktake.workerId
  const issues = stocktake.lines.filter((l) => l.status !== 'Present')

  return (
    <div className="screen screen-stack">
      <AppNav
        title="Stocktake result"
        subtitle={`${name} · ${new Date(stocktake.createdAt).toLocaleString()}`}
        backTo="/stocktake"
        backLabel="Stocktake"
      />

      <div className="pipeline-summary">
        <div>
          <strong>{stocktake.missingCount}</strong>
          <span>Missing</span>
        </div>
        <div>
          <strong>{stocktake.shortCount}</strong>
          <span>Short</span>
        </div>
        <div>
          <strong>R{(stocktake.liabilityZar / 1000).toFixed(1)}k</strong>
          <span>Liability</span>
        </div>
        <div>
          <strong>{stocktake.acknowledged ? 'Yes' : 'No'}</strong>
          <span>Signed</span>
        </div>
      </div>

      <section className="section">
        <h2>Discrepancies</h2>
        {issues.length === 0 ? (
          <p className="muted empty">All present</p>
        ) : (
          <ul className="tool-list">
            {issues.map((line) => (
              <li key={line.toolId} className="tool-card tool-bad">
                <p className="task-name">{line.toolName}</p>
                <p className="muted">
                  {line.status}: counted {line.countedQty} / expected {line.expectedQty}
                </p>
                {line.note && <p className="skip-note">{line.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Full count</h2>
        <ul className="job-list group">
          {stocktake.lines.map((line) => (
            <li key={line.toolId} className="job-card">
              <div className="job-card-top">
                <span className="plate" style={{ fontSize: '1rem' }}>
                  {line.toolName}
                </span>
                <span
                  className={`badge ${
                    line.status === 'Present'
                      ? 'badge-done'
                      : line.status === 'Missing'
                        ? 'badge-inspection'
                        : 'badge-active'
                  }`}
                >
                  {line.status}
                </span>
              </div>
              <span className="muted">
                {line.countedQty} / {line.expectedQty}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
