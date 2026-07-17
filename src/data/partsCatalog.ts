export type CatalogCategory =
  | 'Tape'
  | 'Electrical'
  | 'Chemicals'
  | 'Abrasives'
  | 'Hardware'
  | 'Cleaning'

export type CatalogItem = {
  id: string
  name: string
  category: CatalogCategory
  unit: string
  /** Show on the default “Midas run” list */
  popular?: boolean
  sortOrder?: number
}

/**
 * Midas quicklist — organised the way the workshop actually buys.
 * Categories = filter chips on the Orders screen.
 */
export const PARTS_QUICKLIST: CatalogItem[] = [
  // Tape
  { id: 'm-masking', name: 'Masking tape', category: 'Tape', unit: 'roll', popular: true, sortOrder: 10 },
  { id: 'm-insulation', name: 'Insulation tape', category: 'Tape', unit: 'roll', popular: true, sortOrder: 20 },
  { id: 'm-double-sided', name: 'Double sided tape', category: 'Tape', unit: 'roll', popular: true, sortOrder: 30 },

  // Electrical
  { id: 'm-lugs', name: 'Lugs', category: 'Electrical', unit: 'pack', popular: true, sortOrder: 40 },
  { id: 'm-heatshrink', name: 'Heatshrink', category: 'Electrical', unit: 'pack', popular: true, sortOrder: 50 },
  { id: 'm-cable-ties', name: 'Cable ties', category: 'Electrical', unit: 'pack', popular: true, sortOrder: 60 },
  { id: 'm-cable', name: 'Cable', category: 'Electrical', unit: 'm', popular: true, sortOrder: 70 },
  { id: 'm-wire', name: 'Wire', category: 'Electrical', unit: 'm', popular: true, sortOrder: 80 },

  // Chemicals / adhesives / sprays
  { id: 'm-qbond', name: 'Qbond', category: 'Chemicals', unit: 'tube', popular: true, sortOrder: 90 },
  { id: 'm-sikaflex', name: 'Sika Flex', category: 'Chemicals', unit: 'tube', popular: true, sortOrder: 100 },
  { id: 'm-grease', name: 'Grease', category: 'Chemicals', unit: 'tub', popular: true, sortOrder: 110 },
  { id: 'm-anti-spat', name: 'Anti Spat', category: 'Chemicals', unit: 'can', popular: true, sortOrder: 120 },
  { id: 'm-q20', name: 'Q20', category: 'Chemicals', unit: 'can', popular: true, sortOrder: 130 },
  { id: 'm-spray-paint', name: 'Spray paint', category: 'Chemicals', unit: 'can', popular: true, sortOrder: 140 },

  // Abrasives
  { id: 'm-sanding', name: 'Sanding paper', category: 'Abrasives', unit: 'pack', popular: true, sortOrder: 150 },
  { id: 'm-flapper', name: 'Flapper disks', category: 'Abrasives', unit: 'pack', popular: true, sortOrder: 160 },
  { id: 'm-cutting', name: 'Cutting disks', category: 'Abrasives', unit: 'pack', popular: true, sortOrder: 170 },

  // Hardware
  { id: 'm-pop-rivets', name: 'Pop rivets', category: 'Hardware', unit: 'pack', popular: true, sortOrder: 180 },

  // Workshop cleaning (manual / shop orders)
  { id: 'w-floor-cleaner', name: 'Workshop floor cleaner', category: 'Cleaning', unit: 'bottle', sortOrder: 200 },
  { id: 'w-hand-cleaner', name: 'Hand cleaner / Swarfega', category: 'Cleaning', unit: 'tub', sortOrder: 210 },
  { id: 'w-rags', name: 'Cleaning rags / paper towel', category: 'Cleaning', unit: 'pack', sortOrder: 220 },
  { id: 'w-spray-cleaner', name: 'All-purpose spray cleaner', category: 'Cleaning', unit: 'bottle', sortOrder: 230 },
  { id: 'w-brush', name: 'Scrubbing brush', category: 'Cleaning', unit: 'ea', sortOrder: 240 },
  { id: 'w-binbags', name: 'Refuse bags', category: 'Cleaning', unit: 'pack', sortOrder: 250 },
]

/** Category order for filter chips */
export const CATALOG_CATEGORIES: CatalogCategory[] = [
  'Tape',
  'Electrical',
  'Chemicals',
  'Abrasives',
  'Hardware',
  'Cleaning',
]

export const MIDAS_RUN_CATEGORIES: CatalogCategory[] = [
  'Tape',
  'Electrical',
  'Chemicals',
  'Abrasives',
  'Hardware',
]

export function catalogByCategory(
  categories?: CatalogCategory[],
  opts?: { popularOnly?: boolean },
): CatalogItem[] {
  return PARTS_QUICKLIST.filter((item) => {
    if (categories && !categories.includes(item.category)) return false
    if (opts?.popularOnly && !item.popular) return false
    return true
  }).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
}
