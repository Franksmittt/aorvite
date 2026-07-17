import type { Supplier } from '../types'

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-midas',
    name: 'Midas',
    defaultPayment: 'Account',
    hasAccount: true,
    notes: 'Company account — primary auto parts',
    active: true,
  },
  {
    id: 'sup-china',
    name: 'China Shop',
    defaultPayment: 'Cash',
    hasAccount: false,
    notes: 'Brackets, bulbs, odds & ends — usually cash',
    active: true,
  },
  {
    id: 'sup-takealot',
    name: 'Takealot / Online',
    defaultPayment: 'EFT',
    hasAccount: false,
    notes: 'Special-order accessories',
    active: true,
  },
]
