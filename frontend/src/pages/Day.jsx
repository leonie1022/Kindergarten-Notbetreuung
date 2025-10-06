import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import GiveAwayForm from '../components/GiveAwayForm'
import { formatYMDToDDMMYYYY } from '../utils/date'
import OfferRow from '../components/OfferRow'

export default function Day() {
  const { dateId } = useParams()
  const [offers, setOffers] = useState([])
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const current = useMemo(() => dates.find(d => String(d.id) === String(dateId)), [dates, dateId])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [datesData, offersData] = await Promise.all([
        api.getDates(),
        api.getOffers(dateId),
      ])
      setDates(datesData)
      setOffers(offersData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [dateId])

  const onCreated = (o) => setOffers(prev => [...prev, o])
  const onTaken = (updated) => setOffers(prev => prev.map(o => o.id === updated.id ? updated : o))

  if (loading) return <p>Loading…</p>
  if (error) return <p className="error">{error}</p>

  const title = current ? (current.label || formatYMDToDDMMYYYY(current.date)) : `Date #${dateId}`

  return (
    <div>
      <div className="title-row">
        <h2>{title}</h2>
        <Link to="/">Back to dates</Link>
      </div>
      <section className="card">
        <h3>Give away a place</h3>
        <GiveAwayForm dateId={Number(dateId)} onCreated={onCreated} />
      </section>

      <section className="card">
        <h3>Offers</h3>
        {offers.length === 0 ? (
          <p>No offers yet.</p>
        ) : (
          <table className="offers">
            <thead>
              <tr>
                <th>Child</th>
                <th>Group</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <OfferRow key={o.id} offer={o} onTaken={onTaken} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
