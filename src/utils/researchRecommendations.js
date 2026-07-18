import { isAcquiredStatus } from './acquisitionStatus.js'
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

export function getEligibleResearchXpShips(phase, characters) {
  const factions = new Set((phase.factions || []).map(normalizeFactionValue))

  return characters
    .filter(character => isAcquiredStatus(character.acquired))
    .filter(character => factions.has(normalizeFactionValue(character.faction)))
    .filter(character => getShipPosition(character.shipType) === phase.lane)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

export function getResearchUnlockCandidates(requirement, characters) {
  const faction = normalizeFactionValue(requirement.faction)
  if (requirement.type === 'tech-points') {
    return calcFleetTechCandidates(characters, faction)
  }

  return characters
    .filter(character => !isAcquiredStatus(character.acquired))
    .filter(character => normalizeFactionValue(character.faction) === faction)
    .filter(character => getShipPosition(character.shipType) === requirement.lane)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

function compareReadyResearchShips(a, b) {
  return b.generation - a.generation
    || planRarityScore(a.planRarity) - planRarityScore(b.planRarity)
    || a.name.localeCompare(b.name, 'ko')
}

function planRarityScore(value) {
  return value === 'DR' ? 0 : 1
}
