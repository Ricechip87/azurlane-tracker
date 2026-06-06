import { isAcquiredStatus, isLevel120Status, normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'

export function summarizeRoster(characters) {
  const total = characters.length
  const acquired = characters.filter(c => isAcquiredStatus(c.acquired)).length
  const level120 = characters.filter(c => isLevel120Status(c.acquired)).length
  const level125 = characters.filter(c => normalizeAcquisitionStatus(c.acquired) === '125').length
  const oath = characters.filter(c => isAcquiredStatus(c.acquired) && c.affection === '서약 완료').length

  return {
    total,
    acquired,
    collectionRate: total ? ((acquired / total) * 100).toFixed(1) : '0.0',
    level120,
    level125,
    oath,
  }
}

export function calcStatsByShipType(characters, mode) {
  const result = {}

  for (const character of characters) {
    const data = mode === 'acquired'
      ? (isAcquiredStatus(character.acquired) ? character.statAcquired : null)
      : (isLevel120Status(character.acquired) ? character.stat120 : null)

    if (!data?.stat || !data.shipTypes?.length) continue

    const shipTypes = new Set(data.shipTypes.map(normalizeStatShipTypeValue))
    for (const shipType of shipTypes) {
      if (!result[shipType]) result[shipType] = {}
      result[shipType][data.stat] = (result[shipType][data.stat] || 0) + (data.value || 0)
    }
  }

  return result
}

export function mergeStatsByShipType(...statsList) {
  const result = {}

  for (const statsByType of statsList) {
    for (const [shipType, stats] of Object.entries(statsByType || {})) {
      if (!result[shipType]) result[shipType] = {}
      for (const [stat, value] of Object.entries(stats)) {
        result[shipType][stat] = (result[shipType][stat] || 0) + value
      }
    }
  }

  return result
}
