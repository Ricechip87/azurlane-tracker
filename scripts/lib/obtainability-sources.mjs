export const PREFER_ALTOY_GIDS = new Set([
  40199,
  40210,
  40505,
  40603,
  90114,
  90202,
  90303,
  90402,
  970101,
  970102,
  970103,
  970202,
  970203,
  970204,
  970301,
  970501,
  970502,
  970601,
  970602,
  970801,
  971201,
])

export function selectObtainSources({ gid, localKrObtain = [], altoyObtain = [] }) {
  if (PREFER_ALTOY_GIDS.has(Number(gid)) && altoyObtain.length > 0) return altoyObtain
  if (localKrObtain.length > 0) return localKrObtain
  if (altoyObtain.length > 0) return altoyObtain
  return []
}

export function resolveOfficialConstruction({ gid, lite, overrides = [], today }) {
  const override = overrides.find(row => Number(row.gid) === Number(gid) && row.effectiveAt <= today) || null
  if (!override) return { lite, override: null }
  if (!['light', 'heavy', 'special'].includes(override.pool)) throw new Error(`지원하지 않는 공식 건조 풀: ${override.pool}`)
  return { lite: { ...lite, [override.pool]: true, limited: false }, override }
}
