export function money(n) {
  const v = Number(n || 0)
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function longDate(d) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function shortDate(d) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function daysUntil(d) {
  if (!d) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(d + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}
