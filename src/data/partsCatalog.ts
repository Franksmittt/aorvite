export type CatalogItem = {
  id: string
  name: string
  category: string
  unit: string
  popular?: boolean
}

/** Quicklist — common workshop consumables & hardware for Midas runs */
export const PARTS_QUICKLIST: CatalogItem[] = [
  { id: 'c-masking', name: 'Masking tape (48mm)', category: 'Consumables', unit: 'roll', popular: true },
  { id: 'c-sikaflex', name: 'Sikaflex / polyurethane sealant', category: 'Consumables', unit: 'tube', popular: true },
  { id: 'c-silicone', name: 'Silicone sealant (black)', category: 'Consumables', unit: 'tube', popular: true },
  { id: 'c-glue', name: 'Panel bond / adhesive', category: 'Consumables', unit: 'tube', popular: true },
  { id: 'c-cable-ties', name: 'Cable ties assorted', category: 'Electrical', unit: 'pack', popular: true },
  { id: 'c-heatshrink', name: 'Heat shrink tubing assorted', category: 'Electrical', unit: 'pack', popular: true },
  { id: 'c-connectors', name: 'Bullet / spade connectors', category: 'Electrical', unit: 'pack', popular: true },
  { id: 'c-loom-tape', name: 'Wiring loom tape', category: 'Electrical', unit: 'roll', popular: true },
  { id: 'c-m6', name: 'M6 bolts + nylocks + washers', category: 'Hardware', unit: 'set', popular: true },
  { id: 'c-m8', name: 'M8 bolts + nylocks + washers', category: 'Hardware', unit: 'set', popular: true },
  { id: 'c-m10', name: 'M10 bolts + nylocks + washers', category: 'Hardware', unit: 'set', popular: true },
  { id: 'c-m12', name: 'M12 bolts + nylocks + washers', category: 'Hardware', unit: 'set', popular: true },
  { id: 'c-clips-plastic', name: 'Plastic trim clips assorted', category: 'Hardware', unit: 'pack', popular: true },
  { id: 'c-rivets', name: 'Blind rivets assorted', category: 'Hardware', unit: 'pack' },
  { id: 'c-brackets', name: 'Angle brackets / mounting brackets', category: 'Hardware', unit: 'ea' },
  { id: 'c-rust', name: 'Rust-proofing paint / zinc spray', category: 'Consumables', unit: 'can', popular: true },
  { id: 'c-degreaser', name: 'Brake cleaner / degreaser', category: 'Consumables', unit: 'can', popular: true },
  { id: 'c-gloves', name: 'Nitrile gloves', category: 'Consumables', unit: 'box' },
  { id: 'c-discs', name: 'Cutting / grinding discs 115mm', category: 'Consumables', unit: 'pack', popular: true },
  { id: 'c-sand', name: 'Sanding discs / paper', category: 'Consumables', unit: 'pack' },
  { id: 'c-fuse', name: 'Blade fuses assorted', category: 'Electrical', unit: 'pack' },
  { id: 'c-relay', name: 'Automotive relay 12V', category: 'Electrical', unit: 'ea' },
  { id: 'c-wire', name: 'Automotive wire (red/black)', category: 'Electrical', unit: 'm', popular: true },
  { id: 'c-grommet', name: 'Rubber grommets assorted', category: 'Hardware', unit: 'pack' },
  // Workshop / cleaning supplies (manual orders — not for a client vehicle)
  { id: 'w-floor-cleaner', name: 'Workshop floor cleaner', category: 'Cleaning', unit: 'bottle', popular: true },
  { id: 'w-hand-cleaner', name: 'Hand cleaner / Swarfega', category: 'Cleaning', unit: 'tub', popular: true },
  { id: 'w-rags', name: 'Cleaning rags / paper towel', category: 'Cleaning', unit: 'pack', popular: true },
  { id: 'w-spray-cleaner', name: 'All-purpose spray cleaner', category: 'Cleaning', unit: 'bottle', popular: true },
  { id: 'w-brush', name: 'Scrubbing brush', category: 'Cleaning', unit: 'ea' },
  { id: 'w-bucket', name: 'Workshop bucket', category: 'Cleaning', unit: 'ea' },
  { id: 'w-binbags', name: 'Refuse bags', category: 'Cleaning', unit: 'pack' },
  { id: 'w-soap', name: 'Hand soap refill', category: 'Cleaning', unit: 'bottle' },
]
