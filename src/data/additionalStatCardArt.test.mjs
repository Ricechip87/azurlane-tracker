import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import characters from './characters.json' with { type: 'json' }
import {
  getRecommendationCardArtFileName,
  getRecommendationCardArtUrl,
  isAdditionalStatCardArtCandidate,
} from '../utils/recommendationCardArt.js'

const relevantCharacters = characters.filter(isAdditionalStatCardArtCandidate)

assert.ok(relevantCharacters.length > 0)
assert.equal(
  getRecommendationCardArtUrl({ iconUrl: '/ship-icons/123.webp' }, '/azurlane-tracker'),
  '/azurlane-tracker/ship-card-art/123.webp',
)

for (const character of relevantCharacters) {
  const pngFile = getRecommendationCardArtFileName(character)
  const fileName = [pngFile, pngFile.replace(/\.png$/i, '.webp')].find(candidate => (
    existsSync(new URL(`../../public/ship-card-art/${candidate}`, import.meta.url))
  ))
  assert.ok(fileName, `${character.name} must have PNG or WEBP card art`)

  const data = await readFile(new URL(`../../public/ship-card-art/${fileName}`, import.meta.url))
  const isPng = data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  const isWebp = data.subarray(0, 4).toString('ascii') === 'RIFF'
    && data.subarray(8, 12).toString('ascii') === 'WEBP'
  assert.ok(isPng || isWebp, `${character.name} card art must be PNG or WEBP`)
  if (!isPng) continue
  const width = data.readUInt32BE(16)
  const height = data.readUInt32BE(20)
  assert.ok(width >= 192, `${character.name} card-art width`)
  assert.ok(height >= 256, `${character.name} card-art height`)
  assert.ok(width / height >= 0.7 && width / height <= 0.8, `${character.name} card-art aspect ratio`)
}

console.log(`additional-stat candidate card art passed (${relevantCharacters.length}/${relevantCharacters.length}, missing 0)`)
