import { useState } from 'react'
import { WORKERS } from '../data/workers'
import { saveSession } from '../lib/store'
import type { Worker } from '../types'

type Props = {
  onLoggedIn: (worker: Worker) => void
}

/** Login-only titles — does not change roles elsewhere in the app. */
const OPERATOR_TITLES: Record<string, string> = {
  jaco: 'Founder / Owner',
  marius: 'Head Mechanic / Tuning',
  jovan: 'Fabricator / Suspension',
  themba: 'Drivetrain Specialist',
  thando: 'Diagnostics / Electrical',
  yogs: 'Parts Procurement / Orders',
}

function ChevronRight() {
  return (
    <svg
      className="login-chevron"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Login({ onLoggedIn }: Props) {
  const [selected, setSelected] = useState<Worker | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pressedId, setPressedId] = useState<string | null>(null)

  function selectWorker(worker: Worker) {
    setSelected(worker)
    setPin('')
    setError(null)
    setPressedId(null)
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
        <div className="login-bg" aria-hidden />
        <div className="login-shade" aria-hidden />

        <div className="login-content">
          <header className="login-hero">
            <p className="login-logo" aria-label="Absolute Offroad">
              <span className="login-logo-a">A</span>
              <span className="login-logo-o">O</span>
            </p>
            <p className="login-brand">Absolute Offroad</p>
            <h1>Operator Access</h1>
            <p className="login-lead">Select your profile to begin shift.</p>
          </header>

          <ul className="login-roster" aria-label="Operators">
            {WORKERS.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={`login-row${pressedId === w.id ? ' is-active' : ''}`}
                  onClick={() => selectWorker(w)}
                  onPointerDown={() => setPressedId(w.id)}
                  onPointerUp={() => setPressedId(null)}
                  onPointerLeave={() => setPressedId(null)}
                  onPointerCancel={() => setPressedId(null)}
                >
                  <span className="login-row-left">
                    <span className="login-avatar" aria-hidden>
                      {w.fullName.slice(0, 1)}
                    </span>
                    <span className="login-row-text">
                      <strong>{w.fullName}</strong>
                      <span>{OPERATOR_TITLES[w.id] ?? w.role}</span>
                    </span>
                  </span>
                  <ChevronRight />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="login-screen login-pin">
      <div className="login-bg" aria-hidden />
      <div className="login-shade" aria-hidden />

      <div className="login-content">
        <header className="login-hero login-hero-pin">
          <button type="button" className="login-back" onClick={() => setSelected(null)}>
            ‹ Operators
          </button>
          <span className="login-avatar lg" aria-hidden>
            {selected.fullName.slice(0, 1)}
          </span>
          <h1>{selected.fullName}</h1>
          <p className="login-lead">
            {OPERATOR_TITLES[selected.id] ?? selected.role} · Enter PIN
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
              <button
                key={key}
                type="button"
                className="btn btn-pad"
                onClick={() => pressDigit(key)}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
