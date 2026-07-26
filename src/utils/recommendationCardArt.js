import {
  ADDITIONAL_STATS,
  ADDITIONAL_STAT_SHIP_TYPES,
} from './additionalStatRecommendations.js'
import { normalizeStatShipTypeValue } from './shipClassifications.js'
import { normalizeStatName } from './statLabels.js'

const ADDITIONAL_STAT_SET = new Set(ADDITIONAL_STATS)
const ADDITIONAL_SHIP_TYPE_SET = new Set(ADDITIONAL_STAT_SHIP_TYPES)

export function getRecommendationCardArtFileName(character) {
  const fileName = character?.iconUrl?.split('/').pop() || ''
  return fileName.replace(/\.(png|webp)$/i, '.png')
}

export function getRecommendationCardArtUrl(character, baseUrl) {
  const fileName = getRecommendationCardArtFileName(character)
  if (!fileName) return ''
  const normalizedBase = String(baseUrl || '/').replace(/\/?$/, '/')
  return `${normalizedBase}ship-card-art/${fileName}`
}

export function getRecommendationArtworkUrls(character, baseUrl) {
  return [...new Set([
    getRecommendationCardArtUrl(character, baseUrl),
    character?.iconUrl || '',
  ].filter(Boolean))]
}

export function isAdditionalStatCardArtCandidate(character) {
  return ['statAcquired', 'stat120'].some(phase => {
    const bonus = character?.[phase]
    return ADDITIONAL_STAT_SET.has(normalizeStatName(bonus?.stat))
      && bonus?.shipTypes?.some(shipType => (
        ADDITIONAL_SHIP_TYPE_SET.has(normalizeStatShipTypeValue(shipType))
      ))
  })
}
