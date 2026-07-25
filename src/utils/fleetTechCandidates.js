import { normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { normalizeFactionValue } from './factions.js'
import { obtainabilityRank } from './obtainability.js'
import { getEffectiveRarity } from './rarity.js'
import { getShipClassification, getShipPosition } from './shipClassifications.js'
import { getShipObtainability } from './shipObtainabilityLookup.js'

const RARITY_ORDER = {
  UR: 0,
  SSR: 1,
  SR: 2,
  R: 3,
  N: 4,
}

const OPERATION_TIER_ORDER = ['SS+', 'SS', 'S+', 'S', 'A+', 'A', 'B+', 'B', 'C+']

export const FLEET_TECH_CANDIDATE_BASIS = {
  LEVEL_120: 'level120',
  MAX_LB: 'maxLB',
}

const LEVEL_120_GROUPS = [
  { key: 'high', title: 'UR / SSR', rarities: new Set(['UR', 'SSR']) },
  { key: 'low', title: 'SR / R / N', rarities: new Set(['SR', 'R', 'N']) },
  { key: 'submarine', title: '잠수함 계열', rarities: new Set() },
]

const MAX_LB_GROUPS = [
  { key: 'practical', title: 'SSR / SR', rarities: new Set(['SSR', 'SR']) },
  { key: 'ur', title: 'UR', rarities: new Set(['UR']) },
  { key: 'low', title: 'R / N', rarities: new Set(['R', 'N']) },
]

export function calcFleetTechCandidates(characters, factionValue, options = {}) {
  const basis = options.basis || FLEET_TECH_CANDIDATE_BASIS.LEVEL_120
  return characters
    .filter(character => normalizeFactionValue(character.faction) === factionValue)
    .map(character => toCandidate(character, {
      basis,
      operationTierByName: options.operationTierByName,
      obtainabilityByName: options.obtainabilityByName,
    }))
    .filter(Boolean)
    .sort(compareCandidates)
}

export function splitFleetTechCandidates(candidates, basis = FLEET_TECH_CANDIDATE_BASIS.LEVEL_120) {
  return getCandidateGroups(basis).map(group => ({
    key: group.key,
    title: group.title,
    candidates: candidates.filter(candidate => candidate.group === group.key),
  }))
}

function toCandidate(character, options) {
  const { basis, operationTierByName, obtainabilityByName } = options
  const status = normalizeAcquisitionStatus(character.acquired)
  const techPoints = character.techPoints || { acquired: 0, maxLB: 0, lv120: 0 }
  const rarity = getEffectiveRarity(character)

  if (status === '120' || status === '125') return null

  const acquiredRemaining = status === '미획득' ? techPoints.acquired || 0 : 0
  const maxLbRemaining = ['미획득', '획득'].includes(status) ? techPoints.maxLB || 0 : 0
  const includesLevel120 = basis !== FLEET_TECH_CANDIDATE_BASIS.MAX_LB
  const level120Remaining = includesLevel120 ? techPoints.lv120 || 0 : 0
  const remainingTechPoints = acquiredRemaining + maxLbRemaining + level120Remaining
  const remainingSteps = countRemainingSteps(status, basis)

  if (!remainingTechPoints || !remainingSteps) return null

  const position = getShipPosition(character.shipType)
  if (basis === FLEET_TECH_CANDIDATE_BASIS.MAX_LB && position === '기타') return null
  const isSubmarine = getShipClassification(character.shipType) === '잠수'

  const operationTier = operationTierByName?.get(character.name) || ''
  const obtainability = getShipObtainability(obtainabilityByName, character) || null

  const candidate = {
    id: character.id,
    name: character.name,
    rarity,
    position,
    status,
    stages: {
      acquired: stageValue(acquiredRemaining, status !== '미획득'),
      maxLB: stageValue(maxLbRemaining, !['미획득', '획득'].includes(status)),
      level120: stageValue(level120Remaining, !includesLevel120),
    },
    remainingSteps,
    remainingTechPoints,
    group: getCandidateGroupKey(rarity, basis, isSubmarine),
    isSubmarine,
    operationTier,
    obtainability,
  }
  candidate.recommendationReasons = buildRecommendationReasons(candidate)
  return candidate
}

function getCandidateGroups(basis) {
  return basis === FLEET_TECH_CANDIDATE_BASIS.MAX_LB ? MAX_LB_GROUPS : LEVEL_120_GROUPS
}

function getCandidateGroupKey(rarity, basis, isSubmarine = false) {
  if (basis === FLEET_TECH_CANDIDATE_BASIS.LEVEL_120 && isSubmarine) return 'submarine'
  return getCandidateGroups(basis).find(group => group.rarities.has(rarity))?.key || 'low'
}

function countRemainingSteps(status, basis) {
  if (basis === FLEET_TECH_CANDIDATE_BASIS.MAX_LB) {
    if (status === '미획득') return 2
    if (status === '획득') return 1
    return 0
  }

  if (status === '미획득') return 3
  if (status === '획득') return 2
  if (status === '풀돌' || status === '100') return 1
  return 0
}

function stageValue(value, completed) {
  return {
    completed,
    value,
  }
}

function compareCandidates(a, b) {
  return groupRank(a) - groupRank(b)
    || ownershipRank(a) - ownershipRank(b)
    || a.remainingSteps - b.remainingSteps
    || unownedObtainabilityRank(a) - unownedObtainabilityRank(b)
    || operationTierRank(a.operationTier) - operationTierRank(b.operationTier)
    || b.remainingTechPoints - a.remainingTechPoints
    || rarityRank(a) - rarityRank(b)
    || a.name.localeCompare(b.name, 'ko')
}

function groupRank(candidate) {
  if (candidate.group === 'submarine') return 2
  return candidate.group === 'high' ? 0 : 1
}

function rarityRank(candidate) {
  return RARITY_ORDER[candidate.rarity] ?? 99
}

function ownershipRank(candidate) {
  return candidate.status === '미획득' ? 1 : 0
}

function unownedObtainabilityRank(candidate) {
  return candidate.status === '미획득' ? obtainabilityRank(candidate.obtainability) : 0
}

function operationTierRank(tier) {
  const index = OPERATION_TIER_ORDER.indexOf(tier)
  return index === -1 ? OPERATION_TIER_ORDER.length : index
}

function buildRecommendationReasons(candidate) {
  if (candidate.isSubmarine) {
    return ['잠수함 계열', candidate.operationTier ? `대작전 ${candidate.operationTier}` : '대작전 미평가']
  }
  return [candidate.operationTier ? `대작전 ${candidate.operationTier}` : '대작전 미평가']
}
