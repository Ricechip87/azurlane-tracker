import assert from 'node:assert/strict'
import {
  mergeMissingSourceRecords,
  parseKrAugmentStatsLua,
  parseKrMetaSkillsLua,
  parseKrEquipmentStatsLua,
  validateKrEquipmentFallbacks,
  validateKrAugmentFallbacks,
} from './kr-combat-lua-sources.mjs'
import { buildEquipmentDirectStats, buildShipCombatData } from './fleet-recommendation-sources.mjs'

const augmentLua = `
_G.pg.base.spweapon_data_statistics[15580] = {
  id = 15580, next = 15581, attribute_1 = "air", attribute_2 = "reload",
  name = "name with } and \\"quoted\\" braces", value_1 = 20, value_2 = 5,
  skill_upgrade = {{0, 1013070}},
}
_G.pg.base.spweapon_data_statistics[15581] = {
  id = 15581, next = 0, base = 15580, value_1 = 30, value_2 = 15,
}
`
const augment = parseKrAugmentStatsLua(augmentLua)
assert.deepEqual(augment['15580'], {
  id: 15580, next: 15581, value_1: 20, value_2: 5,
  attribute_1: 'air', attribute_2: 'reload',
})
assert.deepEqual(augment['15581'], { id: 15581, next: 0, base: 15580, value_1: 30, value_2: 15 })

const jsonExisting = { id: 10000, value_1: 99, attribute_1: 'cannon' }
const merged = mergeMissingSourceRecords({ 10000: jsonExisting }, { 10000: { id: 10000, value_1: 1 }, ...augment })
assert.equal(merged.records['10000'], jsonExisting, '기존 JSON 레코드를 Lua로 덮어쓰지 않습니다.')
assert.deepEqual(merged.addedIds, ['15580', '15581'])
assert.deepEqual(mergeMissingSourceRecords(merged.records, augment).addedIds, [], '같은 fallback을 반복해도 변화가 없습니다.')

const combat = buildShipCombatData(
  [{ gid: 10711, name: '인트레피드', shipType: '항모' }],
  [{ gid: 10711, sp_weapon: { icon: '15580', name: '인트레피드 파워' } }],
  merged.records,
)
assert.deepEqual(combat.ships['10711'].augment, {
  id: 15580, name: '인트레피드 파워', stats: { aviation: 30, reload: 15 },
}, 'JSON 사본에 없는 특수장비도 Lua의 강화 연결과 직접 수치로 계산합니다.')

const metaLua = `
pg.base.ship_strengthen_meta[970710] = {
  id = 970710, award_display = {{4, 9707101, 1}},
  buff_list = {802370, 802380, 802390, 802402},
  buff_list_task = {802370, 802380, 802390},
}
`
assert.deepEqual(parseKrMetaSkillsLua(metaLua), {
  970710: { id: 970710, buff_list_task: [802370, 802380, 802390] },
}, 'META 표시 대상은 육성 스킬 목록이며 섬멸 패시브와 보상 항목을 섞지 않습니다.')
assert.throws(() => parseKrAugmentStatsLua('not a Lua source'), /assignments not found/)
assert.throws(() => parseKrMetaSkillsLua('pg.base.ship_strengthen_meta[1] = {'), /Unclosed Lua table/)
assert.throws(() => parseKrMetaSkillsLua('pg.base.ship_strengthen_meta[1] = { id = 1 }'), /buff_list_task/)

assert.throws(() => parseKrAugmentStatsLua(`
  _G.pg.base.spweapon_data_statistics[1] = { value_1 = 20 + 10 }
`), /value_1/, '지원하지 않는 숫자 표현식의 앞부분을 값으로 사용하지 않습니다.')
assert.deepEqual(parseKrAugmentStatsLua(`
  _G.pg.base.spweapon_data_statistics[1] = {
    name = "value_1 = 999, attribute_1 = cannon",
    nested = { next = 999, value_2 = 999 },
    value_1 = 30, attribute_1 = "air",
  }
`), { 1: { id: 1, value_1: 30, attribute_1: 'air' } }, '문자열과 중첩 테이블 안의 텍스트를 최상위 필드로 오인하지 않습니다.')
assert.throws(() => parseKrMetaSkillsLua(`
  pg.base.ship_strengthen_meta[1] = { buff_list_task = {123 456} }
`), /buff_list_task/, '숫자 목록의 쉼표 누락을 거부합니다.')
assert.throws(() => parseKrMetaSkillsLua(`
  pg.base.ship_strengthen_meta[1] = { nested = { buff_list_task = {123} } }
`), /buff_list_task/, 'META 육성 스킬 목록은 최상위 필드여야 합니다.')
assert.throws(() => parseKrAugmentStatsLua(`
  _G.pg.base.spweapon_data_statistics[1] = { attribute_1 = "air" .. "invalid" }
`), /attribute_1/, '문자열 필드도 전체 리터럴을 검사합니다.')
assert.throws(() => parseKrAugmentStatsLua(`
  _G.pg.base.spweapon_data_statistics[1] = { value_1 = 30, value_1 = 99 }
`), /Duplicate/, '필수 데이터 필드의 중복 선언을 거부합니다.')

const augmentShips = [{ gid: 10711, sp_weapon: { icon: '15580', attribute_1: 'air', attribute_2: 'reload' } }]
assert.doesNotThrow(() => validateKrAugmentFallbacks(augmentShips, augment, ['15580', '15581']))
assert.throws(() => validateKrAugmentFallbacks(augmentShips, { 15580: augment['15580'] }, ['15580']), /chain/, '다음 강화 단계 누락 시 +0 능력치로 조용히 대체하지 않습니다.')
assert.throws(() => validateKrAugmentFallbacks(augmentShips, { 15580: { id: 15580 } }, ['15580']), /attribute|value/, '필수 직접 능력치가 없는 부분 레코드를 거부합니다.')
assert.throws(() => validateKrAugmentFallbacks(augmentShips, { 15580: { ...augment['15580'], next: 0, attribute_2: undefined } }, ['15580']), /attribute_2/, 'ALtoy가 명시한 두 번째 능력치도 빠지면 거부합니다.')
assert.throws(() => validateKrAugmentFallbacks(augmentShips, { 15580: { ...augment['15580'], value_1: undefined } }, ['15580']), /value_1/, '기본 직접 능력치 값이 누락되면 거부합니다.')
assert.throws(() => validateKrAugmentFallbacks(augmentShips, { ...augment, 15581: { ...augment['15581'], next: 15580 } }, ['15580', '15581']), /chain/, '순환하는 강화 연결은 정상 종료로 취급하지 않습니다.')
assert.throws(() => validateKrAugmentFallbacks(augmentShips, { ...augment, 15581: { ...augment['15581'], next: undefined } }, ['15580', '15581']), /chain/, '마지막 단계에는 명시적인 종료 값이 있어야 합니다.')
assert.throws(() => validateKrAugmentFallbacks(augmentShips, {}, []), /missing/, '최신 ALtoy 전용장비의 최초 레코드 누락도 차단합니다.')
assert.doesNotThrow(() => validateKrAugmentFallbacks(augmentShips, { 15580: { id: 15580 } }, []), '이번 Lua fallback을 쓰지 않는 기존 JSON 정책은 변경하지 않습니다.')

console.log('KR combat Lua fallback tests passed')

const equipmentLua = `
pg.base.equip_data_statistics[22320] = {
  id = 22320, name = "152mm 연장포 MK.XXVI", icon = "22300", type = 2, rarity = 6,
  part_main = {2}, attribute_2 = "cannon", value_2 = 55,
  attribute_3 = "antiaircraft", value_3 = 10,
  nested = { value_1 = 999 }, descrip = "name = not a field",
}
pg.base.equip_data_statistics[22330] = { id = 22330, base = 22320, damage = "34 x 2" }
pg.base.equip_data_statistics[99900] = { id = 99900, name = "미확인 장비", rarity = 6 }
`
const equipmentFallback = parseKrEquipmentStatsLua(equipmentLua, [22320])
assert.deepEqual(Object.keys(equipmentFallback), ['22320', '22330'], '공식 확인한 장비 기본형과 +10만 읽는다')
assert.doesNotThrow(() => validateKrEquipmentFallbacks(equipmentFallback, ['22320', '22330'], [22320]))
assert.deepEqual(buildEquipmentDirectStats(equipmentFallback), [{
  id: 22320, name: '152mm 연장포 MK.XXVI', icon: '22300', type: 2,
  rarity: 6, shipTypes: [2], stats: { firepower: 55, antiair: 10 },
}], '신규 UR 주포의 +10 직접 수치는 기본형을 상속한다')
const existingEquipment = { id: 22320, name: '기존 JSON', value_2: 99 }
assert.equal(mergeMissingSourceRecords({ 22320: existingEquipment }, equipmentFallback).records[22320], existingEquipment)
assert.throws(() => parseKrEquipmentStatsLua(equipmentLua.replace('value_2 = 55', 'value_2 = 55 + 1'), [22320]), /value_2/)
assert.throws(() => parseKrEquipmentStatsLua(equipmentLua.replace('part_main = {2}', 'part_main = {2 5}'), [22320]), /part_main/)
assert.throws(() => parseKrEquipmentStatsLua(equipmentLua.replace('id = 22320,', 'id = 99999,'), [22320]), /id/)
assert.throws(() => parseKrEquipmentStatsLua(equipmentLua.replace('icon = "22300"', 'icon = "22300" .. "suffix"'), [22320]), /icon/)
assert.throws(() => parseKrEquipmentStatsLua(equipmentLua.replace('value_2 = 55', 'value_2 = 55, value_2 = 99'), [22320]), /Duplicate/)
assert.equal(equipmentFallback[22320].value_1, undefined, '중첩 테이블의 능력치를 읽지 않는다')
assert.throws(() => validateKrEquipmentFallbacks({ 22320: equipmentFallback[22320] }, ['22320'], [22320]), /level 10/)
assert.throws(() => validateKrEquipmentFallbacks({ ...equipmentFallback, 22330: { id: 22330, base: 22300 } }, ['22330'], [22320]), /level 10/)
assert.throws(() => validateKrEquipmentFallbacks({ ...equipmentFallback, 22320: { ...equipmentFallback[22320], value_2: undefined } }, ['22320'], [22320]), /value_2/)
assert.throws(() => validateKrEquipmentFallbacks({}, [], [22320]), /missing/)
console.log('KR equipment Lua fallback tests passed')
