import { Link } from 'react-router-dom'

type Props = {
  title: string
  subtitle?: string
}

export function AppNav({ title, subtitle }: Props) {
  return (
    <header className="screen-header row">
      <div>
        <Link to="/" className="link-back">
          ‹ Control
        </Link>
        <p className="brand">Absolute Offroad</p>
        <h1>{title}</h1>
        {subtitle ? <p className="sub">{subtitle}</p> : null}
      </div>
    </header>
  )
}
