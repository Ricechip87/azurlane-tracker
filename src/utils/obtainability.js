export const OBTAINABILITY_RANK = {
  permanent: 0,
  'active-event': 1,
  'rerun-wait': 8,
  'collab-unknown': 9,
  unknown: 10,
}

export const DIFFICULTY_RANK = { easy: 0, event: 1, normal: 2, hard: 3, limited: 8, unknown: 9, excluded: 10 }

export function getAvailability(obtainability) {
  if (obtainability?.availability) return obtainability.availability
  const key = obtainability?.difficulty?.key
  if (['easy', 'normal', 'hard'].includes(key)) return { key: 'permanent', label: '상시 획득' }
  if (key === 'event') return { key: 'active-event', label: '현재 이벤트' }
  if (key === 'limited') return { key: 'rerun-wait', label: '복각 대기' }
  if (key === 'excluded') return { key: 'collab-unknown', label: '콜라보 복각 미정' }
  return { key: 'unknown', label: '미확인' }
}

export function isCurrentlyObtainable(obtainability) {
  return ['permanent', 'active-event'].includes(getAvailability(obtainability).key)
}

export function isGrowthRecommendationEligible({ acquired, level125, obtainability }) {
  if (acquired) return !level125
  const availability = getAvailability(obtainability)
  if (availability.key === 'active-event') return true
  if (availability.key !== 'permanent') return false
  const primaryRoute = getPrimaryAcquisitionRoute(obtainability)
  if (primaryRoute) return primaryRoute.rank <= 1
  return obtainability?.difficulty?.key === 'easy'
}

export function isResearchCandidateActionable({ acquired, obtainability }) {
  return acquired || isCurrentlyObtainable(obtainability)
}

export function obtainabilityRank(obtainability) {
  const availability = getAvailability(obtainability)
  if (availability.key === 'permanent') {
    return getPrimaryAcquisitionRoute(obtainability)?.rank
      ?? DIFFICULTY_RANK[obtainability?.difficulty?.key]
      ?? DIFFICULTY_RANK.unknown
  }
  if (availability.key === 'active-event') return 1
  return (OBTAINABILITY_RANK[availability.key] ?? OBTAINABILITY_RANK.unknown) * 100
}

export function obtainabilityLabel(obtainability) {
  const availability = getAvailability(obtainability)
  const primaryRoute = getPrimaryAcquisitionRoute(obtainability)
  if (availability.key === 'permanent' && primaryRoute) return `${availability.label} · ${primaryRoute.label}`
  return availability.label
}

export function getPrimaryAcquisitionRoute(obtainability) {
  if (obtainability?.primaryRoute) return obtainability.primaryRoute
  if (obtainability?.acquisitionRoutes?.length) {
    return [...obtainability.acquisitionRoutes].sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9))[0]
  }
  return null
}

export function getObtainabilitySourceSections(obtainability) {
  const current = [...new Set(obtainability?.obtain || [])]
  const availability = getAvailability(obtainability)
  if (availability.key !== 'permanent') return current.length ? [{ label: '입수처', sources: current }] : []

  const routeSections = (obtainability?.acquisitionRoutes || []).map(route => ({
    label: `${route.label} · ${certaintyLabel(route.certainty)}`,
    sources: route.sources || [],
  })).filter(section => section.sources.length)
  const historical = [...new Set((obtainability?.historicalObtain || [])
    .filter(source => /이벤트|기간 한정|한정 건조/.test(source))
    .filter(source => !current.includes(source)))]
  if (routeSections.length) {
    return [
      ...routeSections,
      historical.length ? { label: '과거 이벤트 입수처', sources: historical } : null,
    ].filter(Boolean)
  }
  return [
    current.length ? { label: '현재 입수처', sources: current } : null,
    historical.length ? { label: '과거 이벤트 입수처', sources: historical } : null,
  ].filter(Boolean)
}

function certaintyLabel(certainty) {
  if (certainty === 'guaranteed') return '확정'
  if (certainty === 'random') return '확률'
  if (certainty === 'rotation') return '랜덤 갱신'
  if (certainty === 'limited-time') return '기간 한정'
  return '조건부'
}
