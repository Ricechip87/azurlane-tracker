export function buildArenaShopGids(arenaData, shopData) {
  const activeCommodityIds = new Set()
  for (const row of Object.values(arenaData || {})) {
    for (const [key, entries] of Object.entries(row || {})) {
      if (!key.startsWith('commodity_list_')) continue
      for (const entry of entries || []) activeCommodityIds.add(Number(entry?.[0]))
    }
  }

  const gids = new Set()
  for (const item of Object.values(shopData || {})) {
    if (!activeCommodityIds.has(Number(item?.id)) || item?.genre !== 'arena_shop' || Number(item?.type) !== 4) continue
    const skinId = Number(item?.effect_args?.[0])
    if (Number.isFinite(skinId)) gids.add(Math.floor(skinId / 10))
  }
  return gids
}

export function timelineFallbackSource(timelineInfo) {
  if (!timelineInfo) return null
  if (timelineInfo.source) return `${timelineInfo.source} (${timelineInfo.date} 상시편입)`
  return `KR 상시편입 확인 (${timelineInfo.date}, 세부 입수처 미확인)`
}
