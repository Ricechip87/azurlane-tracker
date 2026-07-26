import { isAcquiredStatus, isLevel120Status, normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { obtainabilityRank } from './obtainability.js'
import { getEffectiveRarity } from './rarity.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'
import { getShipObtainability } from './shipObtainabilityLookup.js'
import { normalizeStatName } from './statLabels.js'

export const ADDITIONAL_STAT_SHIP_TYPES = [
  '순전', '전함', '항전', '모니터', '경항모', '항모',
  '구축', '경순', '중순', '대형순',
  '잠수', '잠항모',
]

export const ADDITIONAL_STATS = ['뇌격', '대공', '화력', '항공', '장전', '명중', '회피']

const PRIORITIES = {
  구축: ['뇌격', '회피', '화력', '장전', '명중'],
  경순: ['대공', '화력', '장전', '명중', '뇌격'],
  중순: ['화력', '장전', '명중', '뇌격'],
  대형순: ['화력', '장전', '명중', '뇌격'],
  순전: ['화력', '장전', '명중'],
  전함: ['화력', '장전', '명중'],
  항전: ['화력', '항공', '장전', '명중'],
  모니터: ['화력', '장전', '명중'],
  경항모: ['항공', '장전', '명중'],
  항모: ['항공', '장전', '명중'],
  잠수: ['뇌격', '명중', '회피'],
  잠항모: ['뇌격', '명중', '항공', '회피'],
}

const FALLBACK_STAT_ORDER = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const BROAD_COVERAGE_TARGETS = {
  모니터: ['중순', '대형순'],
  경항모: ['항모'],
}
const OPERATION_TIER_ORDER = ['SS+', 'SS', 'S+', 'S', 'A+', 'A', 'B+', 'B', 'C+']
const RARITY_ORDER = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 }

export function getAdditionalStatPriorities(shipType) {
  return [...(PRIORITIES[shipType] || [])]
}

export function getAdditionalStatPriority(shipType, stat) {
  const priorities = PRIORITIES[shipType]
  if (!priorities) return Number.POSITIVE_INFINITY
  const explicit = priorities.indexOf(stat)
  if (explicit >= 0) return explicit
  const fallback = FALLBACK_STAT_ORDER.indexOf(stat)
  return priorities.length + (fallback >= 0 ? fallback : FALLBACK_STAT_ORDER.length)
}

export function getAvailableAdditionalShipTypes(stat) {
  const normalizedStat = normalizeStatName(stat)
  if (!normalizedStat) return []
  return ADDITIONAL_STAT_SHIP_TYPES.filter(shipType => PRIORITIES[shipType]?.includes(normalizedStat))
}

export function resolveAdditionalStatSelection(stat, shipType) {
  const normalizedStat = normalizeStatName(stat)
  const selectedStat = ADDITIONAL_STATS.includes(normalizedStat) ? normalizedStat : ADDITIONAL_STATS[0]
  const shipTypes = getAvailableAdditionalShipTypes(selectedStat)
  return {
    stat: selectedStat,
    shipType: shipTypes.includes(shipType) ? shipType : shipTypes[0] || '',
    shipTypes,
  }
}

export function buildAdditionalStatCandidates(characters, shipType, stat, rankingData = {}) {
  if (!PRIORITIES[shipType] || !stat) return []

  return characters
    .map(character => toCandidate(character, shipType, stat, rankingData))
    .filter(Boolean)
    .sort(compareCandidates)
}

function toCandidate(character, shipType, stat, rankingData) {
  const status = normalizeAcquisitionStatus(character.acquired)
  const acquiredCompleted = isAcquiredStatus(status)
  const level120Completed = isLevel120Status(status)
  const acquiredApplicable = matchesBonus(character.statAcquired, shipType, stat)
  const level120Applicable = matchesBonus(character.stat120, shipType, stat)
  const acquiredValue = !acquiredCompleted && acquiredApplicable
    ? Number(character.statAcquired.value || 0)
    : 0
  const level120Value = !level120Completed && level120Applicable
    ? Number(character.stat120.value || 0)
    : 0
  const remainingGain = acquiredValue + level120Value
  if (!remainingGain) return null

  const pendingBonuses = [
    acquiredValue ? character.statAcquired : null,
    level120Value ? character.stat120 : null,
  ].filter(Boolean)
  const targetShipTypes = [...new Set(pendingBonuses.flatMap(data => (
    (data.shipTypes || []).map(normalizeStatShipTypeValue)
  )))]
  const broadTargets = BROAD_COVERAGE_TARGETS[shipType] || []
  const broadCoverage = broadTargets.length > 0 && broadTargets.every(target => targetShipTypes.includes(target))
  const operationTier = rankingData.operationTierByName?.get(character.name) || ''
  const obtainability = getShipObtainability(rankingData.obtainabilityByName, character) || null

  return {
    ...character,
    status,
    rarity: getEffectiveRarity(character),
    selectedShipType: shipType,
    selectedStat: stat,
    targetShipTypes,
    broadCoverage,
    stages: {
      acquired: { applicable: acquiredApplicable, completed: acquiredApplicable && acquiredCompleted, value: acquiredValue },
      level120: { applicable: level120Applicable, completed: level120Applicable && level120Completed, value: level120Value },
    },
    remainingGain,
    remainingSteps: countRemainingSteps(status, acquiredValue, level120Value),
    operationTier,
    obtainability,
  }
}

function compareCandidates(a, b) {
  return Number(b.broadCoverage) - Number(a.broadCoverage)
    || Number(a.status === '미획득') - Number(b.status === '미획득')
    || a.remainingSteps - b.remainingSteps
    || unownedObtainabilityRank(a) - unownedObtainabilityRank(b)
    || operationTierRank(a.operationTier) - operationTierRank(b.operationTier)
    || b.remainingGain - a.remainingGain
    || (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99)
    || a.name.localeCompare(b.name, 'ko')
}

function countRemainingSteps(status, acquiredValue, level120Value) {
  if (status === '미획득') return level120Value ? 2 : Number(Boolean(acquiredValue))
  return level120Value ? 1 : 0
}

function unownedObtainabilityRank(candidate) {
  return candidate.status === '미획득' ? obtainabilityRank(candidate.obtainability) : 0
}

function operationTierRank(tier) {
  const index = OPERATION_TIER_ORDER.indexOf(tier)
  return index < 0 ? OPERATION_TIER_ORDER.length : index
}

function matchesBonus(data, shipType, stat) {
  return normalizeStatName(data?.stat) === normalizeStatName(stat)
    && targetsShipType(data, shipType)
    && Number(data.value || 0) > 0
}

function targetsShipType(data, shipType) {
  return (data?.shipTypes || []).some(target => normalizeStatShipTypeValue(target) === shipType)
}
