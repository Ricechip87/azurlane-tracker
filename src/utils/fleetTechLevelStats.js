import fleetTechLevelBonuses from '../data/fleetTechLevelBonuses.json' with { type: 'json' }
import { MAJOR_TECH_FACTIONS } from './fleetTech.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'

export function calcFleetTechLevelStats(majorFactionTechPoints) {
  const result = {}

  const currentLevels = calcFleetTechLevels(majorFactionTechPoints)

  for (const faction of MAJOR_TECH_FACTIONS) {
    const currentLevel = currentLevels[faction.value]
    for (const bonus of summarizeFleetTechLevelEffects(currentLevel)) {
      if (!result[bonus.shipType]) result[bonus.shipType] = {}
      result[bonus.shipType][bonus.stat] = (result[bonus.shipType][bonus.stat] || 0) + bonus.value
    }
  }

  return result
}

export function summarizeFleetTechLevelEffects(level) {
  const effects = []
  const seen = new Set()

  for (const bonus of level?.bonuses || []) {
    const shipType = normalizeStatShipTypeValue(bonus.shipType)
    const key = `${shipType}:${bonus.stat}`
    if (seen.has(key)) continue
    seen.add(key)
    effects.push({
      shipType,
      stat: bonus.stat,
      value: bonus.value || 0,
    })
  }

  return effects
}

export function calcFleetTechLevels(majorFactionTechPoints) {
  const result = {}

  for (const faction of MAJOR_TECH_FACTIONS) {
    const levels = fleetTechLevelBonuses[faction.code] || []
    const points = majorFactionTechPoints[faction.value] || 0
    result[faction.value] = findCurrentLevel(levels, points)
  }

  return result
}

export function calcFleetTechProgress(majorFactionTechPoints) {
  const result = {}

  for (const faction of MAJOR_TECH_FACTIONS) {
    const levels = fleetTechLevelBonuses[faction.code] || []
    const points = majorFactionTechPoints[faction.value] || 0
    const currentLevel = findCurrentLevel(levels, points)
    const nextLevel = findNextLevel(levels, points)

    result[faction.value] = {
      points,
      currentLevel,
      nextLevel,
      pointsToNext: nextLevel ? Math.max(nextLevel.pt - points, 0) : 0,
      isMaxLevel: !nextLevel && levels.length > 0,
    }
  }

  return result
}

export function findCurrentLevel(levels, points) {
  return levels.reduce((current, level) => (
    points >= level.pt && (!current || level.level > current.level) ? level : current
  ), null)
}

export function findNextLevel(levels, points) {
  return levels
    .filter(level => level.pt > points)
    .reduce((next, level) => (!next || level.pt < next.pt ? level : next), null)
}
