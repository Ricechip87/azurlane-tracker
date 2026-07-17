export const UNAVAILABLE_OBTAIN = '입수 못함'

export const MANUAL_UNAVAILABLE_GIDS = new Set([
  10300010,
  10300020,
  10300030,
  10300040,
  10300050,
  10300060,
])

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
  if (MANUAL_UNAVAILABLE_GIDS.has(Number(gid))) return [UNAVAILABLE_OBTAIN]
  if (PREFER_ALTOY_GIDS.has(Number(gid)) && altoyObtain.length > 0) return altoyObtain
  if (localKrObtain.length > 0) return localKrObtain
  if (altoyObtain.length > 0) return altoyObtain
  return []
}
