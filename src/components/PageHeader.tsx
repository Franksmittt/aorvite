import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  kicker?: string
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  actions,
}: Props) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {backTo ? (
          <Link to={backTo} className="link-back">
            ‹ {backLabel}
          </Link>
        ) : null}
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  )
}
