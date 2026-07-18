import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const data = JSON.parse(await readFile(new URL('./growthRecommendations.json', import.meta.url), 'utf8'))
const characters = JSON.parse(await readFile(new URL('./characters.json', import.meta.url), 'utf8'))
const characterIds = new Set(characters.map(character => String(character.id)))

assert.deepEqual(
  Object.fromEntries(data.sources.map(source => [source.key, source.updatedAt])),
  {
    main: '2026-01-02',
    'operation-siren': '2026-06-03',
    newbie: '2025-08-09',
  },
)

for (const recommendation of data.recommendations) {
  assert.ok(characterIds.has(String(recommendation.id)), `unknown character: ${recommendation.name}`)
  assert.ok(recommendation.tier, `missing tier: ${recommendation.name}`)
  assert.ok(recommendation.sheetGroup, `missing group: ${recommendation.name}`)
}

const recommendationKey = (source, name) => data.recommendations.some(item => item.source === source && item.name === name)
assert.equal(recommendationKey('main', '토키사키 쿠루미'), true)
assert.equal(recommendationKey('operation-siren', '클래런스 K 브론슨'), true)
assert.equal(recommendationKey('newbie', '프린츠 오이겐'), true)
assert.equal(data.recommendations.some(item => item.source === 'operation-siren' && item.name === '엔터프라이즈' && item.row === 102), false)
assert.equal(data.recommendations.some(item => item.source === 'operation-siren' && item.row >= 80), false)
assert.equal(data.sources.find(source => source.key === 'operation-siren').excludedFromRow, 80)
assert.equal(data.sources.find(source => source.key === 'operation-siren').exclusionMarker, '업데이트 안됨')

assert.deepEqual(
  data.review.unratedRecentShips.map(ship => ship.name),
  ['브리스톨(META)', '셰르부르', '아로망슈', '랑트레피드'],
)
