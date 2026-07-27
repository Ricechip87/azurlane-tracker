import { isAcquiredStatus, isLevel120Status, isLevel125Status, normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { getFactionDisplayText } from './factions.js'
import { isGrowthRecommendationEligible, obtainabilityRank } from './obtainability.js'
import { getEffectiveRarity } from './rarity.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'
import { getShipObtainability } from './shipObtainabilityLookup.js'

export const GROWTH_MODE_SOURCE = {
  main: 'main',
  operation: 'operation-siren',
  newbie: 'newbie',
}

export const GROWTH_SHIP_TYPE_FILTER_ORDER = [
  '구축',
  '경순',
  '중순',
  '대형순',
  '순전',
  '전함',
  '항전',
  '모니터',
  '경항모',
  '항모',
  '공작',
  '운송',
  '잠수',
  '잠항모',
  '범선',
]

const MAIN_FORCE_TYPES = new Set(['전함', '순전', '항전', '항모', '경항모', '모니터'])
const SUBMARINE_TYPES = new Set(['잠수', '잠수항모', '잠항모'])
const POSITION_TYPES = ['구축', '경순', '중순', '전함', '순전', '항모', '경항모']
const VANGUARD_RECOMMENDATION_TYPES = ['구축', '경순', '중순']
const MAIN_FORCE_RECOMMENDATION_TYPES = ['순전', '전함', '경항모', '항모']
const TIER_ORDER = ['SS+', 'SS', 'S+', 'S', 'A+', 'A', 'B+', 'B']
export function buildGrowthRecommendationSections(mode, characters, growthRecommendationData, obtainabilityByName) {
  const characterByName = new Map(characters.map(character => [character.name, character]))
  const candidates = getCandidatesForMode(mode, characterByName, growthRecommendationData, obtainabilityByName)
  const regularCandidates = candidates.filter(candidate => !isSubmarineCandidate(candidate))
  const submarineCandidates = candidates.filter(isSubmarineCandidate)
  const tierGroups = [...new Set(regularCandidates.map(candidate => candidate.tier))]
    .sort((a, b) => tierScore(a) - tierScore(b))
  const topTier = tierGroups[0]
  const nextTier = tierGroups[1]

  return [
    {
      id: 'top',
      title: '최우선 추천',
      description: topTier ? '현재 조건에서 남은 후보 중 가장 높은 추천 등급입니다.' : '조건에 맞는 최우선 후보를 찾지 못했습니다.',
      cards: cardsForSection(regularCandidates.filter(candidate => candidate.tier === topTier), 16),
      groupByLane: true,
    },
    {
      id: 'next',
      title: '차순위 추천',
      description: nextTier ? '현재 조건에서 최우선 바로 다음 추천 등급입니다.' : '최우선 바로 아래 단계 후보가 없거나 이미 충분히 육성되었습니다.',
      cards: cardsForSection(regularCandidates.filter(candidate => candidate.tier === nextTier), 16),
      groupByLane: true,
    },
    {
      id: 'vanguard',
      title: '전열 기준 추천',
      description: '구축, 경순, 중순을 함종별 최대 8명씩 추천합니다.',
      cards: cardsForShipTypeQuotas(
        regularCandidates.filter(candidate => candidate.lane === '전열'),
        8,
        VANGUARD_RECOMMENDATION_TYPES,
      ),
    },
    {
      id: 'main-force',
      title: '후열 기준 추천',
      description: '순전, 전함, 경항모, 항모를 함종별 최대 8명씩 추천합니다.',
      cards: cardsForShipTypeQuotas(
        regularCandidates.filter(candidate => candidate.lane === '후열'),
        8,
        MAIN_FORCE_RECOMMENDATION_TYPES,
      ),
    },
    {
      id: 'special',
      title: '특수 항목 추천',
      description: '힐러, 버퍼, 디버퍼, 서포터 역할이 명확한 후보를 함종별 최대 4명씩 추천합니다.',
      cards: cardsForShipTypeQuotas(regularCandidates.filter(isSpecialCandidate), 4),
    },
    {
      id: 'position-fill',
      title: '포지션 보강 추천',
      description: '현재 보유함 기준으로 120 이상 UR/SSR 수가 부족한 함종을 각각 최대 8명씩 추천합니다.',
      cards: cardsForShipTypeQuotas(
        getPositionFillCandidates(regularCandidates, characters),
        8,
      ),
    },
    {
      id: 'submarine',
      title: '잠수함 추천',
      description: '엔드 콘텐츠용 잠수함 후보를 세부 함종별 최대 4명씩 따로 추천합니다.',
      cards: cardsForShipTypeQuotas(submarineCandidates, 4),
    },
  ]
}

export function filterGrowthRecommendationSections(sections, shipType) {
  const normalizedFilter = normalizeGrowthShipType(shipType)

  return sections.map(section => ({
    ...section,
    cards: (
      !normalizedFilter || normalizedFilter === '전체'
        ? [...section.cards]
        : section.cards.filter(card => getGrowthCardShipTypeGroup(card) === normalizedFilter)
    ).sort(compareCandidates),
  }))
}

export function countGrowthRecommendationShipTypes(sections) {
  const seen = new Set()
  const counts = {}

  for (const section of sections || []) {
    for (const card of section.cards || []) {
      const shipType = getGrowthCardShipTypeGroup(card)
      if (!shipType || shipType === '-') continue
      const identity = `${card.character?.id || card.name}::${shipType}`
      if (seen.has(identity)) continue
      seen.add(identity)
      counts[shipType] = (counts[shipType] || 0) + 1
    }
  }

  return counts
}

function getGrowthCardShipType(card) {
  return normalizeGrowthShipType(
    card?.character?.shipType
    || card?.shipType
    || card?.tags?.[0],
  )
}

function getGrowthCardShipTypeGroup(card) {
  return getGrowthShipTypeGroup(getGrowthCardShipType(card))
}

function getGrowthShipTypeGroup(shipType) {
  const normalized = normalizeGrowthShipType(shipType)
  return normalized === '대형순' ? '중순' : normalized
}

function normalizeGrowthShipType(shipType) {
  return normalizeStatShipTypeValue(shipType)
}

function getCandidatesForMode(mode, characterByName, growthRecommendationData, obtainabilityByName) {
  const source = GROWTH_MODE_SOURCE[mode] || GROWTH_MODE_SOURCE.main
  const seen = new Map()

  for (const recommendation of growthRecommendationData.recommendations || []) {
    if (recommendation.source !== source) continue
    const character = characterByName.get(recommendation.name)
    const obtainability = character
      ? getShipObtainability(obtainabilityByName, character)
      : obtainabilityByName.get(recommendation.name)
    const candidate = buildCandidate(recommendation, character, obtainability)
    if (!isEligibleCandidate(candidate)) continue

    const previous = seen.get(candidate.name)
    if (!previous || compareCandidates(candidate, previous) < 0) {
      seen.set(candidate.name, candidate)
    }
  }

  return [...seen.values()].sort(compareCandidates)
}

function buildCandidate(recommendation, character, obtainability) {
  const status = normalizeAcquisitionStatus(character?.acquired)
  const difficulty = obtainability?.difficulty || { key: 'unknown', label: '미확인' }
  const shipType = character?.shipType || recommendation.shipType || '-'
  const roleSummary = normalizeGrowthSummary(recommendation.roleNote)

  return {
    ...recommendation,
    character,
    obtainability,
    difficulty,
    status,
    acquired: isAcquiredStatus(status),
    lane: getLane(shipType),
    tags: [shipType, getGroupTag(recommendation.sheetGroup)].filter(Boolean),
    summary: roleSummary || '원본 추천표 등급 기준 후보',
  }
}

function isEligibleCandidate(candidate) {
  return isGrowthRecommendationEligible({
    acquired: candidate.acquired,
    level125: isLevel125Status(candidate.status),
    obtainability: candidate.obtainability,
  })
}

function compareCandidates(a, b) {
  return tierScore(a.tier) - tierScore(b.tier) ||
    ownershipScore(a) - ownershipScore(b) ||
    difficultyScore(a) - difficultyScore(b) ||
    Number(a.row || 999) - Number(b.row || 999) ||
    Number(a.column || 999) - Number(b.column || 999) ||
    a.name.localeCompare(b.name, 'ko')
}

function cardsForSection(cards, limit) {
  return cards.slice(0, limit)
}

function cardsForShipTypeQuotas(cards, limitPerType, shipTypes) {
  const availableTypes = [...new Set(cards.map(getGrowthCardShipTypeGroup).filter(Boolean))]
  const orderedTypes = shipTypes || [
    ...GROWTH_SHIP_TYPE_FILTER_ORDER.filter(shipType => availableTypes.includes(shipType)),
    ...availableTypes
      .filter(shipType => !GROWTH_SHIP_TYPE_FILTER_ORDER.includes(shipType))
      .sort((a, b) => a.localeCompare(b, 'ko')),
  ]

  return orderedTypes.flatMap(shipType => (
    cards
      .filter(card => getGrowthCardShipTypeGroup(card) === shipType)
      .slice(0, limitPerType)
  ))
}

function tierScore(tier) {
  const index = TIER_ORDER.indexOf(tier)
  return index === -1 ? TIER_ORDER.length : index
}

function ownershipScore(candidate) {
  if (!candidate.acquired) return 4
  if (candidate.status === '120') return -1
  if (candidate.status === '100') return 0
  if (candidate.status === '풀돌') return 1
  if (candidate.status === '획득') return 2
  return 3
}

function difficultyScore(candidate) {
  return obtainabilityRank(candidate.obtainability)
}

function getLane(shipType) {
  if (SUBMARINE_TYPES.has(shipType)) return shipType
  return MAIN_FORCE_TYPES.has(shipType) ? '후열' : '전열'
}

function getGroupTag(sheetGroup) {
  if (!sheetGroup) return ''
  return String(sheetGroup).replace(/\s+/g, ' ').split(' ')[0]
}

export function normalizeGrowthSummary(value) {
  return getFactionDisplayText(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' / ')
}

function isSpecialCandidate(candidate) {
  const text = `${candidate.sheetGroup || ''} ${candidate.roleNote || ''}`
  return /힐|버프|디버프|보조|서포터|지원|실드|대공/.test(text)
}

function isSubmarineCandidate(candidate) {
  const shipType = candidate.character?.shipType || candidate.shipType
  const group = String(candidate.sheetGroup || '')
  return SUBMARINE_TYPES.has(shipType) || group.includes('잠수')
}

function getPositionFillCandidates(candidates, characters) {
  const ownedHighLevelCounts = new Map(POSITION_TYPES.map(type => [type, 0]))

  for (const character of characters) {
    if (!['UR', 'SSR'].includes(getEffectiveRarity(character))) continue
    if (!isLevel120Status(character.acquired)) continue
    const shipTypeGroup = getGrowthShipTypeGroup(character.shipType)
    if (!ownedHighLevelCounts.has(shipTypeGroup)) continue
    ownedHighLevelCounts.set(shipTypeGroup, ownedHighLevelCounts.get(shipTypeGroup) + 1)
  }

  const weakestTypes = [...ownedHighLevelCounts.entries()]
    .sort((a, b) => a[1] - b[1] || POSITION_TYPES.indexOf(a[0]) - POSITION_TYPES.indexOf(b[0]))
    .slice(0, 3)
    .map(([type]) => type)

  return candidates
    .filter(candidate => weakestTypes.includes(getGrowthShipTypeGroup(candidate.character?.shipType || candidate.shipType)))
    .sort((a, b) => (
      weakestTypes.indexOf(getGrowthShipTypeGroup(a.character?.shipType || a.shipType))
      - weakestTypes.indexOf(getGrowthShipTypeGroup(b.character?.shipType || b.shipType))
      || compareCandidates(a, b)
    ))
}
