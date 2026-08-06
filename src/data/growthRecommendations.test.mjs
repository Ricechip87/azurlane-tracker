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

const kagaRecommendations = data.recommendations.filter(item => item.name === '카가')
assert.ok(kagaRecommendations.length > 0, '현재 추천표의 항모 카가 추천이 누락되었습니다.')
assert.ok(
  kagaRecommendations.every(item => item.id === 225 && item.shipType === '항모'),
  '카가 추천은 별도 함선인 카가(전함)이 아니라 항모 카가와 매칭되어야 합니다.',
)
assert.equal(
  characterById.get('368')?.name,
  '카가(전함)',
  '카가(전함)은 항모 카가와 구분되는 별도 함선으로 유지해야 합니다.',
)
assert.notEqual(
  characters.find(character => character.name === '론')?.id,
  characters.find(character => character.name === '론(µ장비)')?.id,
  '론과 론(μ장비)은 서로 다른 함선 ID를 유지해야 합니다.',
)
const collabKasumi = data.recommendations.find(item => (
  item.source === 'main' && item.row === 27 && item.column === 30
))
assert.equal(
  collabKasumi?.id,
  'Z063',
  '원본의 카스미(콜)은 일반 구축함이 아니라 카스미 (콜라보)와 매칭되어야 합니다.',
)
assert.equal(collabKasumi?.name, '카스미 (콜라보)')
assert.equal(collabKasumi?.shipType, '중순')
assert.deepEqual(
  ['카스미', '카스미(META)', '카스미 (콜라보)'].map(name => {
    const character = characters.find(item => item.name === name)
    return [character?.id, character?.shipType, character?.faction]
  }),
  [
    [424, '구축', '중앵'],
    ['M036', '구축', 'META'],
    ['Z063', '중순', 'DOAX VV'],
  ],
  '일반·META·콜라보 카스미는 각각 별개의 함선으로 유지해야 합니다.',
)

for (const [source, name] of [
  ['main', '유키카제'],
  ['operation-siren', '유키카제'],
  ['operation-siren', '포미더블'],
]) {
  assert.equal(
    data.recommendations.some(item => (
      item.source === source
      && item.name === name
      && item.requiresUniqueEquipment === true
    )),
    true,
    `${source}의 ${name}(전장) 추천은 전용장비 기준 표식을 보존해야 합니다.`,
  )
}

for (const [name, id] of [['론', 'P005'], ['가스코뉴', 'P012']]) {
  const uniqueEquipmentRecommendations = data.recommendations.filter(item => (
    item.name === name && item.requiresUniqueEquipment === true
  ))
  assert.ok(uniqueEquipmentRecommendations.length > 0, `${name}(전장) 추천이 누락되었습니다.`)
  assert.ok(
    uniqueEquipmentRecommendations.every(item => String(item.id) === id),
    `${name}(전장)은 μ장비 동명이함이 아니라 일반 ${name}과 매칭되어야 합니다.`,
  )
}

for (const characterId of new Set(data.recommendations.map(recommendation => String(recommendation.id)))) {
  const character = characterById.get(characterId)
  const fileName = path.basename(character.iconUrl).replace(/\.(png|webp)$/i, '.webp')
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
