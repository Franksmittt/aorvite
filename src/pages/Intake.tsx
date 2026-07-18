import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { PACKAGE_TEMPLATES } from '../data/templates'
import { WORKERS } from '../data/workers'
import { createJob } from '../lib/store'

const MAKES = ['Toyota', 'Ford', 'Isuzu', 'Volkswagen', 'Other']
const MODELS: Record<string, string[]> = {
  Toyota: ['Hilux 2.8 GD-6', 'Hilux 2.4 GD-6', 'Land Cruiser 79', 'Land Cruiser 76', 'Fortuner', 'Other'],
  Ford: ['Ranger', 'Everest', 'Other'],
  Isuzu: ['D-Max', 'MU-X', 'Other'],
  Volkswagen: ['Amarok', 'Other'],
  Other: ['Other'],
}

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 30 }, (_, i) => String(currentYear - i))
const STAFF = WORKERS.filter((w) => w.role === 'Staff')

export function Intake() {
  const navigate = useNavigate()
  const [registration, setRegistration] = useState('')
  const [make, setMake] = useState(MAKES[0])
  const [model, setModel] = useState(MODELS[MAKES[0]][0])
  const [year, setYear] = useState(YEARS[0])
  const [packageId, setPackageId] = useState(PACKAGE_TEMPLATES[0].id)
  const [assigned, setAssigned] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleMakeChange(nextMake: string) {
    setMake(nextMake)
    setModel(MODELS[nextMake][0])
  }

  function toggleWorker(id: string) {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!registration.trim()) {
      setError('Enter a number plate')
      return
    }
    if (!year.trim()) {
      setError('Select a year model')
      return
    }

    const job = createJob({
      registration,
      make,
      model,
      year,
      packageId,
      assignedWorkerIds: assigned,
    })
    navigate(`/job/${job.id}`)
  }

  return (
    <div className="screen screen-stack">
      <PageHeader
        title="Book in"
        subtitle="Plate, year, package, and who is on it"
        backTo="/workshop"
        backLabel="Workshop"
      />

      <form className="form group-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Number plate</span>
          <input
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            placeholder="AB 12 CD GP"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>Year model</span>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Make</span>
          <select value={make} onChange={(e) => handleMakeChange(e.target.value)}>
            {MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS[make].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Job package</span>
          <select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            {PACKAGE_TEMPLATES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.packageName}
              </option>
            ))}
          </select>
        </label>

        <div className="field assign-field">
          <span>Assign staff</span>
          <div className="chip-row">
            {STAFF.map((w) => {
              const on = assigned.includes(w.id)
              return (
                <button
                  key={w.id}
                  type="button"
                  className={`chip ${on ? 'on' : ''}`}
                  onClick={() => toggleWorker(w.id)}
                >
                  {w.fullName}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block">
          Create job
        </button>
      </form>
    </div>
  )
}
