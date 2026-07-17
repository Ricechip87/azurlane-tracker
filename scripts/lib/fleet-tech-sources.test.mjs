import assert from 'node:assert/strict'
import {
  officialRecordToCharacterTech,
  parseFleetTechLua,
  selectFleetTechRecord,
} from './fleet-tech-sources.mjs'

const lua = `
pg.base.fleet_tech_ship_template = {
  [970112] = {
    max_star = 6,
    pt_level = 19,
    add_level_attr = 1,
    pt_upgrage = 26,
    add_get_attr = 2,
    add_level_value = 2,
    id = 970112,
    add_get_value = 1,
    pt_get = 13,
    add_get_shiptype = {
      1,
      20,
      21
    },
    add_level_shiptype = {
      1,
      20,
      21
    }
  }
}
pg.base.fleet_tech_ship_template[80106] = {
  pt_level = 20,
  add_level_attr = 9,
  pt_upgrage = 28,
  add_get_attr = 1,
  add_level_value = 1,
  id = 80106,
  add_get_value = 1,
  pt_get = 14,
  add_get_shiptype = {
    1,
    20,
    21
  },
  add_level_shiptype = {
    1,
    20,
    21
  }
}
`

const parsed = parseFleetTechLua(lua)
assert.deepEqual(parsed['970112'], {
  id: 970112,
  pt_get: 13,
  pt_upgrage: 26,
  pt_level: 19,
  add_get_shiptype: [1, 20, 21],
  add_get_attr: 2,
  add_get_value: 1,
  add_level_shiptype: [1, 20, 21],
  add_level_attr: 1,
  add_level_value: 2,
})
assert.deepEqual(parsed['80106'].add_level_shiptype, [1, 20, 21])
assert.equal(parsed['80106'].pt_get, 14)

const cn = { pt_get: 22 }
const kr = { pt_get: 21 }
const sheet = { pt_get: 20 }
assert.deepEqual(selectFleetTechRecord({ cn, kr, sheet }), { record: cn, source: 'cn-lua' })
assert.deepEqual(selectFleetTechRecord({ kr, sheet }), { record: kr, source: 'kr-json' })
assert.deepEqual(selectFleetTechRecord({ sheet }), { record: sheet, source: 'tech-sheet' })
assert.deepEqual(selectFleetTechRecord({}), { record: null, source: 'existing' })

const translated = officialRecordToCharacterTech({
  pt_get: 22,
  pt_upgrage: 44,
  pt_level: 32,
  add_get_shiptype: [3, 13, 18],
  add_get_attr: 2,
  add_get_value: 1,
  add_level_shiptype: [3, 13, 18],
  add_level_attr: 1,
  add_level_value: 2,
}, {
  statAcquired: { shipTypes: ['중순', '초순', '모니터'], stat: '화력', value: 1 },
  stat120: { shipTypes: ['중순', '초순', '모니터'], stat: '내구', value: 2 },
})
assert.deepEqual(translated.statAcquired.shipTypes, ['중순', '초순', '모니터'])
assert.deepEqual(translated.techPoints, { acquired: 22, maxLB: 44, lv120: 32 })
