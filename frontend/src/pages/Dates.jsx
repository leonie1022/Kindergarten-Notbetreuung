import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatYMDToDDMMYYYY } from '../utils/date'

export default function Dates() {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.getDates()
      .then((data) => { if (mounted) setDates(data) })
      .catch((e) => { if (mounted) setError(e.message) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return <p>Loading dates…</p>
  if (error) return <p className="error">{error}</p>
  if (!dates.length) return <p>No dates. Please insert dates in DB.</p>

  return (
    <div>
      <h2>Choose a date</h2>
      <div className="grid">
        {dates.map(d => {
          const label = d.label || formatYMDToDDMMYYYY(d.date)
          return (
            <Link key={d.id} to={`/date/${d.id}`} className="date-btn">
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
