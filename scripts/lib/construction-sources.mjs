const CONSTRUCTION_SOURCE_PATTERN = /^(소형함|중형함|대형함|특형함)\s*(?:상시\s*)?건조$/

export function normalizeConstructionSources(sources = []) {
  const result = []
  for (const source of sources) {
    const value = String(source || '').trim()
    if (!value) continue
    const parts = value.split(/[、,·]/).map(part => part.trim()).filter(Boolean)
    const normalizedParts = parts.map(normalizeConstructionSource)
    if (normalizedParts.every(Boolean)) result.push(...normalizedParts)
    else result.push(value)
  }
  return [...new Set(result)]
}

function normalizeConstructionSource(source) {
  const match = source.match(CONSTRUCTION_SOURCE_PATTERN)
  if (!match) return null
  const pool = match[1] === '대형함' ? '중형함' : match[1]
  return `${pool} 상시 건조`
}
