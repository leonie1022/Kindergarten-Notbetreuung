export function formatYMDToDDMMYYYY(ymd) {
  if (!ymd) return ''
  // Expecting 'YYYY-MM-DD'; avoid timezone shifts by string split
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return String(ymd)
  const [, y, mo, d] = m
  return `${d}.${mo}.${y}`
}

// Accepts Date object, ISO string, or MySQL 'YYYY-MM-DD HH:MM:SS'
export function formatAnyToDDMMYYYY(input) {
  if (!input) return ''
  if (input instanceof Date) {
    if (isNaN(input)) return ''
    const ymd = input.toISOString().slice(0, 10)
    return formatYMDToDDMMYYYY(ymd)
  }
  const s = String(input)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/) // grab leading YYYY-MM-DD
  if (m) return formatYMDToDDMMYYYY(m[1])
  // Fallback: try to parse as Date; normalize timezone like +HH:MM -> +HHMM
  const norm = s.replace(/([+-])(\d\d):(\d\d)$/, '$1$2$3')
  const d = new Date(norm)
  if (isNaN(d)) return ''
  const ymd = d.toISOString().slice(0, 10)
  return formatYMDToDDMMYYYY(ymd)
}
