import { useState } from 'react'
import { api } from '../api'
import { formatAnyToDDMMYYYY } from '../utils/date'

export default function OfferRow({ offer, onTaken }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const taken = !!offer.taken_by_name
  const parseDate = (val) => {
    if (!val) return null
    const s = String(val)
    // If already ISO-like with timezone or 'T', let Date parse it
    if (s.includes('T') || /[Zz]$/.test(s) || /[+-]\d\d:?\d\d$/.test(s)) {
      // Normalize timezone for Safari: +HH:MM -> +HHMM
      const iso = s.replace(/([+-])(\d\d):(\d\d)$/, '$1$2$3')
      const d = new Date(iso)
      return isNaN(d) ? null : d
    }
    // Likely MySQL 'YYYY-MM-DD HH:MM:SS' -> convert to UTC
    if (s.length >= 19 && s[10] === ' ') {
      const d = new Date(s.replace(' ', 'T') + 'Z')
      return isNaN(d) ? null : d
    }
    const d = new Date(s)
    return isNaN(d) ? null : d
  }
  const createdLabel = formatAnyToDDMMYYYY(offer.created_at)

  const handleTake = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const updated = await api.takeOffer(offer.id, name.trim())
      onTaken?.(updated)
      setName('')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr>
      <td data-label="Child">{offer.child_name}</td>
      <td data-label="Group">{offer.group}</td>
      <td data-label="Created">{createdLabel || '-'}</td>
      <td data-label="Status">
        {taken ? (
          <span className="taken">Taken by {offer.taken_by_name}</span>
        ) : (
          <form className="take-row" onSubmit={handleTake}>
            <input
              placeholder="Your child name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button className="take-btn" disabled={!name.trim() || loading} type="submit">
              {loading ? 'Taking…' : 'I want take this place'}
            </button>
          </form>
        )}
      </td>
    </tr>
  )
}
