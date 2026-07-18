import { isAcquiredStatus, normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { normalizeFactionValue } from './factions.js'
import { calcFleetTechCandidates } from './fleetTechCandidates.js'
import { getShipPosition } from './shipClassifications.js'
import { calcTechPoints } from './techPoints.js'

export function calcAllFactionTechPoints(characters) {
  const result = {}

  for (const character of characters) {
    const faction = normalizeFactionValue(character.faction)
    if (!faction) continue
    result[faction] = (result[faction] || 0) + calcTechPoints(character)
  }

  return result
}

export function evaluateResearchUnlock(requirements, characters, factionTechPoints = calcAllFactionTechPoints(characters)) {
  const evaluated = requirements.map(requirement => {
    const faction = normalizeFactionValue(requirement.faction)
    const current = requirement.type === 'roster-count'
      ? characters.filter(character => (
          isAcquiredStatus(character.acquired)
          && normalizeFactionValue(character.faction) === faction
          && getShipPosition(character.shipType) === requirement.lane
        )).length
      : factionTechPoints[faction] || 0
    const remaining = Math.max(0, requirement.value - current)

    return {
      ...requirement,
      faction,
      current,
      remaining,
      met: remaining === 0,
    }
  })
  const progress = evaluated.length === 0
    ? 1
    : Math.min(...evaluated.map(requirement => Math.min(1, requirement.current / requirement.value)))

  return {
    met: evaluated.every(requirement => requirement.met),
    progress,
    requirements: evaluated,
  }
}

export function buildResearchRecommendationState(researchShips, characters) {
  const characterById = new Map(characters.map(character => [String(character.id), character]))
  const factionTechPoints = calcAllFactionTechPoints(characters)
  const ready = []
  const locked = []
  const completed = []

  for (const researchShip of researchShips) {
    const character = characterById.get(String(researchShip.id))
    const unlock = evaluateResearchUnlock(researchShip.unlockRequirements || [], characters, factionTechPoints)
    const item = { ...researchShip, character, unlock }

    if (isAcquiredStatus(character?.acquired)) completed.push(item)
    else if (unlock.met) ready.push(item)
    else locked.push(item)
  }

  ready.sort(compareReadyResearchShips)
  locked.sort((a, b) => b.unlock.progress - a.unlock.progress || compareReadyResearchShips(a, b))
  completed.sort((a, b) => b.generation - a.generation || a.name.localeCompare(b.name, 'ko'))

  return { ready, locked, completed, factionTechPoints }
}

export function selectPriorityResearchShips(ready, locked) {
  if (ready.length > 0) {
    const latestGeneration = Math.max(...ready.map(item => item.generation))
    return {
      items: ready.filter(item => item.generation === latestGeneration),
      mode: 'ready',
    }
  }

  const orderedLocked = [...locked].sort((a, b) => b.unlock.progress - a.unlock.progress || compareReadyResearchShips(a, b))
  const topProgress = orderedLocked[0]?.unlock.progress || 0
  if (topProgress > 0) {
    return {
      items: orderedLocked.filter(item => item.unlock.progress === topProgress),
      mode: 'progress',
    }
  }

  const starterGeneration = Math.min(...orderedLocked.map(item => item.generation))
  return {
    items: Number.isFinite(starterGeneration)
      ? orderedLocked.filter(item => item.generation === starterGeneration).sort(compareStarterResearchShips)
      : [],
    mode: 'starter',
  }
}

export function getEligibleResearchXpShips(phase, characters) {
  const factions = new Set((phase.factions || []).map(normalizeFactionValue))

  return characters
    .filter(character => isAcquiredStatus(character.acquired))
    .filter(character => factions.has(normalizeFactionValue(character.faction)))
    .filter(character => getShipPosition(character.shipType) === phase.lane)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

const OPERATION_TIER_ORDER = ['SS+', 'SS', 'S+', 'S', 'A+', 'A', 'B+', 'B']
const OBTAINABILITY_ORDER = {
  easy: 0,
  normal: 1,
  hard: 2,
  limited: 3,
  unknown: 4,
  excluded: 5,
}
const RESEARCH_FACTION_ORDER = ['유니온', '로열', '중앵', '철혈', '동황', '사르데냐', '노스유니온', '아이리스', '비시아', '튤리퍼']

export function buildResearchFactionProgress(researchShips, factionTechPoints) {
  const targetsByFaction = new Map()
  const generationByShipName = new Map((researchShips || []).map(ship => [ship.name, Number(ship.generation) || 0]))

  for (const ship of researchShips || []) {
    for (const requirement of ship.unlockRequirements || []) {
      if (requirement.type !== 'tech-points') continue
      const faction = normalizeFactionValue(requirement.faction)
      if (!faction) continue
      if (!targetsByFaction.has(faction)) targetsByFaction.set(faction, new Map())
      const factionTargets = targetsByFaction.get(faction)
      if (!factionTargets.has(requirement.value)) factionTargets.set(requirement.value, new Set())
      factionTargets.get(requirement.value).add(ship.name)
    }
  }

  return [...targetsByFaction.entries()]
    .map(([faction, targetMap]) => {
      const current = factionTechPoints?.[faction] || 0
      const targets = [...targetMap.entries()]
        .map(([required, ships]) => ({
          required: Number(required),
          ships: [...ships].sort((a, b) => (generationByShipName.get(b) || 0) - (generationByShipName.get(a) || 0) || a.localeCompare(b, 'ko')),
          met: current >= Number(required),
        }))
        .sort((a, b) => a.required - b.required)
      const nextTarget = targets.find(target => !target.met) || null

      return {
        faction,
        current,
        maxRequired: targets.at(-1)?.required || 0,
        remaining: nextTarget ? nextTarget.required - current : 0,
        nextTarget,
        targets,
      }
    })
    .sort((a, b) => researchFactionRank(a.faction) - researchFactionRank(b.faction) || a.faction.localeCompare(b.faction, 'ko'))
}

export function buildOperationTierByName(growthRecommendationData) {
  const result = new Map()

  for (const recommendation of growthRecommendationData?.recommendations || []) {
    if (recommendation.source !== 'operation-siren' || !recommendation.name || !recommendation.tier) continue
    const previous = result.get(recommendation.name)
    if (!previous || operationTierRank(recommendation.tier) < operationTierRank(previous)) {
      result.set(recommendation.name, recommendation.tier)
    }
  }

  return result
}

export function getResearchUnlockCandidates(requirement, characters, rankingData = {}) {
  const faction = normalizeFactionValue(requirement.faction)
  if (requirement.type === 'tech-points') {
    return calcFleetTechCandidates(characters, faction)
      .map(candidate => addResearchRankingData(candidate, rankingData))
      .sort(compareResearchUnlockCandidates)
  }

  return characters
    .filter(character => !isAcquiredStatus(character.acquired))
    .filter(character => normalizeFactionValue(character.faction) === faction)
    .filter(character => getShipPosition(character.shipType) === requirement.lane)
    .map(character => addResearchRankingData({
      ...character,
      status: normalizeAcquisitionStatus(character.acquired),
      remainingSteps: 1,
      remainingTechPoints: 0,
    }, rankingData))
    .sort(compareResearchUnlockCandidates)
}

function addResearchRankingData(candidate, { obtainabilityByName, operationTierByName }) {
  const obtainability = obtainabilityByName?.get(candidate.name)
  return {
    ...candidate,
    obtainability,
    difficulty: obtainability?.difficulty || { key: 'unknown', label: '미확인' },
    operationTier: operationTierByName?.get(candidate.name) || null,
  }
}

function compareResearchUnlockCandidates(a, b) {
  const ownershipDifference = Number(!isAcquiredStatus(a.status)) - Number(!isAcquiredStatus(b.status))
  if (ownershipDifference) return ownershipDifference

  if (isAcquiredStatus(a.status)) {
    return a.remainingSteps - b.remainingSteps
      || operationTierRank(a.operationTier) - operationTierRank(b.operationTier)
      || b.remainingTechPoints - a.remainingTechPoints
      || a.name.localeCompare(b.name, 'ko')
  }

  return obtainabilityRank(a.difficulty?.key) - obtainabilityRank(b.difficulty?.key)
    || operationTierRank(a.operationTier) - operationTierRank(b.operationTier)
    || b.remainingTechPoints - a.remainingTechPoints
    || a.name.localeCompare(b.name, 'ko')
}

function operationTierRank(tier) {
  const index = OPERATION_TIER_ORDER.indexOf(tier)
  return index === -1 ? OPERATION_TIER_ORDER.length : index
}

function obtainabilityRank(key) {
  return OBTAINABILITY_ORDER[key] ?? OBTAINABILITY_ORDER.unknown
}

function researchFactionRank(faction) {
  const index = RESEARCH_FACTION_ORDER.indexOf(faction)
  return index === -1 ? RESEARCH_FACTION_ORDER.length : index
}

function compareReadyResearchShips(a, b) {
  return b.generation - a.generation
    || planRarityScore(a.planRarity) - planRarityScore(b.planRarity)
    || a.name.localeCompare(b.name, 'ko')
}

function compareStarterResearchShips(a, b) {
  const requirementTotal = item => (item.unlockRequirements || []).reduce((sum, requirement) => sum + Number(requirement.value || 0), 0)
  return requirementTotal(a) - requirementTotal(b) || compareReadyResearchShips(a, b)
}

function planRarityScore(value) {
  return value === 'DR' ? 0 : 1
}
