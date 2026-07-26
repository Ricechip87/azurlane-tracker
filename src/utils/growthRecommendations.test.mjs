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
      { name: '대형순 후보', shipType: '대순' },
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
  filterGrowthRecommendationSections(filterSections, '대형순').map(section => (
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
  { 경순: 1, 대형순: 1, 항모: 1 },
  '여러 추천 구역에 중복 등장하는 같은 함선은 함종별 후보 수에서 한 번만 세야 합니다.',
)
assert.deepEqual(
  countGrowthRecommendationShipTypes([filterSections[0]]),
  { 경순: 1, 대형순: 1 },
  '구역별 함종 버튼에는 해당 구역에 실제 존재하는 함종만 표시해야 합니다.',
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
