const CONSTRUCTION_KIND = 'limited-construction'

export function resolveEventAcquisition(event, shipName, today = new Date()) {
  const routes = normalizeEventRoutes(event, shipName)
  const eventStarted = !isBefore(today, event?.startsAt)
  const mainActive = eventStarted && !isAfter(today, event?.endsAt)
  const activeRoutes = eventStarted ? routes.filter(route => !isAfter(today, route.endsAt)) : []
  const phase = mainActive ? 'main' : activeRoutes.length ? 'claim-only' : 'ended'
  const activeEnd = latestEnd(activeRoutes.map(route => route.endsAt))

  return {
    phase,
    routes,
    activeRoutes,
    buildLimited: activeRoutes.some(route => route.kind === CONSTRUCTION_KIND),
    availability: phase === 'ended' ? null : {
      key: 'active-event',
      label: phase === 'main' ? '현재 이벤트' : '이벤트 수령 기간',
      eventName: event.name,
      endsAt: phase === 'main' ? event.endsAt : activeEnd,
      endsAtLabel: phase === 'main'
        ? (event.endsAtLabel || `${event.endsAt}까지`)
        : `${activeEnd}까지`,
      phase,
      startsAt: event.startsAt,
      mainEndsAt: event.endsAt,
      mainEndsAtLabel: event.endsAtLabel || `${event.endsAt}까지`,
      claimEndsAt: event.claimEndsAt || null,
      eventRoutes: routes,
      activeEventRoutes: activeRoutes,
    },
  }
}

export function resolveStoredEventAvailability(availability, today = new Date()) {
  if (availability?.key !== 'active-event' || !Array.isArray(availability.eventRoutes)) return availability
  const event = {
    name: availability.eventName,
    startsAt: availability.startsAt,
    endsAt: availability.mainEndsAt || availability.endsAt,
    endsAtLabel: availability.mainEndsAtLabel,
    claimEndsAt: availability.claimEndsAt,
    acquisition: { __stored__: availability.eventRoutes },
  }
  return resolveEventAcquisition(event, '__stored__', today).availability
}

export function normalizeEventRoutes(event, shipName) {
  const declared = event?.acquisition?.[shipName]
  if (Array.isArray(declared) && declared.length) {
    return declared.map(route => typeof route === 'string'
      ? { kind: 'event', label: route, endsAt: event.endsAt }
      : { ...route, endsAt: route.endsAt || event.endsAt })
  }
  if (event?.ships?.includes(shipName)) {
    const construction = event.construction?.[shipName]
    return [{
      kind: construction ? CONSTRUCTION_KIND : 'event',
      label: construction
        ? `한정 건조 ${construction.rate} (${construction.timer})`
        : `이벤트: ${event.name}`,
      endsAt: event.endsAt,
    }]
  }
  return []
}

function isBefore(value, boundary) {
  if (!boundary) return false
  return compareKst(value, boundary, 'start') < 0
}

function isAfter(value, boundary) {
  if (!boundary) return true
  return compareKst(value, boundary, 'end') > 0
}

function compareKst(value, boundary, edge) {
  const current = toKstComparable(value)
  const deadline = normalizeBoundary(boundary, current.length === 10, edge)
  return current.localeCompare(deadline)
}

function toKstComparable(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?$/.test(value)) return value
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${fields.year}-${fields.month}-${fields.day} ${fields.hour}:${fields.minute}`
}

function normalizeBoundary(value, dateOnly, edge) {
  const text = String(value || '')
  if (dateOnly) return text.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  return `${text} ${edge === 'start' ? '00:00' : '23:59'}`
}

function latestEnd(values) {
  return [...values].filter(Boolean).sort().at(-1) || null
}
