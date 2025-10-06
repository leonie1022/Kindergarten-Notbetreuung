export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
// Optional CORS proxy, e.g. VITE_CORS_PROXY="https://corsproxy.io/?"
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || ''

async function request(path, opts = {}) {
  // Avoid setting Content-Type by default to reduce preflights.
  const target = `${API_BASE}${path}`
  const url = CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(target)}` : target
  const res = await fetch(url, opts)
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
