import assert from 'node:assert/strict'
import {
  buildEquipmentDirectStats,
  buildShipCombatData,
  buildStageRequirements,
} from './fleet-recommendation-sources.mjs'

const { ships, missing } = buildShipCombatData(
  [{ gid: 100, name: '테스트함', shipType: '전함' }],
  [{
    gid: 100,
    type: 5,
    base: {
      1001: { health: 100, firepower: 10 },
      1004: { health: 400, firepower: 40 },
    },
    growth: { 1004: { health: 1000, firepower: 500 } },
    enhance: { firepower: 20 },
    retrofit: { bonus: { firepower: 5 } },
    sp_weapon: { icon: '5000', name: '테스트 전용장비' },
    equip_1: [4],
    equip_2: [1],
  }],
  {
    5000: {
      id: 5000,
      name: '테스트 전용장비',
      attribute_1: 'cannon',
      value_1: 5,
      next: 5001,
    },
    5001: { id: 5001, value_1: 15, next: 0 },
  },
)
assert.equal(missing.length, 0)
assert.equal(ships['100'].base.health, 100)
assert.equal(ships['100'].maxBase.health, 400)
assert.deepEqual(ships['100'].equipSlots.slice(0, 2), [[4], [1]])
assert.deepEqual(ships['100'].augment.stats, { firepower: 15 })

const equipment = buildEquipmentDirectStats({
  1000: {
    id: 1000,
    name: '+10 장비',
    rarity: 5,
    type: 10,
    attribute_1: 'air',
    value_1: 10,
    part_main: [7],
  },
  1010: { id: 1010, base: 1000, value_1: 100 },
})
assert.deepEqual(equipment[0].stats, { aviation: 100 })

const stages = buildStageRequirements({
  1504: {
    id: 1504,
    map: 15,
    type: 1,
    chapter_name: '15–4',
    name: '새장 속의 학',
    air_dominance: 2820,
    best_air_dominance: 3665,
    avoid_require: 172,
    support_group_num: 1,
    submarine_num: 1,
  },
  9999: { id: 9999, map: 15, type: 1 },
})
assert.equal(stages.length, 1)
assert.equal(stages[0].supportFleetCount, 1)
assert.ok(stages[0].directRules.includes('지원 함대 1개'))

console.log('fleet recommendation sources: passed')
