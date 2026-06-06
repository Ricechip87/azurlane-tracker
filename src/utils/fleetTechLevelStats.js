import fleetTechLevelBonuses from '../data/fleetTechLevelBonuses.json' with { type: 'json' }
import { MAJOR_TECH_FACTIONS } from './fleetTech.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'

export function calcFleetTechLevelStats(majorFactionTechPoints) {
  const result = {}

  const currentLevels = calcFleetTechLevels(majorFactionTechPoints)

  for (const faction of MAJOR_TECH_FACTIONS) {
    const currentLevel = currentLevels[faction.value]
    const appliedBonuses = new Set()
    for (const bonus of currentLevel?.bonuses || []) {
      const shipType = normalizeStatShipTypeValue(bonus.shipType)
      const bonusKey = `${shipType}:${bonus.stat}`
      if (appliedBonuses.has(bonusKey)) continue
      appliedBonuses.add(bonusKey)

      if (!result[shipType]) result[shipType] = {}
      result[shipType][bonus.stat] = (result[shipType][bonus.stat] || 0) + (bonus.value || 0)
    }
  }

  return result
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

export function findCurrentLevel(levels, points) {
  return levels.reduce((current, level) => (
    points >= level.pt && (!current || level.level > current.level) ? level : current
  ), null)
}
