import assert from 'node:assert/strict'
import {
  parseResearchBlueprintLua,
  parseResearchTasksLua,
  parseShipDataGroupAllLua,
  parseShipDataGroupGidsLua,
} from './research-lua-sources.mjs'

const blueprint = `pg.base.ship_data_blueprint[29906] = {
  unlock_word = "로열 기술 Pt <color=#92fc63>700</color> 이상",
  is_pursuing = 0,
  blueprint_version = 9,
  id = 29906,
  unlock_task = {{60432, 0}, {60433, 1}, {60435, 2}}
}`
assert.deepEqual(parseResearchBlueprintLua(blueprint), [{
  id: 29906,
  blueprint_version: 9,
  unlock_word: '로열 기술 Pt <color=#92fc63>700</color> 이상',
  is_pursuing: 0,
  unlock_task: [[60432, 0], [60433, 1], [60435, 2]],
}])

const tasks = `_G.pg.base.task_data_template[60432] = {
  desc = [[로열 주력
경험치]],
  sub_type = 1041,
  id = 60432,
  target_num = 1000000,
  target_id = {{2, 4}, {2, 5}}
}`
assert.deepEqual(parseResearchTasksLua(tasks), {
  60432: {
    id: 60432,
    sub_type: 1041,
    target_num: 1000000,
    target_id: [[2, 4], [2, 5]],
    desc: '로열 주력\n경험치',
  },
})
assert.deepEqual(parseShipDataGroupAllLua('pg.ship_data_group.all = {1, 2, 29906}'), [1, 2, 29906])
assert.deepEqual(parseShipDataGroupGidsLua('group_type = 10152,\ngroup_type = 1010004,'), [10152, 1010004])

console.log('research Lua source tests passed')
