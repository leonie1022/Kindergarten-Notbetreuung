import { useState } from 'react'
import { api } from '../api'

export default function GiveAwayForm({ dateId, onCreated }) {
  const [childName, setChildName] = useState('')
  const [group, setGroup] = useState('A')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const created = await api.createOffer({ date_id: dateId, child_name: childName.trim(), group })
      onCreated?.(created)
      setChildName('')
      setGroup('A')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-row">
      <label>
        Child name
        <input value={childName} onChange={e => setChildName(e.target.value)} required placeholder="e.g. Mia" />
      </label>
      <label>
        Group
        <select value={group} onChange={e => setGroup(e.target.value)}>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </label>
      <button disabled={submitting || !childName.trim()} type="submit">{submitting ? 'Submitting…' : 'Give away'}</button>
      {error && <span className="error">{error}</span>}
    </form>
  )
}

