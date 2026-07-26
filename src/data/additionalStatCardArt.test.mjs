import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import characters from './characters.json' with { type: 'json' }
import {
  ADDITIONAL_STATS,
  ADDITIONAL_STAT_SHIP_TYPES,
} from '../utils/additionalStatRecommendations.js'
import { normalizeStatShipTypeValue } from '../utils/shipClassifications.js'

const stats = new Set(ADDITIONAL_STATS)
const shipTypes = new Set(ADDITIONAL_STAT_SHIP_TYPES)
const relevantCharacters = characters.filter(character => (
  ['statAcquired', 'stat120'].some(phase => {
    const bonus = character[phase]
    return stats.has(bonus?.stat)
      && bonus?.shipTypes?.some(shipType => shipTypes.has(normalizeStatShipTypeValue(shipType)))
  })
))

assert.ok(relevantCharacters.length > 0)

for (const character of relevantCharacters) {
  const fileName = path.basename(character.iconUrl || '').replace(/\.(png|webp)$/i, '.png')
  assert.ok(fileName, `${character.name} must have a card-art file name`)

  const data = await readFile(new URL(`../../public/ship-card-art/${fileName}`, import.meta.url))
  assert.equal(
    data.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    `${character.name} card art must be PNG`,
  )
  const width = data.readUInt32BE(16)
  const height = data.readUInt32BE(20)
  assert.ok(width >= 192, `${character.name} card-art width`)
  assert.ok(height >= 256, `${character.name} card-art height`)
  assert.ok(width / height >= 0.7 && width / height <= 0.8, `${character.name} card-art aspect ratio`)
}

console.log(`additional-stat card art tests passed (${relevantCharacters.length} ships)`)
