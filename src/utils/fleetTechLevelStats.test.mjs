import assert from 'node:assert/strict'
import { calcFleetTechLevelStats, findCurrentLevel } from './fleetTechLevelStats.js'

assert.equal(findCurrentLevel([{ level: 1, pt: 300 }, { level: 2, pt: 600 }], 299), null)
assert.deepEqual(findCurrentLevel([{ level: 1, pt: 300 }, { level: 2, pt: 600 }], 600), { level: 2, pt: 600 })

const levelStats = calcFleetTechLevelStats({
  유니온: 5937,
  로열: 4332,
  중앵: 5651,
  철혈: 6229,
})

assert.deepEqual(levelStats.순전, {
  대공: 10,
  명중: 13,
  화력: 20,
  회피: 10,
  내구: 55,
})

assert.deepEqual(levelStats.전함, {
  대공: 10,
  명중: 13,
  화력: 17,
  내구: 55,
})
