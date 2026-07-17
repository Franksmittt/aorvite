import type { Worker } from '../types'

export const WORKERS: Worker[] = [
  { id: 'jaco', fullName: 'Jaco', role: 'Owner', pin: '1111' },
  { id: 'marius', fullName: 'Marius', role: 'Manager', pin: '2222' },
  { id: 'jovan', fullName: 'Jovan', role: 'Staff', pin: '3333' },
  { id: 'themba', fullName: 'Themba', role: 'Staff', pin: '4444' },
  { id: 'thando', fullName: 'Thando', role: 'Staff', pin: '5555' },
  { id: 'yogs', fullName: 'Yogs', role: 'Orders', pin: '6666' },
]

export const ROLE_LABELS: Record<Worker['role'], string> = {
  Owner: 'Company Owner',
  Manager: 'Workshop Manager',
  Staff: 'Staff',
  Orders: 'Parts / Orders',
}

export const COMPANY = {
  name: 'Absolute Offroad',
  tradingAs: 'Absolute Offroad',
  tagline: '4x4 Upgrades · Suspension · Bumpers · Accessories',
  addressLines: ['Alberton', 'Gauteng', 'South Africa'],
  phone: '011 000 0000',
  email: 'orders@absoluteoffroad.co.za',
  vat: 'VAT: TBD',
  accountRef: 'MIDAS ACCOUNT — Absolute Offroad',
}
