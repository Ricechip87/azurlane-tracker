import assert from 'node:assert/strict'
import {
  buildGrowthRecommendationSections,
  countGrowthRecommendationShipTypes,
  filterGrowthRecommendationSections,
} from './growthRecommendations.js'

const characters = [
  { id: '1', name: '우선함', rarity: 'SSR', shipType: '경순', faction: 'HMS', acquired: '획득' },
  { id: '2', name: '차순위함', rarity: 'SSR', shipType: '전함', faction: 'HMS', acquired: '획득' },
]
const recommendationData = {
  recommendations: [
    { source: 'main', name: '차순위함', tier: 'S', row: 2, column: 1, roleNote: '지원' },
    { source: 'main', name: '우선함', tier: 'SS', row: 1, column: 1, roleNote: '힐러' },
  ],
}
const obtainabilityByName = new Map(characters.map(character => [
  character.name,
  { difficulty: { key: 'easy', label: '쉬움' }, availability: 'permanent' },
]))

const sections = buildGrowthRecommendationSections('main', characters, recommendationData, obtainabilityByName)
assert.equal(sections.find(section => section.id === 'top').cards[0].name, '우선함')
assert.equal(sections.find(section => section.id === 'next').cards[0].name, '차순위함')
assert.equal(sections.find(section => section.id === 'special').cards[0].name, '우선함')
assert.equal(sections.find(section => section.id === 'main-force').cards[0].name, '차순위함')

function buildQuotaFixture(typeCounts, roleNote = '함종별 추천') {
  const fixtureCharacters = []
  const fixtureRecommendations = []

  for (const [shipType, count] of Object.entries(typeCounts)) {
    for (let index = 1; index <= count; index += 1) {
      const name = `${shipType} 후보 ${index}`
      fixtureCharacters.push({
        id: name,
        name,
        rarity: 'SSR',
        shipType,
        faction: 'HMS',
        acquired: '미획득',
      })
      fixtureRecommendations.push({
        source: 'main',
        name,
        tier: 'A',
        row: index,
        column: 1,
        roleNote,
      })
    }
  }

  return {
    characters: fixtureCharacters,
    recommendationData: { recommendations: fixtureRecommendations },
    obtainabilityByName: new Map(fixtureCharacters.map(character => [
      character.name,
      {
        difficulty: { key: 'easy', label: '쉬움' },
        availability: { key: 'permanent', label: '상시 획득' },
      },
    ])),
  }
}

const vanguardQuotaFixture = buildQuotaFixture({
  구축: 10,
  경순: 1,
  중순: 5,
  초순: 3,
  대순: 2,
})
const vanguardQuotaSections = buildGrowthRecommendationSections(
  'main',
  vanguardQuotaFixture.characters,
  vanguardQuotaFixture.recommendationData,
  vanguardQuotaFixture.obtainabilityByName,
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([
    vanguardQuotaSections.find(section => section.id === 'vanguard'),
  ]),
  { 구축: 8, 경순: 1, 중순: 8 },
  '전열 기준 추천은 중순·초순·대순을 중순 그룹 하나로 묶어 최대 8명만 표시해야 합니다.',
)

const mainForceQuotaFixture = buildQuotaFixture({
  순전: 2,
  전함: 10,
  경항모: 1,
  항모: 10,
})
const mainForceQuotaSections = buildGrowthRecommendationSections(
  'main',
  mainForceQuotaFixture.characters,
  mainForceQuotaFixture.recommendationData,
  mainForceQuotaFixture.obtainabilityByName,
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([
    mainForceQuotaSections.find(section => section.id === 'main-force'),
  ]),
  { 순전: 2, 전함: 8, 경항모: 1, 항모: 8 },
  '후열 기준 추천도 함종별 최대 8명만 표시하고 부족한 함종의 자리를 다른 함종으로 채우지 않아야 합니다.',
)

const specialQuotaFixture = buildQuotaFixture({
  구축: 6,
  경순: 2,
  항모: 5,
}, '힐러')
const specialQuotaSections = buildGrowthRecommendationSections(
  'main',
  specialQuotaFixture.characters,
  specialQuotaFixture.recommendationData,
  specialQuotaFixture.obtainabilityByName,
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([
    specialQuotaSections.find(section => section.id === 'special'),
  ]),
  { 구축: 4, 경순: 2, 항모: 4 },
  '특수 함종 추천은 함종별 최대 4명만 표시하고 부족분을 다른 함종으로 채우지 않아야 합니다.',
)

const positionFillQuotaFixture = buildQuotaFixture({
  구축: 10,
  경순: 2,
  중순: 3,
})
const positionFillQuotaSections = buildGrowthRecommendationSections(
  'main',
  positionFillQuotaFixture.characters,
  positionFillQuotaFixture.recommendationData,
  positionFillQuotaFixture.obtainabilityByName,
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([
    positionFillQuotaSections.find(section => section.id === 'position-fill'),
  ]),
  { 구축: 8, 경순: 2, 중순: 3 },
  '포지션 보강 추천은 선정된 부족 함종별 최대 8명만 표시해야 합니다.',
)

const submarineQuotaFixture = buildQuotaFixture({
  잠수: 6,
  잠항모: 2,
})
const submarineQuotaSections = buildGrowthRecommendationSections(
  'main',
  submarineQuotaFixture.characters,
  submarineQuotaFixture.recommendationData,
  submarineQuotaFixture.obtainabilityByName,
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([
    submarineQuotaSections.find(section => section.id === 'submarine'),
  ]),
  { 잠수: 4, 잠항모: 2 },
  '잠수함 추천은 세부 함종별 최대 4명만 표시해야 합니다.',
)

const levelCapCharacters = [
  { id: '120', name: '120레벨함', rarity: 'SSR', shipType: '경순', faction: 'HMS', acquired: '120' },
  { id: '125', name: '125레벨함', rarity: 'SSR', shipType: '경순', faction: 'HMS', acquired: '125' },
]
const levelCapSections = buildGrowthRecommendationSections('main', levelCapCharacters, {
  recommendations: levelCapCharacters.map((character, index) => ({
    source: 'main',
    name: character.name,
    tier: 'SS',
    row: index + 1,
    column: 1,
    roleNote: '딜러',
  })),
}, new Map())
assert.deepEqual(
  levelCapSections.find(section => section.id === 'top').cards.map(card => card.name),
  ['120레벨함'],
  '육성 추천은 120레벨함을 유지하고 125레벨함만 제외해야 합니다.',
)

const filterSections = [
  {
    id: 'priority',
    cards: [
      { name: '경순 후보', shipType: '경순' },
      { name: '대형순 후보', shipType: '초순' },
    ],
  },
  {
    id: 'secondary',
    cards: [
      { name: '경순 후보', shipType: '경순' },
      { name: '항모 후보', character: { shipType: '항모' } },
    ],
  },
]
assert.deepEqual(
  filterGrowthRecommendationSections(filterSections, '경순').map(section => (
    section.cards.map(card => card.name)
  )),
  [['경순 후보'], ['경순 후보']],
)
assert.deepEqual(
  filterGrowthRecommendationSections(filterSections, '중순').map(section => (
    section.cards.map(card => card.name)
  )),
  [['대형순 후보'], []],
)
assert.deepEqual(
  filterGrowthRecommendationSections(filterSections, '전체'),
  filterSections,
)
assert.deepEqual(
  countGrowthRecommendationShipTypes(filterSections),
  { 경순: 1, 중순: 1, 항모: 1 },
  '여러 추천 구역에 중복 등장하는 같은 함선은 함종별 후보 수에서 한 번만 세야 합니다.',
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([filterSections[0]]),
  { 경순: 1, 중순: 1 },
  '구역별 함종 버튼에는 해당 구역에 실제 존재하는 함종만 표시해야 합니다.',
)

const uniqueEquipmentCharacter = {
  id: 'unique-equipment',
  name: '전장 기준 후보',
  rarity: 'SSR',
  shipType: '구축',
  faction: '중앵',
  acquired: '획득',
}
const uniqueEquipmentSections = buildGrowthRecommendationSections('main', [uniqueEquipmentCharacter], {
  recommendations: [{
    source: 'main',
    name: uniqueEquipmentCharacter.name,
    tier: 'A',
    row: 1,
    column: 1,
    roleNote: '안정적인 탱킹',
    requiresUniqueEquipment: true,
  }],
}, new Map())
assert.equal(
  uniqueEquipmentSections.find(section => section.id === 'top').cards[0].summary,
  '전용장비 장착 시 기준 · 안정적인 탱킹',
  '(전장) 추천 후보의 카드 사유는 전용장비 기준임을 맨 앞에 알려야 합니다.',
)

const mixedRankSections = [{
  id: 'mixed-ranks',
  cards: [
    { name: '구축 A', shipType: '구축', tier: 'A', row: 4, column: 1 },
    { name: '구축 B+', shipType: '구축', tier: 'B+', row: 5, column: 1 },
    { name: '경순 A+', shipType: '경순', tier: 'A+', row: 3, column: 1 },
    { name: '경순 B', shipType: '경순', tier: 'B', row: 6, column: 1 },
  ],
}]
assert.deepEqual(
  filterGrowthRecommendationSections(mixedRankSections, '전체')[0].cards.map(card => card.name),
  ['경순 A+', '구축 A', '구축 B+', '경순 B'],
  '전체 필터는 함종별 묶음을 풀고 모든 후보를 추천 등급 순서로 섞어 표시해야 합니다.',
)
assert.deepEqual(
  filterGrowthRecommendationSections(mixedRankSections, '구축')[0].cards.map(card => card.name),
  ['구축 A', '구축 B+'],
  '함종 필터는 선택한 함종 안에서 추천 등급 순서를 유지해야 합니다.',
)

const submarineCharacter = {
  id: 'sub-carrier',
  name: '잠항모 후보',
  rarity: 'SSR',
  shipType: '잠항모',
  faction: '중앵',
  acquired: '획득',
}
const submarineSections = buildGrowthRecommendationSections('main', [submarineCharacter], {
  recommendations: [{
    source: 'main',
    name: submarineCharacter.name,
    tier: 'A',
    row: 1,
    column: 1,
    roleNote: '잠수 지원',
  }],
}, new Map())
assert.deepEqual(
  submarineSections.find(section => section.id === 'submarine').cards.map(card => card.name),
  ['잠항모 후보'],
)
assert.equal(
  submarineSections.find(section => section.id === 'vanguard').cards.length,
  0,
  '잠항모는 전열 추천이 아니라 잠수함 추천에만 포함해야 합니다.',
)

console.log('growth recommendation logic tests passed')
