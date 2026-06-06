import { normalizeFactionValue } from './factions.js'
import { calcTechPoints } from './techPoints.js'

export const MAJOR_TECH_FACTIONS = [
  { value: '유니온', label: '유니온 (USS)' },
  { value: '로열', label: '로열 (HMS)' },
  { value: '중앵', label: '중앵 (IJN)' },
  { value: '철혈', label: '철혈 (KMS)' },
]

export function calcMajorFactionTechPoints(characters) {
  const result = Object.fromEntries(MAJOR_TECH_FACTIONS.map(faction => [faction.value, 0]))
  const majorFactionValues = new Set(MAJOR_TECH_FACTIONS.map(faction => faction.value))

  for (const character of characters) {
    const faction = normalizeFactionValue(character.faction)
    if (!majorFactionValues.has(faction)) continue
    result[faction] += calcTechPoints(character)
  }

  return result
}
