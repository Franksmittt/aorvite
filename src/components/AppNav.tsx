import type { ReactNode } from 'react'
import { PageHeader } from './PageHeader'

type Props = {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

/** Page title block for nested screens (shell handles primary nav). */
export function AppNav({
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
}: Props) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backTo={backTo}
      backLabel={backLabel}
      actions={actions}
    />
  )
}
