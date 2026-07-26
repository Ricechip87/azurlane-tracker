import assert from 'node:assert/strict'
import {
  getRecommendationArtworkUrls,
  getRecommendationCardArtFileName,
  getRecommendationCardArtUrl,
} from './recommendationCardArt.js'

const character = { iconUrl: '/azurlane-tracker/ship-icons/9701120.webp' }

assert.equal(getRecommendationCardArtFileName(character), '9701120.png')
assert.equal(
  getRecommendationCardArtUrl(character, '/azurlane-tracker/'),
  '/azurlane-tracker/ship-card-art/9701120.png',
)
assert.deepEqual(
  getRecommendationArtworkUrls(character, '/azurlane-tracker/'),
  [
    '/azurlane-tracker/ship-card-art/9701120.png',
    '/azurlane-tracker/ship-icons/9701120.webp',
  ],
)
assert.deepEqual(getRecommendationArtworkUrls({}, '/azurlane-tracker/'), [])
assert.deepEqual(
  getRecommendationArtworkUrls(
    { iconUrl: '/azurlane-tracker/ship-card-art/9701120.png' },
    '/azurlane-tracker/',
  ),
  ['/azurlane-tracker/ship-card-art/9701120.png'],
)
