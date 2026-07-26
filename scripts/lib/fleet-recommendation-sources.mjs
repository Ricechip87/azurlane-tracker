const EQUIPMENT_STAT_MAP = {
  durability: 'health',
  cannon: 'firepower',
  torpedo: 'torpedo',
  antiaircraft: 'antiair',
  air: 'aviation',
  reload: 'reload',
  hit: 'accuracy',
  dodge: 'evasion',
  speed: 'speed',
  luck: 'luck',
  antisub: 'asw',
}

export function buildShipCombatData(characters, altoyShips, spWeaponStatistics = {}) {
  const altoyByGid = new Map(altoyShips.map(ship => [String(ship.gid), ship]))
  const spWeaponsById = new Map(Object.values(spWeaponStatistics).map(item => [Number(item.id), item]))
  const ships = {}
  const missing = []

  for (const character of characters) {
    const source = altoyByGid.get(String(character.gid))
    if (!source) {
      missing.push({ gid: character.gid, name: character.name })
      continue
    }
    const baseKeys = Object.keys(source.base || {}).sort((a, b) => Number(a) - Number(b))
    const firstBase = source.base?.[baseKeys[0]] || {}
    const maxBase = source.base?.[baseKeys.at(-1)] || firstBase
    const growth = source.growth?.[baseKeys.at(-1)]
      || source.growth?.[baseKeys[0]]
      || {}

    ships[String(character.gid)] = {
      name: character.name,
      shipType: character.shipType,
      type: Number(source.type) || 0,
      research: /^(19|29)\d{3}$/.test(String(character.gid)),
      base: pickStats(firstBase),
      maxBase: pickStats(maxBase),
      growth: pickStats(growth),
      enhance: pickStats(source.enhance),
      retrofit: pickStats(source.retrofit?.bonus),
      augment: buildAugment(source.sp_weapon, spWeaponsById),
      equipSlots: [1, 2, 3, 4, 5].map(index => (
        Array.isArray(source[`equip_${index}`])
          ? source[`equip_${index}`].map(Number)
          : []
      )),
    }
  }

  return { ships, missing }
}

function buildAugment(augment, byId) {
  if (!augment?.icon) return null
  const first = byId.get(Number(augment.icon))
  if (!first) return null
  let current = first
  const visited = new Set()
  while (Number(current?.next) > 0 && !visited.has(Number(current.id))) {
    visited.add(Number(current.id))
    const next = byId.get(Number(current.next))
    if (!next) break
    current = next
  }
  const stats = {}
  for (let index = 1; index <= 2; index += 1) {
    const stat = EQUIPMENT_STAT_MAP[first[`attribute_${index}`]]
    const value = Number(current[`value_${index}`] ?? first[`value_${index}`])
    if (stat && Number.isFinite(value) && value !== 0) stats[stat] = value
  }
  return {
    id: Number(first.id),
    name: String(augment.name || first.name),
    stats,
  }
}

export function buildEquipmentDirectStats(statistics) {
  const records = Object.values(statistics || {})
  const byId = new Map(records.map(item => [Number(item.id), item]))
  const equipment = []

  for (const base of records) {
    if (!base?.name || base.name === '0' || base.base || Number(base.rarity) < 4) continue
    const level10 = byId.get(Number(base.id) + 10)
    if (Number(level10?.base) !== Number(base.id)) continue

    const stats = {}
    for (let index = 1; index <= 3; index += 1) {
      const stat = EQUIPMENT_STAT_MAP[base[`attribute_${index}`]]
      const value = Number(level10[`value_${index}`] ?? base[`value_${index}`])
      if (stat && Number.isFinite(value) && value !== 0) stats[stat] = value
    }
    if (!Object.keys(stats).length) continue

    equipment.push({
      id: Number(base.id),
      name: String(base.name),
      icon: String(base.icon || ''),
      type: Number(base.type) || 0,
      rarity: Number(base.rarity) || 0,
      shipTypes: Array.isArray(base.part_main) ? base.part_main.map(Number) : [],
      stats,
    })
  }

  return equipment.sort((a, b) => a.type - b.type || b.rarity - a.rarity || a.id - b.id)
}

export function buildStageRequirements(chapters) {
  return Object.values(chapters || {})
    .filter(stage => {
      const id = Number(stage?.id)
      const chapter = Number(stage?.map)
      return Number.isInteger(id)
        && chapter >= 1
        && chapter <= 15
        && Math.floor(id / 100) === chapter
        && Number(stage.type) === 1
    })
    .map(stage => ({
      id: Number(stage.id),
      chapter: Number(stage.map),
      name: String(stage.chapter_name || stage.name || stage.id),
      subtitle: String(stage.name || ''),
      unlockLevel: Number(stage.unlocklevel) || 0,
      airDominance: Number(stage.air_dominance) || 0,
      bestAirDominance: Number(stage.best_air_dominance) || 0,
      avoidRequirement: Number(stage.avoid_require) || 0,
      supportFleetCount: Number(stage.support_group_num) || 0,
      submarineFleetCount: Number(stage.submarine_num) || 0,
      nightBattle: hasValues(stage.weather_grids),
      directRules: buildDirectRules(stage),
    }))
    .sort((a, b) => a.id - b.id)
}

function buildDirectRules(stage) {
  const rules = []
  if (Number(stage.air_dominance) > 0) rules.push('항공 우세 수치')
  if (Number(stage.avoid_require) > 0) rules.push('매복 회피 수치')
  if (hasValues(stage.weather_grids)) rules.push('야간/기상 격자')
  if (Number(stage.support_group_num) > 0) rules.push(`지원 함대 ${stage.support_group_num}개`)
  if (Number(stage.submarine_num) > 0) rules.push(`잠수함대 ${stage.submarine_num}개`)
  return rules
}

function hasValues(value) {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

function pickStats(value) {
  if (!value || typeof value !== 'object') return {}
  const result = {}
  for (const key of [
    'health',
    'firepower',
    'torpedo',
    'antiair',
    'aviation',
    'reload',
    'accuracy',
    'evasion',
    'speed',
    'luck',
    'asw',
  ]) {
    const parsed = Number(value[key])
    if (Number.isFinite(parsed) && parsed !== 0) result[key] = parsed
  }
  return result
}
