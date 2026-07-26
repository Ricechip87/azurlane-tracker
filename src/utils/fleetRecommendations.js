import { isAcquiredStatus, normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { getShipPosition } from './shipClassifications.js'

const AFFINITY_MULTIPLIER = {
  '호감작 안함': 1,
  '호감작 중': 1,
  '서약 완료': 1.06,
  '호감도 Max': 1.12,
}

const LEVEL_BY_STATUS = {
  미획득: 1,
  획득: 1,
  풀돌: 70,
  100: 100,
  120: 120,
  125: 125,
}

const STAT_KEYS = [
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
]

const RARITY_SCORE = { UR: 20, SSR: 14, SR: 8, R: 4, N: 0 }
const OPERATION_TIER_SCORE = {
  'SS+': 30,
  SS: 27,
  'S+': 24,
  S: 21,
  'A+': 18,
  A: 15,
  'B+': 12,
  B: 9,
  'C+': 6,
  C: 3,
}

export function getAffinityMultiplier(status, strongest = false) {
  return strongest ? 1.12 : AFFINITY_MULTIPLIER[status] || 1
}

export function getShipProgress(character, research = false, strongest = false) {
  if (strongest) {
    return {
      level: 125,
      maxLimitBreak: true,
      fullEnhance: true,
      developmentLevel: research ? 30 : null,
    }
  }

  const acquired = normalizeAcquisitionStatus(character?.acquired)
  const level = LEVEL_BY_STATUS[acquired] || 1
  return {
    level,
    maxLimitBreak: acquired !== '획득' && acquired !== '미획득',
    fullEnhance: acquired !== '획득' && acquired !== '미획득' && (!research || level >= 100),
    developmentLevel: research ? (level >= 100 ? 30 : 1) : null,
  }
}

export function calculateShipStats(source, character, options = {}) {
  const strongest = options.strongest === true
  const progress = getShipProgress(character, source?.research, strongest)
  const affinity = getAffinityMultiplier(character?.affection, strongest)
  const base = progress.maxLimitBreak ? source?.maxBase : source?.base
  const retrofit = strongest || character?.remodeled === '개장' ? source?.retrofit : null
  const equipment = options.equipmentStats || {}
  const result = {}

  for (const key of STAT_KEYS) {
    const raw = number(base?.[key])
      + number(source?.growth?.[key]) * (progress.level - 1) / 1000
      + (progress.fullEnhance ? number(source?.enhance?.[key]) : 0)
      + number(retrofit?.[key])
    const affinityAdjusted = key === 'speed' || key === 'luck' ? raw : raw * affinity
    result[key] = Math.floor(affinityAdjusted + number(equipment[key]))
  }

  return result
}

export function withSafetyMargin(value) {
  return Math.ceil(number(value) * 1.1)
}

export function buildFleetRecommendation({
  characters,
  shipData,
  stage,
  rosterMode = 'current',
  battleMode = 'first-clear',
  equipmentProfile = 'standard',
  operationTierByName = new Map(),
  equipment = [],
  fleetTechStats = {},
}) {
  const strongest = rosterMode === 'strongest'
  const ships = characters
    .filter(character => strongest || isAcquiredStatus(character.acquired))
    .map(character => buildCandidate({
      character,
      source: shipData[String(character.gid)],
      strongest,
      battleMode,
      equipmentProfile,
      equipment,
      operationTier: operationTierByName.get(character.name),
      stage,
      fleetTechStats,
    }))
    .filter(Boolean)

  const rear = ships.filter(ship => getShipPosition(ship.shipType) === '후열')
  const front = ships.filter(ship => getShipPosition(ship.shipType) === '전열')
  const submarines = ships.filter(ship => ['잠수', '잠항모'].includes(ship.shipType))
  const used = new Set()
  const pick = (pool, count, scorer = ship => ship.score) => {
    const selected = pool
      .filter(ship => !used.has(ship.gid))
      .sort((a, b) => scorer(b) - scorer(a) || a.name.localeCompare(b.name, 'ko'))
      .slice(0, count)
    selected.forEach(ship => used.add(ship.gid))
    return selected
  }

  const support = stage?.supportFleetCount
    ? pick(rear.filter(ship => ['항모', '경항모'].includes(ship.shipType)), 3, ship => ship.airScore)
    : []
  const boss = {
    rear: pick(rear, 3, ship => ship.score + ship.bossScore),
    front: pick(front, 3, ship => ship.score + ship.bossScore),
  }
  const mob = {
    rear: pick(rear, 3, ship => ship.score + ship.mobScore),
    front: pick(front, 3, ship => ship.score + ship.mobScore),
  }
  const submarine = stage?.submarineFleetCount
    ? pick(submarines, 3, ship => ship.score)
    : []

  return {
    fleets: { mob, boss, support, submarine },
    requirements: {
      airDominance: number(stage?.airDominance),
      safeAirDominance: withSafetyMargin(stage?.airDominance),
      bestAirDominance: number(stage?.bestAirDominance),
      safeBestAirDominance: withSafetyMargin(stage?.bestAirDominance),
      avoid: number(stage?.avoidRequirement),
      safeAvoid: withSafetyMargin(stage?.avoidRequirement),
    },
    meta: {
      rosterMode,
      battleMode,
      equipmentProfile,
      candidateCount: ships.length,
      incomplete: rear.length < 6 || front.length < 6,
    },
  }
}

function buildCandidate({
  character,
  source,
  strongest,
  battleMode,
  equipmentProfile,
  equipment,
  operationTier,
  stage,
  fleetTechStats,
}) {
  if (!source) return null
  const equipped = selectDirectStatEquipment(source, equipment, equipmentProfile, stage)
  const augmentEquipped = strongest || character.equip === '제작'
  const stats = calculateShipStats(source, character, {
    strongest,
    equipmentStats: mergeCombatStats(
      equipped.stats,
      augmentEquipped ? source.augment?.stats : null,
      translateFleetTechStats(fleetTechStats?.[character.shipType]),
    ),
  })
  const tierScore = (OPERATION_TIER_SCORE[operationTier] || 0) * 20
  const rarityScore = RARITY_SCORE[character.rarity] || 0
  const survival = (
    stats.health / 30
    + stats.evasion * 1.6
    + stats.antiair * chapterAntiairWeight(stage?.chapter)
  ) * chapterSurvivalWeight(stage?.chapter)
  const offense = stats.firepower + stats.torpedo * 0.75 + stats.aviation * chapterAirWeight(stage?.chapter)
    + stats.reload * 0.45 + stats.accuracy * 0.35
  const level = getShipProgress(character, source.research, strongest).level
  const levelPenalty = strongest ? 0 : Math.max(0, 125 - level) * 2.5
  const skillTieBreak = strongest || character.skilled === '스작 완료' ? 8 : 0
  const score = survival + offense + tierScore + rarityScore + skillTieBreak - levelPenalty

  return {
    ...character,
    stats,
    score,
    bossScore: offense * 0.18,
    mobScore: survival * (battleMode === 'safe-farm' ? 0.25 : 0.16) + stats.reload * 0.4,
    airScore: stats.aviation * 2 + stats.antiair + tierScore * 0.5,
    equipment: equipped.items,
    augment: source.augment
      ? {
          ...source.augment,
          equipped: augmentEquipped,
          note: augmentEquipped
            ? `${source.augment.name} 적용`
            : `${source.augment.name} 제작 후 착용 추천`,
        }
      : null,
  }
}

function translateFleetTechStats(stats = {}) {
  const aliases = {
    내구: 'health',
    포격: 'firepower',
    화력: 'firepower',
    뇌장: 'torpedo',
    뇌격: 'torpedo',
    대공: 'antiair',
    항공: 'aviation',
    장전: 'reload',
    명중: 'accuracy',
    기동: 'evasion',
    회피: 'evasion',
  }
  return Object.fromEntries(
    Object.entries(stats)
      .map(([key, value]) => [aliases[key], value])
      .filter(([key]) => key),
  )
}

function mergeCombatStats(...statsList) {
  const result = {}
  for (const stats of statsList) {
    for (const [key, value] of Object.entries(stats || {})) {
      result[key] = number(result[key]) + number(value)
    }
  }
  return result
}

function selectDirectStatEquipment(source, equipment, profile, stage) {
  if (!equipment?.length) return { items: [], stats: {} }
  const selected = []
  const stats = {}
  const rarityLimit = profile === 'standard' ? 5 : Infinity

  for (const slotTypes of source.equipSlots || []) {
    const candidate = equipment
      .filter(item => item.rarity <= rarityLimit && slotTypes.includes(item.type))
      .filter(item => !item.shipTypes?.length || item.shipTypes.includes(source.type))
      .sort((a, b) => equipmentScore(b, source.shipType, stage) - equipmentScore(a, source.shipType, stage))[0]
    if (!candidate) continue
    selected.push(candidate)
    for (const [key, value] of Object.entries(candidate.stats || {})) {
      stats[key] = number(stats[key]) + number(value)
    }
  }
  return { items: selected, stats }
}

function equipmentScore(item, shipType, stage) {
  const stats = item.stats || {}
  const rear = ['순전', '전함', '항전', '경항모', '항모', '모니터'].includes(shipType)
  return number(stats.health) * (rear ? 0.02 : 0.05)
    + number(stats.evasion) * (rear ? 0.5 : 1.2)
    + number(stats.antiair) * chapterAntiairWeight(stage?.chapter)
    + number(stats.aviation) * chapterAirWeight(stage?.chapter)
    + number(stats.firepower)
    + number(stats.torpedo) * 0.8
    + number(stats.reload) * 0.6
    + number(stats.accuracy) * 0.45
}

function chapterAirWeight(chapter) {
  if (Number(chapter) >= 15) return 1.4
  if (Number(chapter) === 14) return 0.9
  if (Number(chapter) === 13) return 1.25
  return 1
}

function chapterAntiairWeight(chapter) {
  if (Number(chapter) >= 15) return 1.65
  if (Number(chapter) === 14) return 0.95
  if (Number(chapter) === 13) return 1.35
  return 0.8
}

function chapterSurvivalWeight(chapter) {
  if (Number(chapter) === 14) return 1.3
  if (Number(chapter) >= 15) return 1.1
  return 1
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
