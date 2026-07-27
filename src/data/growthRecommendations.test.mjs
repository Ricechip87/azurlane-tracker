import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const data = JSON.parse(await readFile(new URL('./growthRecommendations.json', import.meta.url), 'utf8'))
const characters = JSON.parse(await readFile(new URL('./characters.json', import.meta.url), 'utf8'))
const characterIds = new Set(characters.map(character => String(character.id)))
const characterById = new Map(characters.map(character => [String(character.id), character]))

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

for (const source of ['main', 'operation-siren']) {
  const carrierAmagi = data.recommendations.find(item => (
    item.source === source
    && item.sheetGroup === '항모 CV, 경항모 CVL'
    && item.name === '아마기(항모)'
  ))
  assert.equal(carrierAmagi?.id, 660, `${source} 항모 추천의 아마기는 항모 아마기여야 합니다.`)
  assert.equal(carrierAmagi?.shipType, '항모')
}
assert.equal(
  data.recommendations.some(item => (
    item.name === '아마기'
    && item.shipType === '순전'
    && item.sheetGroup === '전함 BB, 순전 BC'
  )),
  true,
  '일반 아마기의 순전 추천은 그대로 유지해야 합니다.',
)

for (const characterId of new Set(data.recommendations.map(recommendation => String(recommendation.id)))) {
  const character = characterById.get(characterId)
  const fileName = path.basename(character.iconUrl).replace(/\.(png|webp)$/i, '.png')
  await assert.doesNotReject(
    access(new URL(`../../public/ship-card-art/${fileName}`, import.meta.url)),
    `missing growth card art: ${character.name} (${fileName})`,
  )
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
