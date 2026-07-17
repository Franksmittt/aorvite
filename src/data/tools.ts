import type { Tool } from '../types'

export const TOOLS: Tool[] = [
  { id: 't-impact', name: '1/2" Impact gun', category: 'Power tools', location: 'Bay 1 toolbox', expectedQty: 2, estimatedValueZar: 3500 },
  { id: 't-ratchet-set', name: 'Metric ratchet set', category: 'Hand tools', location: 'Bay 1 toolbox', expectedQty: 3, estimatedValueZar: 1200 },
  { id: 't-torx', name: 'Torx bit set', category: 'Hand tools', location: 'Shared tool wall', expectedQty: 2, estimatedValueZar: 450 },
  { id: 't-torque', name: 'Torque wrench 40–200Nm', category: 'Hand tools', location: 'Bay 2 cabinet', expectedQty: 2, estimatedValueZar: 1800 },
  { id: 't-angle', name: 'Angle grinder 115mm', category: 'Power tools', location: 'Bay 2', expectedQty: 2, estimatedValueZar: 900 },
  { id: 't-drill', name: 'Cordless drill / driver', category: 'Power tools', location: 'Charging station', expectedQty: 3, estimatedValueZar: 2200 },
  { id: 't-multimeter', name: 'Multimeter', category: 'Electrical', location: 'Wiring bench', expectedQty: 2, estimatedValueZar: 800 },
  { id: 't-crimp', name: 'Wire crimping tool', category: 'Electrical', location: 'Wiring bench', expectedQty: 2, estimatedValueZar: 650 },
  { id: 't-heatgun', name: 'Heat gun', category: 'Electrical', location: 'Wiring bench', expectedQty: 1, estimatedValueZar: 700 },
  { id: 't-jack', name: 'Trolley jack 3T', category: 'Lifting', location: 'Floor', expectedQty: 2, estimatedValueZar: 2500 },
  { id: 't-stands', name: 'Axle stands (pair)', category: 'Lifting', location: 'Floor', expectedQty: 4, estimatedValueZar: 900 },
  { id: 't-cutter', name: 'Air body saw / cutter', category: 'Body', location: 'Bay 1', expectedQty: 1, estimatedValueZar: 1600 },
  { id: 't-trim', name: 'Trim clip removal set', category: 'Body', location: 'Shared tool wall', expectedQty: 2, estimatedValueZar: 280 },
  { id: 't-socket-deep', name: 'Deep socket set metric', category: 'Hand tools', location: 'Bay 3 toolbox', expectedQty: 2, estimatedValueZar: 1100 },
  { id: 't-flashlight', name: 'Workshop LED torch', category: 'General', location: 'Charging station', expectedQty: 4, estimatedValueZar: 350 },
  { id: 't-tape-measure', name: 'Tape measure 5m', category: 'General', location: 'Shared tool wall', expectedQty: 3, estimatedValueZar: 120 },
]
