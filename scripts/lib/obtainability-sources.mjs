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
