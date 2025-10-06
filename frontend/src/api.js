export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

async function request(path, opts = {}) {
  // Avoid setting Content-Type by default to reduce preflights.
  const target = `${API_BASE}${path}`
  const res = await fetch(target, opts)
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed: ${res.status}`
    throw new Error(msg)
  }
  return data
}

export const api = {
  getDates: async () => {
    const d = await request('/dates')
    if (!Array.isArray(d)) throw new Error('Invalid response for /dates')
    return d
  },
  getOffers: async (dateId) => {
    const d = await request(`/offers?date_id=${encodeURIComponent(dateId)}`)
    if (!Array.isArray(d)) throw new Error('Invalid response for /offers')
    return d
  },
  // Use x-www-form-urlencoded to avoid preflight; works with cors proxies too.
  createOffer: ({ date_id, child_name, group }) => request('/offers', {
    method: 'POST',
    body: new URLSearchParams({
      date_id: String(date_id),
      child_name: String(child_name),
      group: String(group),
    }),
  }),
  takeOffer: (offerId, takerName) => request(`/offers/${offerId}/take`, {
    method: 'POST',
    body: new URLSearchParams({ taker_name: String(takerName) }),
  }),
}
