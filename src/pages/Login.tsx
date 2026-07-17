import { useState } from 'react'
import { ROLE_LABELS, WORKERS } from '../data/workers'
import { saveSession } from '../lib/store'
import type { Worker } from '../types'

type Props = {
  onLoggedIn: (worker: Worker) => void
  buildId?: string
}

export function Login({ onLoggedIn, buildId }: Props) {
  const [selected, setSelected] = useState<Worker | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  function selectWorker(worker: Worker) {
    setSelected(worker)
    setPin('')
    setError(null)
  }

  function pressDigit(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(null)
    if (next.length === 4 && selected) {
      if (next === selected.pin) {
        saveSession({ workerId: selected.id })
        onLoggedIn(selected)
      } else {
        setError('Wrong PIN')
        setPin('')
      }
    }
  }

  function backspace() {
    setPin((p) => p.slice(0, -1))
    setError(null)
  }

  if (!selected) {
    return (
      <div className="screen screen-stack">
        <header className="screen-header">
          <p className="brand brand-hero">Absolute Offroad</p>
          <h1 className="title-secondary">Sign in</h1>
          <p className="sub">Choose your name to continue</p>
          <p className="build-stamp">
            Clean build {buildId ?? '—'} · open{' '}
            <strong>aorvite.vercel.app</strong> · Marius is Staff
          </p>
        </header>
        <ul className="worker-list group">
          {WORKERS.map((w) => (
            <li key={w.id}>
              <button type="button" className="list-row" onClick={() => selectWorker(w)}>
                <span className="avatar">{w.fullName.slice(0, 1)}</span>
                <span className="list-row-text">
                  <span className="list-title">{w.fullName}</span>
                  <span className="list-subtitle">{ROLE_LABELS[w.role]}</span>
                </span>
                <span className="chevron" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="screen screen-stack">
      <header className="screen-header">
        <button type="button" className="link-back" onClick={() => setSelected(null)}>
          ‹ Back
        </button>
        <div className="avatar lg">{selected.fullName.slice(0, 1)}</div>
        <h1>{selected.fullName}</h1>
        <p className="sub">
          {ROLE_LABELS[selected.role]} · Enter PIN
        </p>
      </header>

      <div className="pin-dots" aria-label="PIN progress">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
        ))}
      </div>

      {error && <p className="error-text center">{error}</p>}

      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => {
          if (key === '') return <span key="spacer" />
          if (key === '⌫') {
            return (
              <button key="back" type="button" className="btn btn-pad" onClick={backspace}>
                ⌫
              </button>
            )
          }
          return (
            <button key={key} type="button" className="btn btn-pad" onClick={() => pressDigit(key)}>
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
