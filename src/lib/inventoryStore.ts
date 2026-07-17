import { MOCK_ORDERS } from '../data/mockOrders'
import { PARTS_QUICKLIST } from '../data/partsCatalog'
import { DEFAULT_SUPPLIERS } from '../data/suppliers'
import { TOOLS } from '../data/tools'
import type {
  OrderLine,
  PartsOrder,
  PartsOrderStatus,
  PaymentMethod,
  Stocktake,
  StocktakeLine,
  Supplier,
} from '../types'

const ORDERS_KEY = 'aor-orders-v2'
const SUPPLIERS_KEY = 'aor-suppliers-v1'
const STOCKTAKES_KEY = 'aor-stocktakes-v1'
const ORDERS_SEEDED = 'aor-orders-seeded-v2'
const ORDER_SEQ_KEY = 'aor-order-seq'

function uid() {
  return crypto.randomUUID()
}

function ensureSuppliers() {
  if (!localStorage.getItem(SUPPLIERS_KEY)) {
    saveSuppliers(DEFAULT_SUPPLIERS)
  }
}

export function loadSuppliers(): Supplier[] {
  ensureSuppliers()
  const raw = localStorage.getItem(SUPPLIERS_KEY)
  if (!raw) return DEFAULT_SUPPLIERS
  try {
    return JSON.parse(raw) as Supplier[]
  } catch {
    return DEFAULT_SUPPLIERS
  }
}

export function saveSuppliers(suppliers: Supplier[]) {
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers))
}

export function addSupplier(input: {
  name: string
  defaultPayment: PaymentMethod
  hasAccount: boolean
  notes?: string
}): Supplier {
  const name = input.name.trim()
  if (!name) throw new Error('Supplier name required')
  const supplier: Supplier = {
    id: uid(),
    name,
    defaultPayment: input.defaultPayment,
    hasAccount: input.hasAccount,
    notes: input.notes?.trim() || undefined,
    active: true,
  }
  const all = loadSuppliers()
  all.push(supplier)
  saveSuppliers(all)
  return supplier
}

function ensureOrdersSeeded() {
  if (localStorage.getItem(ORDERS_SEEDED) === '1') return
  if (!localStorage.getItem(ORDERS_KEY)) {
    saveOrders(MOCK_ORDERS)
  }
  localStorage.setItem(ORDERS_SEEDED, '1')
}

export function loadOrders(): PartsOrder[] {
  ensureOrdersSeeded()
  const raw = localStorage.getItem(ORDERS_KEY)
  if (!raw) return []
  try {
    return (JSON.parse(raw) as PartsOrder[]).map(normalizeOrder)
  } catch {
    return []
  }
}

function normalizeOrder(order: PartsOrder): PartsOrder {
  const legacyStatus = order.status as string
  let status = order.status
  if (legacyStatus === 'Sent to Midas') status = 'Issued'
  if (legacyStatus === 'Collected') status = 'Received'

  return {
    ...order,
    supplierId: order.supplierId || 'sup-midas',
    supplierName: order.supplierName || 'Midas',
    status,
    lines: order.lines.map((line) => {
      const legacyLine = line.status as string
      let lineStatus = line.status
      if (legacyLine === 'Collected') lineStatus = 'Received'
      return {
        ...line,
        qtyReceived: line.qtyReceived ?? 0,
        status: lineStatus,
      }
    }),
  }
}

export function saveOrders(orders: PartsOrder[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function resetMockOrders() {
  saveOrders(MOCK_ORDERS)
  saveSuppliers(DEFAULT_SUPPLIERS)
  localStorage.setItem(ORDERS_SEEDED, '1')
}

function nextOrderNumber() {
  const current = Number(localStorage.getItem(ORDER_SEQ_KEY) || '1004')
  const next = current + 1
  localStorage.setItem(ORDER_SEQ_KEY, String(next))
  return `AOR-${next}`
}

export function createPartsOrder(input: {
  requestedByWorkerId: string
  jobId?: string
  jobRegistration?: string
  notes?: string
  lines: Array<{
    catalogId?: string
    name: string
    qty: number
    unit?: string
    note?: string
  }>
}): PartsOrder {
  if (input.lines.length === 0) throw new Error('Add at least one item')

  const midas = loadSuppliers().find((s) => s.id === 'sup-midas') ?? DEFAULT_SUPPLIERS[0]

  const order: PartsOrder = {
    id: uid(),
    orderNumber: nextOrderNumber(),
    createdAt: new Date().toISOString(),
    requestedByWorkerId: input.requestedByWorkerId,
    jobId: input.jobId,
    jobRegistration: input.jobRegistration?.trim().toUpperCase() || undefined,
    supplierId: midas.id,
    supplierName: midas.name,
    status: 'Open',
    notes: input.notes?.trim() || undefined,
    lines: input.lines.map((line) => {
      const catalog = line.catalogId
        ? PARTS_QUICKLIST.find((item) => item.id === line.catalogId)
        : undefined
      return {
        id: uid(),
        catalogId: line.catalogId,
        name: line.name.trim() || catalog?.name || 'Item',
        qty: Math.max(1, line.qty),
        qtyReceived: 0,
        unit: line.unit || catalog?.unit,
        note: line.note?.trim() || undefined,
        status: 'Requested',
        allocatedJobId: input.jobId,
        allocatedRegistration: input.jobRegistration?.trim().toUpperCase() || undefined,
      } satisfies OrderLine
    }),
  }

  const orders = loadOrders()
  orders.unshift(order)
  saveOrders(orders)
  return order
}

export function getOrder(orderId: string) {
  return loadOrders().find((o) => o.id === orderId)
}

export function updateOrder(order: PartsOrder) {
  const orders = loadOrders()
  const idx = orders.findIndex((o) => o.id === order.id)
  if (idx === -1) return
  orders[idx] = order
  saveOrders(orders)
}

export function issueOrder(opts: {
  orderId: string
  issuedByWorkerId: string
  supplierId: string
  paymentMethod: PaymentMethod
}): PartsOrder | null {
  const order = getOrder(opts.orderId)
  if (!order) return null
  if (order.status !== 'Open') throw new Error('Order already issued')

  const supplier = loadSuppliers().find((s) => s.id === opts.supplierId)
  if (!supplier) throw new Error('Supplier not found')

  if (opts.paymentMethod === 'Account' && !supplier.hasAccount) {
    throw new Error(`${supplier.name} has no account — use Cash or EFT`)
  }

  order.supplierId = supplier.id
  order.supplierName = supplier.name
  order.paymentMethod = opts.paymentMethod
  order.status = 'Issued'
  order.issuedByWorkerId = opts.issuedByWorkerId
  order.issuedAt = new Date().toISOString()
  order.lines = order.lines.map((line) =>
    line.status === 'Requested' ? { ...line, status: 'On Order' } : line,
  )
  updateOrder(order)
  return order
}

function deriveOrderStatus(lines: OrderLine[]): PartsOrderStatus {
  const active = lines.filter((l) => l.status !== 'Cancelled')
  if (active.length === 0) return 'Cancelled'

  const allDone = active.every(
    (l) => l.qtyReceived >= l.qty || l.status === 'Unavailable',
  )
  const anyReceived = active.some((l) => l.qtyReceived > 0)
  if (allDone) return 'Received'
  if (anyReceived) return 'Partially Received'
  return 'Issued'
}

function lineStatusFromQty(qty: number, qtyReceived: number): OrderLine['status'] {
  if (qtyReceived <= 0) return 'Unavailable'
  if (qtyReceived >= qty) return 'Received'
  return 'Partial'
}

export function receiveOrder(opts: {
  orderId: string
  receivedByWorkerId: string
  lines: Array<{
    lineId: string
    qtyReceived: number
    unavailable?: boolean
    allocatedJobId?: string
    allocatedRegistration?: string
    note?: string
  }>
}): PartsOrder | null {
  const order = getOrder(opts.orderId)
  if (!order) return null
  if (order.status === 'Open') throw new Error('Issue the order before receiving')

  order.lines = order.lines.map((line) => {
    const update = opts.lines.find((l) => l.lineId === line.id)
    if (!update) return line

    const qtyReceived = update.unavailable
      ? 0
      : Math.min(line.qty, Math.max(0, Math.floor(update.qtyReceived)))

    return {
      ...line,
      qtyReceived,
      status: update.unavailable ? 'Unavailable' : lineStatusFromQty(line.qty, qtyReceived),
      allocatedJobId: update.allocatedJobId ?? line.allocatedJobId,
      allocatedRegistration:
        update.allocatedRegistration ?? line.allocatedRegistration,
      note: update.note?.trim() || line.note,
    }
  })

  order.status = deriveOrderStatus(order.lines)
  order.receivedAt = new Date().toISOString()
  order.receivedByWorkerId = opts.receivedByWorkerId
  updateOrder(order)
  return order
}

export function loadStocktakes(): Stocktake[] {
  const raw = localStorage.getItem(STOCKTAKES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Stocktake[]
  } catch {
    return []
  }
}

export function saveStocktakes(stocktakes: Stocktake[]) {
  localStorage.setItem(STOCKTAKES_KEY, JSON.stringify(stocktakes))
}

export function submitStocktake(input: {
  workerId: string
  counts: Array<{ toolId: string; countedQty: number; note?: string }>
  acknowledged: boolean
}): Stocktake {
  if (!input.acknowledged) {
    throw new Error('You must acknowledge liability before submitting')
  }

  const lines: StocktakeLine[] = input.counts.map((row) => {
    const tool = TOOLS.find((t) => t.id === row.toolId)
    if (!tool) throw new Error('Unknown tool')
    const countedQty = Math.max(0, Math.floor(row.countedQty))
    let status: StocktakeLine['status'] = 'Present'
    if (countedQty <= 0) status = 'Missing'
    else if (countedQty < tool.expectedQty) status = 'Short'

    return {
      toolId: tool.id,
      toolName: tool.name,
      expectedQty: tool.expectedQty,
      countedQty,
      status,
      note: row.note?.trim() || undefined,
    }
  })

  const missing = lines.filter((l) => l.status === 'Missing')
  const short = lines.filter((l) => l.status === 'Short')
  const liabilityZar = [...missing, ...short].reduce((sum, line) => {
    const tool = TOOLS.find((t) => t.id === line.toolId)!
    const deficit = Math.max(0, line.expectedQty - line.countedQty)
    return sum + deficit * tool.estimatedValueZar
  }, 0)

  const stocktake: Stocktake = {
    id: uid(),
    workerId: input.workerId,
    createdAt: new Date().toISOString(),
    lines,
    missingCount: missing.length,
    shortCount: short.length,
    liabilityZar,
    acknowledged: true,
  }

  const all = loadStocktakes()
  all.unshift(stocktake)
  saveStocktakes(all)
  return stocktake
}

export function getStocktake(id: string) {
  return loadStocktakes().find((s) => s.id === id)
}
