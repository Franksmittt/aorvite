import { useMemo, useState } from 'react'
import {
  CATALOG_CATEGORIES,
  catalogByCategory,
  type CatalogCategory,
  type CatalogItem,
} from '../data/partsCatalog'

type Props = {
  /** Restrict which categories appear in the chip row */
  categories?: CatalogCategory[]
  /** Qty already in the draft, keyed by catalog id */
  selectedQty?: Record<string, number>
  onAdd: (catalogId: string) => void
  title?: string
  hint?: string
}

export function QuicklistPicker({
  categories = CATALOG_CATEGORIES,
  selectedQty = {},
  onAdd,
  title = 'Midas quicklist',
  hint = 'Tap to add — tap again to bump qty',
}: Props) {
  const [category, setCategory] = useState<'All' | CatalogCategory>('All')

  const items = useMemo(() => {
    if (category === 'All') return catalogByCategory(categories)
    return catalogByCategory([category])
  }, [category, categories])

  const chips: Array<'All' | CatalogCategory> = ['All', ...categories]

  return (
    <div className="quicklist-picker">
      <div className="quicklist-picker-head">
        <h2>{title}</h2>
        <p className="muted">{hint}</p>
      </div>

      <div className="chip-row chip-row-scroll category-chips">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`chip ${category === chip ? 'on' : ''}`}
            onClick={() => setCategory(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {category === 'All' ? (
        categories.map((cat) => {
          const group = items.filter((i) => i.category === cat)
          if (group.length === 0) return null
          return (
            <div key={cat} className="quicklist-group">
              <h3 className="subsection-title">{cat}</h3>
              <ItemGrid items={group} selectedQty={selectedQty} onAdd={onAdd} />
            </div>
          )
        })
      ) : (
        <ItemGrid items={items} selectedQty={selectedQty} onAdd={onAdd} />
      )}
    </div>
  )
}

function ItemGrid({
  items,
  selectedQty,
  onAdd,
}: {
  items: CatalogItem[]
  selectedQty: Record<string, number>
  onAdd: (catalogId: string) => void
}) {
  return (
    <div className="quicklist-grid">
      {items.map((item) => {
        const qty = selectedQty[item.id] ?? 0
        return (
          <button
            key={item.id}
            type="button"
            className={`quick-item ${qty > 0 ? 'selected' : ''}`}
            onClick={() => onAdd(item.id)}
          >
            <span className="quick-item-top">
              <strong>{item.name}</strong>
              {qty > 0 && <span className="quick-qty">{qty}</span>}
            </span>
            <span>
              {item.category} · {item.unit}
            </span>
          </button>
        )
      })}
    </div>
  )
}
