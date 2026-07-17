import { Link, useParams } from 'react-router-dom'
import { COMPANY, WORKERS } from '../data/workers'
import { getOrder } from '../lib/inventoryStore'

export function OrderPrintPage() {
  const { orderId } = useParams()
  const order = orderId ? getOrder(orderId) : undefined

  if (!order) {
    return (
      <div className="screen">
        <p className="error-text">Order not found</p>
        <Link to="/orders" className="btn btn-primary">
          Back to orders
        </Link>
      </div>
    )
  }

  const requestedBy =
    WORKERS.find((w) => w.id === order.requestedByWorkerId)?.fullName ?? '—'
  const issuedBy = order.issuedByWorkerId
    ? WORKERS.find((w) => w.id === order.issuedByWorkerId)?.fullName
    : undefined

  return (
    <div className="print-page">
      <div className="no-print print-toolbar">
        <Link to="/orders" className="btn btn-ghost">
          ‹ Orders
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print order
        </button>
      </div>

      <article className="print-sheet">
        <header className="print-header">
          <div>
            <p className="print-brand">{COMPANY.name}</p>
            <p className="print-tagline">{COMPANY.tagline}</p>
            {COMPANY.addressLines.map((line) => (
              <p key={line} className="print-meta">
                {line}
              </p>
            ))}
            <p className="print-meta">
              {COMPANY.phone} · {COMPANY.email}
            </p>
            <p className="print-meta">{COMPANY.vat}</p>
          </div>
          <div className="print-order-box">
            <p>PARTS ORDER</p>
            <strong>{order.orderNumber}</strong>
            <span>Supplier: {order.supplierName}</span>
            <span>Pay: {order.paymentMethod || 'TBD'}</span>
            {order.paymentMethod === 'Account' && (
              <span>{COMPANY.accountRef.replace('MIDAS', order.supplierName.toUpperCase())}</span>
            )}
          </div>
        </header>

        <section className="print-meta-grid">
          <div>
            <span>Date</span>
            <strong>{new Date(order.issuedAt ?? order.createdAt).toLocaleString()}</strong>
          </div>
          <div>
            <span>Requested by</span>
            <strong>{requestedBy}</strong>
          </div>
          <div>
            <span>Issued by</span>
            <strong>{issuedBy ?? '—'}</strong>
          </div>
          <div>
            <span>Primary job</span>
            <strong>
              {order.purpose === 'workshop' ||
              (!order.jobRegistration && order.purpose !== 'vehicle')
                ? 'Workshop / supplies (manual)'
                : order.jobRegistration || 'General workshop stock'}
            </strong>
          </div>
        </section>

        {order.notes && (
          <p className="print-notes">
            <strong>Notes:</strong> {order.notes}
          </p>
        )}

        <div className="print-table-wrap">
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th className="print-col-secondary">Allocate to</th>
                <th className="print-col-secondary">Note</th>
                <th>Got</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line, idx) => (
                <tr key={line.id}>
                  <td>{idx + 1}</td>
                  <td>{line.name}</td>
                  <td>{line.qty}</td>
                  <td>{line.unit || '—'}</td>
                  <td className="print-col-secondary">
                    {line.allocatedRegistration ||
                      (order.purpose === 'workshop' ? 'Workshop' : 'General')}
                  </td>
                  <td className="print-col-secondary">{line.note || ''}</td>
                  <td>☐ ____</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="print-footer">
          <div>
            <p>Collected by (print name)</p>
            <div className="sign-line" />
          </div>
          <div>
            <p>Signature</p>
            <div className="sign-line" />
          </div>
          <div>
            <p>Payment confirmation</p>
            <div className="sign-line" />
          </div>
        </footer>

        <p className="print-fine">
          Issued by Absolute Offroad for collection at {order.supplierName}. Payment:{' '}
          {order.paymentMethod || 'TBD'}. Mark what was received on return — Yogs captures
          shortages in the app.
        </p>
      </article>
    </div>
  )
}
