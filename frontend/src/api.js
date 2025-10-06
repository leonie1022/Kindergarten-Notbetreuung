export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
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
  getDates: () => request('/dates'),
  getOffers: (dateId) => request(`/offers?date_id=${encodeURIComponent(dateId)}`),
  createOffer: (payload) => request('/offers', { method: 'POST', body: JSON.stringify(payload) }),
  takeOffer: (offerId, takerName) => request(`/offers/${offerId}/take`, { method: 'POST', body: JSON.stringify({ taker_name: takerName }) }),
}

