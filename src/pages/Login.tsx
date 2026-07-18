import { useState } from 'react'
import { COMPANY, ROLE_LABELS, WORKERS } from '../data/workers'
import { saveSession } from '../lib/store'
import type { Worker } from '../types'

type Props = {
  onLoggedIn: (worker: Worker) => void
}

function roleTone(role: Worker['role']) {
  if (role === 'Owner') return 'tone-owner'
  if (role === 'Orders') return 'tone-orders'
  return 'tone-staff'
}

export function Login({ onLoggedIn }: Props) {
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
      <div className="login-screen">
        <header className="login-hero">
          <div className="login-mark" aria-hidden>
            AO
          </div>
          <p className="login-brand">{COMPANY.name}</p>
          <h1>Operator access</h1>
          <p className="login-lead">Identify yourself to proceed.</p>
        </header>

        <ul className="login-roster" aria-label="Operators">
          {WORKERS.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className={`login-card ${roleTone(w.role)}`}
                onClick={() => selectWorker(w)}
              >
                <span className="login-avatar" aria-hidden>
                  <span>{w.fullName.slice(0, 1)}</span>
                </span>
                <span className="login-card-text">
                  <strong>{w.fullName}</strong>
                  <span>{ROLE_LABELS[w.role]}</span>
                </span>
                <span className="login-card-meta" aria-hidden>
                  {w.role === 'Orders' ? 'Parts desk' : 'Bay access'}
                </span>
                <span className="login-enter" aria-hidden>
                  ≫
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="login-screen login-pin">
      <header className="login-hero login-hero-pin">
        <button type="button" className="link-back" onClick={() => setSelected(null)}>
          ‹ Operators
        </button>
        <div className={`login-avatar lg ${roleTone(selected.role)}`} aria-hidden>
          <span>{selected.fullName.slice(0, 1)}</span>
        </div>
        <h1>{selected.fullName}</h1>
        <p className="login-lead">{ROLE_LABELS[selected.role]} · Enter PIN</p>
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
