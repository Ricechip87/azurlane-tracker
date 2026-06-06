import { normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { normalizeFactionValue } from './factions.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'

const RARITY_ORDER = {
  UR: 0,
  SSR: 1,
  SR: 2,
  R: 3,
  N: 4,
}

const HIGH_RARITY = new Set(['UR', 'SSR'])
const FRONTLINE_TYPES = new Set(['구축', '경순', '중순', '대형순', '운송'])
const BACKLINE_TYPES = new Set(['순전', '전함', '경항모', '항모', '항전', '공작', '모니터'])

export function calcFleetTechCandidates(characters, factionValue) {
  return characters
    .filter(character => normalizeFactionValue(character.faction) === factionValue)
    .map(toCandidate)
    .filter(Boolean)
    .sort(compareCandidates)
}

export function splitFleetTechCandidates(candidates) {
  return {
    high: candidates.filter(candidate => candidate.group === 'high'),
    low: candidates.filter(candidate => candidate.group === 'low'),
  }
}

function toCandidate(character) {
  const status = normalizeAcquisitionStatus(character.acquired)
  const techPoints = character.techPoints || { acquired: 0, maxLB: 0, lv120: 0 }

  if (status === '120' || status === '125') return null

  const acquiredRemaining = status === '미획득' ? techPoints.acquired || 0 : 0
  const maxLbRemaining = ['미획득', '획득'].includes(status) ? techPoints.maxLB || 0 : 0
  const level120Remaining = techPoints.lv120 || 0
  const remainingTechPoints = acquiredRemaining + maxLbRemaining + level120Remaining
  const remainingSteps = countRemainingSteps(status)

  if (!remainingTechPoints || !remainingSteps) return null

  return {
    id: character.id,
    name: character.name,
    rarity: character.rarity,
    position: getShipPosition(character.shipType),
    status,
    stages: {
      acquired: stageValue(acquiredRemaining, status !== '미획득'),
      maxLB: stageValue(maxLbRemaining, !['미획득', '획득'].includes(status)),
      level120: stageValue(level120Remaining, false),
    },
    remainingSteps,
    remainingTechPoints,
    efficiency: remainingTechPoints / remainingSteps,
    group: HIGH_RARITY.has(character.rarity) ? 'high' : 'low',
  }
}

function getShipPosition(shipType) {
  const normalized = normalizeStatShipTypeValue(shipType)
  if (FRONTLINE_TYPES.has(normalized)) return '전열'
  if (BACKLINE_TYPES.has(normalized)) return '후열'
  return '기타'
}

function countRemainingSteps(status) {
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
    || b.efficiency - a.efficiency
    || b.remainingTechPoints - a.remainingTechPoints
    || a.remainingSteps - b.remainingSteps
    || rarityRank(a) - rarityRank(b)
    || a.name.localeCompare(b.name, 'ko')
}

function groupRank(candidate) {
  return candidate.group === 'high' ? 0 : 1
}

function rarityRank(candidate) {
  return RARITY_ORDER[candidate.rarity] ?? 99
}
