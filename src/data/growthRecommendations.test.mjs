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
    main: '2026-10-11',
    'operation-siren': '2026-10-28',
    newbie: '2025-08-09',
  },
)

for (const recommendation of data.recommendations) {
  assert.ok(characterIds.has(String(recommendation.id)), `unknown character: ${recommendation.name}`)
  assert.ok(recommendation.tier, `missing tier: ${recommendation.name}`)
  assert.ok(recommendation.sheetGroup, `missing group: ${recommendation.name}`)
}

for (const source of ['operation-siren']) {
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
  ['main', '샌디에이고'],
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
  const fileName = path.basename(character.iconUrl).replace(/\.(png|webp)$/i, '.png')
  await assert.doesNotReject(
    access(new URL(`../../public/ship-card-art/${fileName}`, import.meta.url)),
    `missing growth card art: ${character.name} (${fileName})`,
  )
}

const recommendationKey = (source, name) => data.recommendations.some(item => item.source === source && item.name === name)
const operationSirenRecommendations = data.recommendations.filter(item => item.source === 'operation-siren')
assert.deepEqual([...new Set(operationSirenRecommendations.map(item => item.sheetGroup))], [
  '구축 DD', '경순 CL', '중순 / 대순 CA', '전함 BB, 순전 BC', '항모 CV, 경항모 CVL', '잠수 SS',
], '10월 28일 대작전 갱신의 여섯 카테고리를 보존해야 합니다.')
for (const [name, id] of [['아즈치', 755], ['빅토리어스(META)', 'M065']]) {
  const entries = operationSirenRecommendations.filter(item => item.name === name)
  assert.ok(entries.length > 0, `10월 28일 대작전 추천 누락: ${name}`)
  assert.ok(entries.every(item => item.id === id), `10월 28일 대작전 추천 식별 오류: ${name}`)
}
assert.equal(recommendationKey('main', '아즈치'), true)
assert.equal(recommendationKey('main', '레오나르도 다 빈치'), true)
const mainRecommendations = data.recommendations.filter(item => item.source === 'main')
assert.deepEqual([...new Set(mainRecommendations.map(item => item.sheetSection))], ['메인 밀기용', '메인 쫄작용'])
assert.ok(mainRecommendations.every(item => item.row < 35), '등급 없는 편성 예시는 추천 순위에 넣지 않습니다.')
assert.equal(data.sources.find(source => source.key === 'main').excludedFromRow, 35)
for (const [section, name, tier, group] of [
  ['메인 밀기용', '무사시', 'SS', '후열 기함'],
  ['메인 밀기용', '라피Ⅱ', 'SS', '전열 선봉'],
  ['메인 밀기용', '벨파스트', 'A+', '전열 나머지 2자리'],
  ['메인 쫄작용', '벨파스트', 'SS', '전열 선봉'],
  ['메인 쫄작용', '이14', 'S', '잠수함'],
]) {
  const entry = mainRecommendations.find(item => item.sheetSection === section && item.name === name)
  assert.equal(entry?.tier, tier, `${section}: ${name}`)
  assert.ok(entry?.sheetGroup.startsWith(group), `${section}: ${name} 역할`)
}
assert.ok(data.sources.find(source => source.key === 'main').sourceGuidance.some(item => item.text.includes('지원항모 편성 예시')))
assert.equal(recommendationKey('operation-siren', '클래런스 K 브론슨'), true)
assert.equal(recommendationKey('newbie', '프린츠 오이겐'), true)
assert.equal(recommendationKey('operation-siren', '콜렛'), true, '콜렛 대작전 B+ 추천 반영')
assert.equal(recommendationKey('operation-siren', '베닝턴'), true, '베닝턴 대작전 A+ 추천 반영')
assert.equal(data.recommendations.find(item => item.source === 'operation-siren' && item.name === '콜렛')?.tier, 'B+')
assert.equal(data.recommendations.find(item => item.source === 'operation-siren' && item.name === '베닝턴')?.tier, 'A+')
assert.equal(data.recommendations.some(item => item.source === 'operation-siren' && item.name === '엔터프라이즈' && item.row === 102), false)
assert.equal(data.recommendations.some(item => item.source === 'operation-siren' && item.row >= 80), false)
assert.equal(data.sources.find(source => source.key === 'operation-siren').excludedFromRow, 80)
assert.equal(data.sources.find(source => source.key === 'operation-siren').exclusionMarker, '업데이트 안됨')

assert.deepEqual(
  data.review.unratedRecentShips.map(ship => ship.name),
  ['랑트레피드', '해리슨', '존 로저스'],
)
assert.equal(
  operationSirenRecommendations.find(item => item.name === '빅스버그')?.tier,
  'B',
  '빅스버그는 10월 28일 대작전 B등급 등록으로 미평가 안내에서 제외됩니다.',
)
