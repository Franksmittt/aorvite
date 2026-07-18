import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../data/workers'
import { canAccessWorkshop, type Job, type Worker } from '../types'

type Props = {
  worker: Worker
  jobs: Job[]
  onLogout: () => void
  children: ReactNode
}

type NavItem = {
  to: string
  label: string
  match: (path: string) => boolean
  icon: ReactNode
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconWrench() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.7 6.3a4.5 4.5 0 0 0-6.1 6.1L4 17l3 3 4.6-4.6a4.5 4.5 0 0 0 6.1-6.1l-2.5 2.5-2.5-2.5 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 8.2 12 3.5l8.5 4.7v9.1L12 22l-8.5-4.7V8.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3.5 8.2 12 13l8.5-4.8M12 13v9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4.5h6v2.5H9z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 11h6M9 15h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AppLayout({ worker, jobs, onLogout, children }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const workshopAccess = canAccessWorkshop(worker)

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      {
        to: '/',
        label: 'Control',
        match: (path) => path === '/',
        icon: <IconGrid />,
      },
    ]
    if (workshopAccess) {
      items.push({
        to: '/workshop',
        label: 'Workshop',
        match: (path) =>
          path === '/workshop' || path.startsWith('/job/') || path === '/intake',
        icon: <IconWrench />,
      })
    }
    items.push({
      to: '/orders',
      label: 'Orders',
      match: (path) => path.startsWith('/orders'),
      icon: <IconBox />,
    })
    if (workshopAccess) {
      items.push({
        to: '/stocktake',
        label: 'Stocktake',
        match: (path) => path.startsWith('/stocktake'),
        icon: <IconClipboard />,
      })
    }
    return items
  }, [workshopAccess])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return []
    return jobs
      .filter((job) => {
        const hay = [
          job.registration,
          job.make,
          job.model,
          job.year,
          job.packageName,
          job.status,
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 8)
  }, [jobs, query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => searchRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setSearchOpen(false)
    setQuery('')
  }, [location.pathname])

  function openJob(jobId: string) {
    setSearchOpen(false)
    setQuery('')
    navigate(`/job/${jobId}`)
  }

  const showSearch = workshopAccess

  return (
    <div className="app-frame">
      <aside className="app-sidebar" aria-label="Main navigation">
        <Link to="/" className="app-sidebar-brand" title="Absolute Offroad">
          <span className="app-sidebar-mark">AO</span>
          <span className="app-sidebar-brand-text">Absolute Offroad</span>
        </Link>

        <nav className="app-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                `app-nav-link${item.match(location.pathname) ? ' active' : ''}`
              }
              title={item.label}
            >
              <span className="app-nav-icon">{item.icon}</span>
              <span className="app-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-foot">
          <button
            type="button"
            className="app-nav-link app-nav-button"
            onClick={onLogout}
            title="Sign out"
          >
            <span className="app-nav-icon">
              <IconLogout />
            </span>
            <span className="app-nav-label">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-column">
        <header className="app-topbar">
          <div className="app-topbar-brand">
            <p className="app-topbar-title">Absolute Offroad</p>
            <span className="app-role-badge">{ROLE_LABELS[worker.role]}</span>
          </div>

          {showSearch ? (
            <div className={`app-search${searchOpen || query ? ' open' : ''}`}>
              <IconSearch />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search jobs, plates…"
                aria-label="Search jobs"
              />
              <kbd>Ctrl K</kbd>
              {searchOpen && query.trim() ? (
                <div className="app-search-results" role="listbox">
                  {results.length === 0 ? (
                    <p className="app-search-empty">No jobs match</p>
                  ) : (
                    results.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        className="app-search-item"
                        onClick={() => openJob(job.id)}
                      >
                        <strong>{job.registration}</strong>
                        <span>
                          {job.year} {job.make} {job.model}
                        </span>
                        <em>{job.status}</em>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="app-search-spacer" />
          )}

          <div className="app-topbar-user">
            <div className="app-user-chip" title={worker.fullName}>
              <span className="app-user-avatar">{initials(worker.fullName)}</span>
              <span className="app-user-meta">
                <strong>{worker.fullName}</strong>
                <span>{ROLE_LABELS[worker.role]}</span>
              </span>
            </div>
            <button type="button" className="btn btn-ghost app-signout-inline" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>

      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() =>
              `app-bottom-link${item.match(location.pathname) ? ' active' : ''}`
            }
          >
            <span className="app-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
