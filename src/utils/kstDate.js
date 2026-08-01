const KST_TIME_ZONE = 'Asia/Seoul'

export function toKstDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${fields.year}-${fields.month}-${fields.day}`
}

export function isKstDateAfter(dateKey, value = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || '')) return false
  const current = toKstDateKey(value)
  return current ? dateKey < current : false
}
