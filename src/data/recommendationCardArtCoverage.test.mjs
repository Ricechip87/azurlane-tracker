import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import characters from './characters.json' with { type: 'json' }
import { getRecommendationCardArtFileName } from '../utils/recommendationCardArt.js'

for (const character of characters) {
  const pngFile = getRecommendationCardArtFileName(character)
  const webpFile = pngFile.replace(/\.png$/i, '.webp')
  const hasCardArtwork = [pngFile, webpFile].some(fileName => (
    fileName && existsSync(new URL(`../../public/ship-card-art/${fileName}`, import.meta.url))
  ))
  assert.ok(hasCardArtwork, `${character.name} must have PNG or WEBP recommendation card artwork`)
}

console.log(`recommendation card artwork coverage passed (${characters.length}/${characters.length})`)
