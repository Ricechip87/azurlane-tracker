import assert from 'node:assert/strict'
import characters from './characters.json' with { type: 'json' }
import {
  ADDITIONAL_STAT_CATEGORIES,
  buildAdditionalStatCategoryCandidates,
  buildAdditionalStatCandidates,
  getAdditionalStatsForCategory,
  getAvailableAdditionalShipTypes,
} from '../utils/additionalStatRecommendations.js'

for (const category of ADDITIONAL_STAT_CATEGORIES) {
  for (const stat of getAdditionalStatsForCategory(category.id)) {
    const availableShipTypes = new Set(getAvailableAdditionalShipTypes(stat))
    const applicableShipTypes = category.shipTypes.filter(shipType => availableShipTypes.has(shipType))
    const groupedCandidates = buildAdditionalStatCategoryCandidates(characters, applicableShipTypes, stat)
    const individualCandidates = applicableShipTypes.flatMap(shipType => (
      buildAdditionalStatCandidates(characters, shipType, stat)
    ))
    const groupedIds = new Set(groupedCandidates.map(candidate => String(candidate.id)))
    const individualIds = new Set(individualCandidates.map(candidate => String(candidate.id)))

    assert.deepEqual(
      [...groupedIds].sort(),
      [...individualIds].sort(),
      `${category.label} ${stat} grouped candidates must equal the individual ship-type union`,
    )
  }
}

console.log('additional-stat grouped candidate coverage passed')
