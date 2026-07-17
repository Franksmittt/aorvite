import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { TOOLS } from '../data/tools'
import { WORKERS } from '../data/workers'
import { loadStocktakes, submitStocktake } from '../lib/inventoryStore'
import { canManage, type Worker } from '../types'

type Props = {
  worker: Worker
}

export function StocktakePage({ worker }: Props) {
  const [mode, setMode] = useState<'home' | 'count'>('home')
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(TOOLS.map((t) => [t.id, t.expectedQty])),
  )
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [ack, setAck] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState(() => loadStocktakes())

  const categories = useMemo(() => {
    const map = new Map<string, typeof TOOLS>()
    for (const tool of TOOLS) {
      const list = map.get(tool.category) ?? []
      list.push(tool)
      map.set(tool.category, list)
    }
    return [...map.entries()]
  }, [])

  function setQty(toolId: string, qty: number) {
    setCounts((prev) => ({ ...prev, [toolId]: Math.max(0, qty) }))
  }

  function markMissing(toolId: string) {
    setQty(toolId, 0)
  }

  function markPresent(toolId: string) {
    const tool = TOOLS.find((t) => t.id === toolId)
    if (tool) setQty(toolId, tool.expectedQty)
  }

  function submit() {
    setError(null)
    try {
      const stocktake = submitStocktake({
        workerId: worker.id,
        acknowledged: ack,
        counts: TOOLS.map((tool) => ({
          toolId: tool.id,
          countedQty: counts[tool.id] ?? 0,
          note: notes[tool.id],
        })),
      })
      setHistory(loadStocktakes())
      setMode('home')
      setAck(false)
      alert(
        stocktake.missingCount + stocktake.shortCount > 0
          ? `Submitted. ${stocktake.missingCount} missing, ${stocktake.shortCount} short. Est. liability R${stocktake.liabilityZar.toLocaleString()}`
          : 'Submitted. All tools present.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit')
    }
  }

  if (mode === 'count') {
    return (
      <div className="screen screen-stack">
        <AppNav
          title="Tool stocktake"
          subtitle="Count what is in front of you. Do not guess."
        />

        {error && <p className="error-text">{error}</p>}

        {categories.map(([category, tools]) => (
          <section key={category} className="section">
            <h2>{category}</h2>
            <ul className="tool-list">
              {tools.map((tool) => {
                const qty = counts[tool.id] ?? 0
                const bad = qty < tool.expectedQty
                return (
                  <li key={tool.id} className={`tool-card ${bad ? 'tool-bad' : ''}`}>
                    <div className="tool-card-top">
                      <div>
                        <p className="task-name">{tool.name}</p>
                        <p className="muted">
                          {tool.location} · expect {tool.expectedQty} · ~R
                          {tool.estimatedValueZar.toLocaleString()}
                        </p>
                      </div>
                      <div className="qty-controls">
                        <button
                          type="button"
                          className="btn btn-ghost qty-btn"
                          onClick={() => setQty(tool.id, qty - 1)}
                        >
                          −
                        </button>
                        <strong>{qty}</strong>
                        <button
                          type="button"
                          className="btn btn-ghost qty-btn"
                          onClick={() => setQty(tool.id, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="chip-row">
                      <button
                        type="button"
                        className="chip on"
                        onClick={() => markPresent(tool.id)}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => markMissing(tool.id)}
                      >
                        Missing
                      </button>
                    </div>
                    {bad && (
                      <input
                        className="inline-input"
                        placeholder="Note — last seen where / who had it?"
                        value={notes[tool.id] ?? ''}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [tool.id]: e.target.value }))
                        }
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        <section className="section liability-box">
          <label className="ack-row">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span>
              I confirm this count is accurate. If I mark a tool present and it is
              missing, I am liable for replacement cost.
            </span>
          </label>
          <button type="button" className="btn btn-primary btn-block" onClick={submit}>
            Submit stocktake
          </button>
          <button type="button" className="btn btn-skip" onClick={() => setMode('home')}>
            Cancel
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="screen screen-stack">
      <AppNav
        title="Stocktake"
        subtitle="Tools go missing. This is how we stop lying about it."
      />

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => setMode('count')}
      >
        Start tool stocktake
      </button>

      <section className="section">
        <h2>Tool register ({TOOLS.length})</h2>
        <ul className="job-list group">
          {TOOLS.slice(0, 6).map((tool) => (
            <li key={tool.id} className="job-card">
              <span className="plate" style={{ fontSize: '1.05rem' }}>
                {tool.name}
              </span>
              <span className="muted">
                {tool.category} · {tool.location}
              </span>
              <span className="muted">
                Qty {tool.expectedQty} · ~R{tool.estimatedValueZar.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        <p className="muted empty">Full list opens when you start a stocktake.</p>
      </section>

      <section className="section">
        <h2>Recent stocktakes</h2>
        {history.length === 0 ? (
          <p className="muted empty">No stocktakes yet</p>
        ) : (
          <ul className="job-list group">
            {history.slice(0, 8).map((s) => {
              const name =
                WORKERS.find((w) => w.id === s.workerId)?.fullName ?? s.workerId
              return (
                <li key={s.id}>
                  <Link to={`/stocktake/${s.id}`} className="job-card">
                    <div className="job-card-top">
                      <span className="plate" style={{ fontSize: '1.05rem' }}>
                        {name}
                      </span>
                      <span
                        className={`badge ${
                          s.missingCount + s.shortCount > 0
                            ? 'badge-inspection'
                            : 'badge-done'
                        }`}
                      >
                        {s.missingCount + s.shortCount > 0 ? 'Issues' : 'Clean'}
                      </span>
                    </div>
                    <span className="muted">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                    <span className="muted">
                      Missing {s.missingCount} · Short {s.shortCount}
                      {s.liabilityZar > 0
                        ? ` · Est. R${s.liabilityZar.toLocaleString()}`
                        : ''}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {canManage(worker) && (
          <p className="muted empty">
            Manager view: discrepancies are signed by the worker who counted.
          </p>
        )}
      </section>
    </div>
  )
}
