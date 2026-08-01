import assert from 'node:assert/strict'
import {
  DEFAULT_SHIP_DATABASE_FILTERS,
  calculateShipDatabaseStats,
  filterShipDatabaseCharacters,
  getVisibleRetrofitBonuses,
  hasUnresolvedSkillValues,
  sortShipDatabaseCharacters,
} from './shipDatabase.js'

const characters = [
  { gid: 1, name: '구축함', rarity: 'SSR', shipType: '구축', faction: '이글 유니온', canRemodel: false },
  { gid: 2, name: '대형순양함', rarity: 'UR', shipType: '대형순', faction: '메탈 블러드', canRemodel: true },
  { gid: 3, name: '항공모함', rarity: 'SR', shipType: '항모', faction: '중앵', canRemodel: false },
]

assert.deepEqual(
  filterShipDatabaseCharacters(characters, DEFAULT_SHIP_DATABASE_FILTERS).map(ship => ship.gid),
  [1, 2, 3],
  '기본 필터는 원본 도감순을 보존해야 합니다.',
)

assert.equal(hasUnresolvedSkillValues('자신의 내구 X%만큼 회복하고 X초 동안 유지한다.'), true)
assert.equal(hasUnresolvedSkillValues('자신의 포격이 10.0%/20.0% 상승한다.'), false)
assert.deepEqual(
  sortShipDatabaseCharacters(characters, {
    1: { id: 20 },
    2: { id: 10 },
    3: { id: 30 },
  }).map(ship => ship.gid),
  [2, 1, 3],
  '함순이 DB의 도감순은 ALtoy 도감 번호를 기준으로 해야 합니다.',
)
assert.deepEqual(
  filterShipDatabaseCharacters(characters, { ...DEFAULT_SHIP_DATABASE_FILTERS, search: '대형' }).map(ship => ship.gid),
  [2],
)
assert.deepEqual(
  filterShipDatabaseCharacters(characters, { ...DEFAULT_SHIP_DATABASE_FILTERS, rarity: 'SSR' }).map(ship => ship.gid),
  [1],
)
assert.deepEqual(
  filterShipDatabaseCharacters(characters, { ...DEFAULT_SHIP_DATABASE_FILTERS, shipType: '중순' }).map(ship => ship.gid),
  [2],
  '중순 필터에는 대형순이 포함되어야 합니다.',
)
assert.deepEqual(
  filterShipDatabaseCharacters(characters, { ...DEFAULT_SHIP_DATABASE_FILTERS, remodelOnly: true }).map(ship => ship.gid),
  [2],
)

const combatSource = {
  research: false,
  base: { health: 100, firepower: 10, speed: 20, luck: 30 },
  maxBase: { health: 400, firepower: 40, speed: 20, luck: 30 },
  growth: { health: 1000, firepower: 1000, speed: 0, luck: 0 },
  enhance: { health: 50, firepower: 20 },
  retrofit: { health: 165, firepower: 25, equipment_proficiency_1: 0.05 },
}

assert.deepEqual(calculateShipDatabaseStats(combatSource, 'base'), {
  health: 100,
  firepower: 10,
  torpedo: 0,
  antiair: 0,
  aviation: 0,
  reload: 0,
  accuracy: 0,
  evasion: 0,
  speed: 20,
  luck: 30,
  asw: 0,
})

const level70 = calculateShipDatabaseStats(combatSource, 'lb70')
assert.equal(level70.health, Math.floor(400 + (1000 * 69 / 1000) + 50))
assert.equal(level70.firepower, Math.floor(40 + (1000 * 69 / 1000) + 20))

const level100 = calculateShipDatabaseStats(combatSource, '100')
assert.equal(level100.health, Math.floor(400 + (1000 * 99 / 1000) + 50 + 165))
assert.equal(level100.firepower, Math.floor(40 + (1000 * 99 / 1000) + 20 + 25))
assert.equal(level100.speed, 20, '속력에는 성장이나 호감도 보정을 임의로 적용하지 않습니다.')
const level100Oath = calculateShipDatabaseStats(combatSource, '100', '서약 100+')
assert.equal(level100Oath.health, Math.floor((400 + (1000 * 99 / 1000) + 50 + 165) * 1.09))
assert.equal(level100Oath.speed, 20, '속력은 서약 보정을 받지 않습니다.')

const researchSource = { ...combatSource, research: true }
assert.equal(
  calculateShipDatabaseStats(researchSource, 'lb70').firepower,
  Math.floor(10 + (1000 * 69 / 1000)),
  '100 미만 연구함은 개발 레벨 1 기준이어야 합니다.',
)
assert.equal(
  calculateShipDatabaseStats(researchSource, '100').firepower,
  Math.floor(40 + (1000 * 99 / 1000) + 20 + 25),
  '100 이상 연구함은 개발 레벨 30과 개장 완료 기준이어야 합니다.',
)

assert.deepEqual(getVisibleRetrofitBonuses(combatSource), {
  health: 165,
  firepower: 25,
}, '장비 효율 변화는 개장 보너스에서 제외해야 합니다.')

const deweySource = {
  research: false,
  base: {},
  maxBase: {
    health: 654,
    firepower: 34,
    torpedo: 129,
    antiair: 85,
    aviation: 0,
    reload: 69,
    accuracy: 63,
    evasion: 60,
    speed: 44.4,
    luck: 72,
    asw: 112,
  },
  growth: {
    health: 7564,
    firepower: 191,
    torpedo: 702,
    antiair: 753,
    aviation: 0,
    reload: 482,
    accuracy: 975,
    evasion: 1115,
    speed: 0,
    luck: 0,
    asw: 520,
  },
  enhance: {
    firepower: 14,
    torpedo: 51,
    reload: 52,
  },
}

assert.deepEqual(
  calculateShipDatabaseStats(deweySource, '125'),
  {
    health: 1591,
    firepower: 71,
    torpedo: 267,
    antiair: 178,
    aviation: 0,
    reload: 180,
    accuracy: 183,
    evasion: 198,
    speed: 44,
    luck: 72,
    asw: 176,
  },
  '듀이는 미서약 호감도 50 기준이며 ALtoy 사랑 100(6%) 화면과 조건을 혼동하지 않아야 합니다.',
)

console.log('shipDatabase tests passed')
