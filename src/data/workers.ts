import type { Worker } from '../types'

export const WORKERS: Worker[] = [
  { id: 'jaco', fullName: 'Jaco', role: 'Owner', pin: '1111' },
  { id: 'marius', fullName: 'Marius', role: 'Staff', pin: '2222' },
  /** New starter — probation from 22 Jul 2026 */
  { id: 'marius2', fullName: 'Marius 2', role: 'Staff', pin: '7777' },
  { id: 'jovan', fullName: 'Jovan', role: 'Staff', pin: '3333' },
  /** No phone login — still assignable on jobs / project history. */
  { id: 'themba', fullName: 'Themba', role: 'Staff', pin: '4444', canLogin: false },
  { id: 'thando', fullName: 'Thando', role: 'Staff', pin: '5555' },
  { id: 'yogs', fullName: 'Yogs', role: 'Orders', pin: '6666' },
]

export const LOGIN_WORKERS = WORKERS.filter((w) => w.canLogin !== false)

export const ROLE_LABELS: Record<Worker['role'], string> = {
  Owner: 'Company Owner',
  Manager: 'Manager',
  Staff: 'Staff',
  Orders: 'Parts / Orders',
}

export const COMPANY = {
  name: 'Absolute Offroad',
  tradingAs: 'Absolute Offroad',
  tagline: '4x4 Upgrades · Suspension · Bumpers · Accessories',
  addressLines: ['28 St Columb Rd, New Redruth', 'Alberton, 1449'],
  phoneJaco: '079 507 0901',
  phoneOffice: '010 109 6211',
  phones: 'Jaco: 079 507 0901 · Office: 010 109 6211',
  vat: 'VAT: 49302955300',
  accountRef: 'MIDAS ACCOUNT — Absolute Offroad',
}
