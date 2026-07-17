import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { PARTS_QUICKLIST } from '../data/partsCatalog'
import { WORKERS } from '../data/workers'
import {
  addSupplier,
  createAndIssueManualOrder,
  createPartsOrder,
  issueOrder,
  loadOrders,
  loadSuppliers,
  receiveOrder,
  resetMockOrders,
} from '../lib/inventoryStore'
import { loadJobs } from '../lib/store'
import {
  canIssueOrders,
  orderLineOutstanding,
  type OrderPurpose,
  type PartsOrder,
  type PaymentMethod,
  type Worker,
} from '../types'

type Props = {
  worker: Worker
}

type DraftLine = {
  key: string
  catalogId?: string
  name: string
  qty: number
  unit?: string
  note?: string
}

type ReceiveDraft = Record<
  string,
  {
    qtyReceived: number
    unavailable: boolean
    allocatedJobId: string
    note: string
  }
>

const PAYMENTS: PaymentMethod[] = ['Account', 'EFT', 'Cash']

function statusBadge(status: PartsOrder['status']) {
  if (status === 'Received') return 'badge badge-done'
  if (status === 'Partially Received') return 'badge badge-inspection'
  if (status === 'Issued') return 'badge badge-active'
  if (status === 'Open') return 'badge badge-pending'
  return 'badge badge-pending'
}

export function OrdersPage({ worker }: Props) {
  const issuer = canIssueOrders(worker)
  const [orders, setOrders] = useState(() => loadOrders())
  const [suppliers, setSuppliers] = useState(() => loadSuppliers())
  const [tab, setTab] = useState<'queue' | 'new' | 'manual' | 'suppliers'>(
    issuer ? 'queue' : 'new',
  )
  const [draft, setDraft] = useState<DraftLine[]>([])
  const [jobKey, setJobKey] = useState('')
  const [notes, setNotes] = useState('')
  const [customName, setCustomName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [orderPurpose, setOrderPurpose] = useState<OrderPurpose>('vehicle')

  const [issueFor, setIssueFor] = useState<PartsOrder | null>(null)
  const [issueSupplierId, setIssueSupplierId] = useState('sup-midas')
  const [issuePayment, setIssuePayment] = useState<PaymentMethod>('Account')

  const [receiveFor, setReceiveFor] = useState<PartsOrder | null>(null)
  const [receiveDraft, setReceiveDraft] = useState<ReceiveDraft>({})

  const [manualSupplierId, setManualSupplierId] = useState('sup-midas')
  const [manualPayment, setManualPayment] = useState<PaymentMethod>('Account')
  const [manualNotes, setManualNotes] = useState('')
  const [manualDraft, setManualDraft] = useState<DraftLine[]>([])
  const [manualCustomName, setManualCustomName] = useState('')

  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPayment, setNewSupplierPayment] =
    useState<PaymentMethod>('Cash')
  const [newSupplierAccount, setNewSupplierAccount] = useState(false)
  const [newSupplierNotes, setNewSupplierNotes] = useState('')

  const jobs = useMemo(() => loadJobs().filter((j) => j.status !== 'Gone Out'), [])
  const cleaningItems = useMemo(
    () => PARTS_QUICKLIST.filter((i) => i.category === 'Cleaning'),
    [],
  )

  const openOrders = orders.filter((o) => o.status === 'Open')
  const issuedOrders = orders.filter(
    (o) => o.status === 'Issued' || o.status === 'Partially Received',
  )
  const doneOrders = orders.filter((o) => o.status === 'Received')

  function refresh() {
    setOrders(loadOrders())
    setSuppliers(loadSuppliers())
  }

  function workerName(id?: string) {
    if (!id) return '—'
    return WORKERS.find((w) => w.id === id)?.fullName ?? id
  }

  function selectedJob() {
    return jobs.find((j) => j.id === jobKey)
  }

  function addCatalogItem(catalogId: string) {
    const item = PARTS_QUICKLIST.find((c) => c.id === catalogId)
    if (!item) return
    setDraft((prev) => {
      const existing = prev.find((line) => line.catalogId === catalogId)
      if (existing) {
        return prev.map((line) =>
          line.key === existing.key ? { ...line, qty: line.qty + 1 } : line,
        )
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          catalogId: item.id,
          name: item.name,
          qty: 1,
          unit: item.unit,
        },
      ]
    })
  }

  function addCustom(e: FormEvent) {
    e.preventDefault()
    if (!customName.trim()) return
    setDraft((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        name: customName.trim(),
        qty: 1,
        unit: 'ea',
      },
    ])
    setCustomName('')
  }

  function submitRequest(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const job = orderPurpose === 'vehicle' ? selectedJob() : undefined
      createPartsOrder({
        requestedByWorkerId: worker.id,
        purpose: orderPurpose === 'workshop' || !job ? 'workshop' : 'vehicle',
        jobId: job?.id,
        jobRegistration: job?.registration,
        notes,
        lines: draft.map((line) => ({
          catalogId: line.catalogId,
          name: line.name,
          qty: line.qty,
          unit: line.unit,
          note: line.note,
        })),
      })
      setDraft([])
      setNotes('')
      setJobKey('')
      setOrderPurpose('vehicle')
      refresh()
      setTab('queue')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create order')
    }
  }

  function addManualCatalogItem(catalogId: string) {
    const item = PARTS_QUICKLIST.find((c) => c.id === catalogId)
    if (!item) return
    setManualDraft((prev) => {
      const existing = prev.find((line) => line.catalogId === catalogId)
      if (existing) {
        return prev.map((line) =>
          line.key === existing.key ? { ...line, qty: line.qty + 1 } : line,
        )
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          catalogId: item.id,
          name: item.name,
          qty: 1,
          unit: item.unit,
        },
      ]
    })
  }

  function addManualCustom(e: FormEvent) {
    e.preventDefault()
    if (!manualCustomName.trim()) return
    setManualDraft((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        name: manualCustomName.trim(),
        qty: 1,
        unit: 'ea',
      },
    ])
    setManualCustomName('')
  }

  function onManualSupplierChange(id: string) {
    setManualSupplierId(id)
    const supplier = suppliers.find((s) => s.id === id)
    if (supplier) setManualPayment(supplier.defaultPayment)
  }

  function submitManualOrder(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const lines = manualDraft.map((line) => ({
        catalogId: line.catalogId,
        name: line.name,
        qty: line.qty,
        unit: line.unit,
        note: line.note,
      }))

      if (issuer) {
        createAndIssueManualOrder({
          requestedByWorkerId: worker.id,
          issuedByWorkerId: worker.id,
          supplierId: manualSupplierId,
          paymentMethod: manualPayment,
          notes: manualNotes || 'Manual workshop / supplies order',
          lines,
        })
      } else {
        createPartsOrder({
          requestedByWorkerId: worker.id,
          purpose: 'workshop',
          notes: manualNotes || 'Manual workshop / supplies order',
          lines,
        })
      }

      setManualDraft([])
      setManualNotes('')
      refresh()
      setTab('queue')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create manual order')
    }
  }

  function openIssue(order: PartsOrder) {
    const supplier =
      suppliers.find((s) => s.id === order.supplierId) ??
      suppliers.find((s) => s.active)
    setIssueFor(order)
    setIssueSupplierId(supplier?.id ?? 'sup-midas')
    setIssuePayment(supplier?.defaultPayment ?? 'Account')
  }

  function onSupplierChange(id: string) {
    setIssueSupplierId(id)
    const supplier = suppliers.find((s) => s.id === id)
    if (supplier) setIssuePayment(supplier.defaultPayment)
  }

  function confirmIssue() {
    if (!issueFor) return
    setError(null)
    try {
      issueOrder({
        orderId: issueFor.id,
        issuedByWorkerId: worker.id,
        supplierId: issueSupplierId,
        paymentMethod: issuePayment,
      })
      setIssueFor(null)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue')
    }
  }

  function openReceive(order: PartsOrder) {
    const draftState: ReceiveDraft = {}
    for (const line of order.lines) {
      draftState[line.id] = {
        qtyReceived: line.qtyReceived > 0 ? line.qtyReceived : line.qty,
        unavailable: line.status === 'Unavailable',
        allocatedJobId: line.allocatedJobId ?? order.jobId ?? '',
        note: line.note ?? '',
      }
    }
    setReceiveDraft(draftState)
    setReceiveFor(order)
  }

  function confirmReceive() {
    if (!receiveFor) return
    setError(null)
    try {
      receiveOrder({
        orderId: receiveFor.id,
        receivedByWorkerId: worker.id,
        lines: receiveFor.lines.map((line) => {
          const row = receiveDraft[line.id]
          const job = jobs.find((j) => j.id === row?.allocatedJobId)
          return {
            lineId: line.id,
            qtyReceived: row?.unavailable ? 0 : (row?.qtyReceived ?? 0),
            unavailable: row?.unavailable,
            allocatedJobId: job?.id,
            allocatedRegistration: job?.registration,
            note: row?.note,
          }
        }),
      })
      setReceiveFor(null)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not receive')
    }
  }

  function submitSupplier(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      addSupplier({
        name: newSupplierName,
        defaultPayment: newSupplierPayment,
        hasAccount: newSupplierAccount,
        notes: newSupplierNotes,
      })
      setNewSupplierName('')
      setNewSupplierNotes('')
      setNewSupplierAccount(false)
      setNewSupplierPayment('Cash')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add supplier')
    }
  }

  return (
    <div className="screen screen-stack">
      <AppNav
        title="Orders"
        subtitle={
          issuer
            ? 'Issue → print → receive what actually came back → allocate to jobs'
            : 'Request parts — Yogs issues to the right supplier'
        }
      />

      <div className="chip-row chip-row-scroll">
        <button
          type="button"
          className={`chip ${tab === 'queue' ? 'on' : ''}`}
          onClick={() => setTab('queue')}
        >
          Queue
        </button>
        <button
          type="button"
          className={`chip ${tab === 'new' ? 'on' : ''}`}
          onClick={() => setTab('new')}
        >
          New request
        </button>
        <button
          type="button"
          className={`chip ${tab === 'manual' ? 'on' : ''}`}
          onClick={() => setTab('manual')}
        >
          Manual order
        </button>
        {issuer && (
          <>
            <button
              type="button"
              className={`chip ${tab === 'suppliers' ? 'on' : ''}`}
              onClick={() => setTab('suppliers')}
            >
              Suppliers
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                resetMockOrders()
                refresh()
              }}
            >
              Reset demo
            </button>
          </>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {issueFor && (
        <section className="section panel-modal">
          <h2>Issue {issueFor.orderNumber}</h2>
          <p className="muted">
            Choose supplier + how it is paid before printing the run sheet.
          </p>
          <label className="field">
            <span>Supplier</span>
            <select
              value={issueSupplierId}
              onChange={(e) => onSupplierChange(e.target.value)}
            >
              {suppliers
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.hasAccount ? ' (account)' : ' (no account)'}
                  </option>
                ))}
            </select>
          </label>
          <div className="field">
            <span>Payment</span>
            <div className="chip-row">
              {PAYMENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${issuePayment === p ? 'on' : ''}`}
                  onClick={() => setIssuePayment(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="order-actions">
            <button type="button" className="btn btn-primary" onClick={confirmIssue}>
              Issue & ready to print
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIssueFor(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {receiveFor && (
        <section className="section panel-modal">
          <h2>Receive {receiveFor.orderNumber}</h2>
          <p className="muted">
            Tick what actually came back. Outstanding lines stay open for follow-up.
            Allocate each received line to a client job.
          </p>
          <ul className="receive-list">
            {receiveFor.lines.map((line) => {
              const row = receiveDraft[line.id]
              return (
                <li key={line.id} className="receive-card">
                  <p className="task-name">{line.name}</p>
                  <p className="muted">
                    Ordered {line.qty} {line.unit || ''}
                    {orderLineOutstanding(line) > 0 && line.qtyReceived > 0
                      ? ` · already received ${line.qtyReceived}`
                      : ''}
                  </p>
                  <label className="ack-row compact">
                    <input
                      type="checkbox"
                      checked={row?.unavailable ?? false}
                      onChange={(e) =>
                        setReceiveDraft((prev) => ({
                          ...prev,
                          [line.id]: {
                            ...prev[line.id],
                            unavailable: e.target.checked,
                            qtyReceived: e.target.checked ? 0 : prev[line.id].qtyReceived,
                          },
                        }))
                      }
                    />
                    <span>No stock / unavailable</span>
                  </label>
                  {!row?.unavailable && (
                    <div className="qty-controls">
                      <span className="muted">Received</span>
                      <button
                        type="button"
                        className="btn btn-ghost qty-btn"
                        onClick={() =>
                          setReceiveDraft((prev) => ({
                            ...prev,
                            [line.id]: {
                              ...prev[line.id],
                              qtyReceived: Math.max(0, prev[line.id].qtyReceived - 1),
                            },
                          }))
                        }
                      >
                        −
                      </button>
                      <strong>{row?.qtyReceived ?? 0}</strong>
                      <button
                        type="button"
                        className="btn btn-ghost qty-btn"
                        onClick={() =>
                          setReceiveDraft((prev) => ({
                            ...prev,
                            [line.id]: {
                              ...prev[line.id],
                              qtyReceived: Math.min(
                                line.qty,
                                prev[line.id].qtyReceived + 1,
                              ),
                            },
                          }))
                        }
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="chip on"
                        onClick={() =>
                          setReceiveDraft((prev) => ({
                            ...prev,
                            [line.id]: {
                              ...prev[line.id],
                              qtyReceived: line.qty,
                              unavailable: false,
                            },
                          }))
                        }
                      >
                        All
                      </button>
                    </div>
                  )}
                  <label className="field">
                    <span>Allocate to job</span>
                    <select
                      value={row?.allocatedJobId ?? ''}
                      onChange={(e) =>
                        setReceiveDraft((prev) => ({
                          ...prev,
                          [line.id]: {
                            ...prev[line.id],
                            allocatedJobId: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">General workshop stock</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.registration} · {job.packageName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    className="inline-input"
                    placeholder="Note (partial / substitute / backorder)"
                    value={row?.note ?? ''}
                    onChange={(e) =>
                      setReceiveDraft((prev) => ({
                        ...prev,
                        [line.id]: { ...prev[line.id], note: e.target.value },
                      }))
                    }
                  />
                </li>
              )
            })}
          </ul>
          <div className="order-actions">
            <button type="button" className="btn btn-primary" onClick={confirmReceive}>
              Save receipt
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setReceiveFor(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {tab === 'manual' ? (
        <section className="section">
          <h2>Manual / workshop order</h2>
          <p className="muted">
            For supplies that are not for a client vehicle — cleaning gear,
            shop consumables, Midas run for the workshop, etc.
          </p>

          <h3 className="subsection-title">Cleaning &amp; workshop</h3>
          <div className="quicklist-grid">
            {cleaningItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="quick-item"
                onClick={() => addManualCatalogItem(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.category}</span>
              </button>
            ))}
          </div>

          <details className="more-list">
            <summary>All quicklist items</summary>
            <div className="quicklist-grid">
              {PARTS_QUICKLIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="quick-item"
                  onClick={() => addManualCatalogItem(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                </button>
              ))}
            </div>
          </details>

          <form className="note-form" onSubmit={addManualCustom}>
            <input
              className="inline-input"
              placeholder="Custom item (e.g. mop heads)"
              value={manualCustomName}
              onChange={(e) => setManualCustomName(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost">
              Add custom
            </button>
          </form>

          <form className="form group-form" onSubmit={submitManualOrder}>
            {issuer && (
              <>
                <label className="field">
                  <span>Supplier</span>
                  <select
                    value={manualSupplierId}
                    onChange={(e) => onManualSupplierChange(e.target.value)}
                  >
                    {suppliers
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.hasAccount ? ' (account)' : ' (no account)'}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="field">
                  <span>Payment</span>
                  <div className="chip-row">
                    {PAYMENTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`chip ${manualPayment === p ? 'on' : ''}`}
                        onClick={() => setManualPayment(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <label className="field">
              <span>What is this for?</span>
              <input
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="e.g. Bay cleaning gear / workshop stock"
              />
            </label>

            <div className="field assign-field">
              <span>Selected items</span>
              {manualDraft.length === 0 ? (
                <p className="muted">Tap items above</p>
              ) : (
                <ul className="draft-list">
                  {manualDraft.map((line) => (
                    <li key={line.key}>
                      <div className="draft-row">
                        <strong>{line.name}</strong>
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="btn btn-ghost qty-btn"
                            onClick={() =>
                              setManualDraft((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, qty: Math.max(1, l.qty - 1) }
                                    : l,
                                ),
                              )
                            }
                          >
                            −
                          </button>
                          <span>{line.qty}</span>
                          <button
                            type="button"
                            className="btn btn-ghost qty-btn"
                            onClick={() =>
                              setManualDraft((prev) =>
                                prev.map((l) =>
                                  l.key === line.key ? { ...l, qty: l.qty + 1 } : l,
                                ),
                              )
                            }
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost qty-btn"
                            onClick={() =>
                              setManualDraft((prev) =>
                                prev.filter((l) => l.key !== line.key),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              {issuer ? 'Create & issue manual order' : 'Send manual request to Yogs'}
            </button>
          </form>
        </section>
      ) : tab === 'suppliers' && issuer ? (
        <section className="section">
          <h2>Suppliers</h2>
          <ul className="job-list group">
            {suppliers.map((s) => (
              <li key={s.id} className="job-card">
                <div className="job-card-top">
                  <span className="plate" style={{ fontSize: '1.1rem' }}>
                    {s.name}
                  </span>
                  <span className="badge badge-active">{s.defaultPayment}</span>
                </div>
                <span className="muted">
                  {s.hasAccount ? 'Has account' : 'No account'} ·{' '}
                  {s.notes || 'No notes'}
                </span>
              </li>
            ))}
          </ul>

          <form className="form group-form" onSubmit={submitSupplier}>
            <label className="field">
              <span>New supplier</span>
              <input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="e.g. Local bolt shop"
              />
            </label>
            <div className="field">
              <span>Default payment</span>
              <div className="chip-row">
                {PAYMENTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip ${newSupplierPayment === p ? 'on' : ''}`}
                    onClick={() => setNewSupplierPayment(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <label className="field ack-row compact">
              <input
                type="checkbox"
                checked={newSupplierAccount}
                onChange={(e) => setNewSupplierAccount(e.target.checked)}
              />
              <span>We have an account here</span>
            </label>
            <label className="field">
              <span>Notes</span>
              <input
                value={newSupplierNotes}
                onChange={(e) => setNewSupplierNotes(e.target.value)}
                placeholder="Cash only, after hours, etc."
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block">
              Add supplier
            </button>
          </form>
        </section>
      ) : tab === 'new' ? (
        <section className="section">
          <h2>Quicklist</h2>
          <div className="quicklist-grid">
            {PARTS_QUICKLIST.filter((i) => i.popular).map((item) => (
              <button
                key={item.id}
                type="button"
                className="quick-item"
                onClick={() => addCatalogItem(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.category}</span>
              </button>
            ))}
          </div>

          <details className="more-list">
            <summary>Full list</summary>
            <div className="quicklist-grid">
              {PARTS_QUICKLIST.filter((i) => !i.popular).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="quick-item"
                  onClick={() => addCatalogItem(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                </button>
              ))}
            </div>
          </details>

          <form className="note-form" onSubmit={addCustom}>
            <input
              className="inline-input"
              placeholder="Custom item"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost">
              Add custom
            </button>
          </form>

          <form className="form group-form" onSubmit={submitRequest}>
            <div className="field">
              <span>Order type</span>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${orderPurpose === 'vehicle' ? 'on' : ''}`}
                  onClick={() => setOrderPurpose('vehicle')}
                >
                  Client vehicle
                </button>
                <button
                  type="button"
                  className={`chip ${orderPurpose === 'workshop' ? 'on' : ''}`}
                  onClick={() => {
                    setOrderPurpose('workshop')
                    setJobKey('')
                  }}
                >
                  Workshop / supplies
                </button>
              </div>
            </div>

            {orderPurpose === 'vehicle' ? (
              <label className="field">
                <span>Client job (optional)</span>
                <select value={jobKey} onChange={(e) => setJobKey(e.target.value)}>
                  <option value="">General workshop stock</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.registration} · {job.packageName}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="muted purpose-hint">
                Not tied to a client vehicle — cleaning gear, shop stock, etc.
              </p>
            )}

            <label className="field">
              <span>Note to Yogs</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Urgent / which bay / what it is for"
              />
            </label>

            <div className="field assign-field">
              <span>Selected items</span>
              {draft.length === 0 ? (
                <p className="muted">Tap quicklist items above</p>
              ) : (
                <ul className="draft-list">
                  {draft.map((line) => (
                    <li key={line.key}>
                      <div className="draft-row">
                        <strong>{line.name}</strong>
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="btn btn-ghost qty-btn"
                            onClick={() =>
                              setDraft((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, qty: Math.max(1, l.qty - 1) }
                                    : l,
                                ),
                              )
                            }
                          >
                            −
                          </button>
                          <span>{line.qty}</span>
                          <button
                            type="button"
                            className="btn btn-ghost qty-btn"
                            onClick={() =>
                              setDraft((prev) =>
                                prev.map((l) =>
                                  l.key === line.key ? { ...l, qty: l.qty + 1 } : l,
                                ),
                              )
                            }
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost qty-btn"
                            onClick={() =>
                              setDraft((prev) => prev.filter((l) => l.key !== line.key))
                            }
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Send request to Yogs
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="section">
            <h2>
              Open requests <span className="section-count">{openOrders.length}</span>
            </h2>
            {openOrders.length === 0 ? (
              <p className="muted empty">Nothing waiting</p>
            ) : (
              <ul className="job-list group">
                {openOrders.map((order) => (
                  <li key={order.id}>
                    <div className="job-card order-card">
                      <div className="job-card-top">
                        <span className="plate" style={{ fontSize: '1.15rem' }}>
                          {order.orderNumber}
                        </span>
                        <span className={statusBadge(order.status)}>Open</span>
                      </div>
                      <div className="order-card-meta">
                        <span className="muted">
                          {workerName(order.requestedByWorkerId)}
                          {order.purpose === 'workshop' ||
                          (!order.jobRegistration && order.purpose !== 'vehicle')
                            ? ' · Workshop / supplies'
                            : order.jobRegistration
                              ? ` · ${order.jobRegistration}`
                              : ' · General stock'}
                        </span>
                        <span className="muted">
                          {order.lines.length} item{order.lines.length === 1 ? '' : 's'} ·{' '}
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <ul className="order-lines-preview">
                        {order.lines.map((line) => (
                          <li key={line.id}>
                            {line.qty}× {line.name}
                          </li>
                        ))}
                      </ul>
                      {issuer && (
                        <div className="order-actions">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openIssue(order)}
                          >
                            Issue to supplier
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section">
            <h2>
              Out / partial <span className="section-count">{issuedOrders.length}</span>
            </h2>
            {issuedOrders.length === 0 ? (
              <p className="muted empty">None outstanding</p>
            ) : (
              <ul className="job-list group">
                {issuedOrders.map((order) => (
                  <li key={order.id}>
                    <div className="job-card order-card">
                      <div className="job-card-top">
                        <span className="plate" style={{ fontSize: '1.15rem' }}>
                          {order.orderNumber}
                        </span>
                        <span className={statusBadge(order.status)}>{order.status}</span>
                      </div>
                      <div className="order-card-meta">
                        <span className="muted">
                          {order.supplierName} · {order.paymentMethod || 'Payment TBD'}
                        </span>
                        <span className="muted">
                          {order.purpose === 'workshop' ||
                          (!order.jobRegistration && order.purpose !== 'vehicle')
                            ? 'Workshop / supplies'
                            : order.jobRegistration
                              ? `Job ${order.jobRegistration}`
                              : 'General stock'}
                          {' · '}
                          {workerName(order.requestedByWorkerId)}
                        </span>
                      </div>
                      <ul className="order-lines-preview">
                        {order.lines.map((line) => (
                          <li key={line.id}>
                            {line.name}: {line.qtyReceived}/{line.qty}
                            {line.allocatedRegistration
                              ? ` → ${line.allocatedRegistration}`
                              : ''}
                            {line.status === 'Unavailable' ? ' (no stock)' : ''}
                          </li>
                        ))}
                      </ul>
                      <div className="order-actions">
                        <Link
                          to={`/orders/${order.id}/print`}
                          className="btn btn-ghost"
                        >
                          Print order
                        </Link>
                        {issuer && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openReceive(order)}
                          >
                            Receive goods
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {doneOrders.length > 0 && (
            <section className="section">
              <h2>
                Fully received <span className="section-count">{doneOrders.length}</span>
              </h2>
              <ul className="job-list group">
                {doneOrders.slice(0, 6).map((order) => (
                  <li key={order.id}>
                    <Link to={`/orders/${order.id}/print`} className="job-card order-card">
                      <div className="job-card-top">
                        <span className="plate" style={{ fontSize: '1.1rem' }}>
                          {order.orderNumber}
                        </span>
                        <span className="badge badge-done">Received</span>
                      </div>
                      <div className="order-card-meta">
                        <span className="muted">
                          {order.supplierName} · {order.paymentMethod}
                        </span>
                        <span className="muted">
                          {order.jobRegistration || 'General'} ·{' '}
                          {workerName(order.requestedByWorkerId)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
