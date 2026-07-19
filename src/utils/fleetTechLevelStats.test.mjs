import assert from 'node:assert/strict'
import {
  calcFleetTechLevels,
  calcFleetTechLevelStats,
  calcFleetTechProgress,
  findCurrentLevel,
  findNextLevel,
  summarizeFleetTechLevelEffects,
} from './fleetTechLevelStats.js'

assert.equal(findCurrentLevel([{ level: 1, pt: 300 }, { level: 2, pt: 600 }], 299), null)
assert.deepEqual(findCurrentLevel([{ level: 1, pt: 300 }, { level: 2, pt: 600 }], 600), { level: 2, pt: 600 })
assert.deepEqual(findNextLevel([{ level: 1, pt: 300 }, { level: 2, pt: 600 }], 299), { level: 1, pt: 300 })
assert.deepEqual(findNextLevel([{ level: 1, pt: 300 }, { level: 2, pt: 600 }], 600), null)

assert.deepEqual(summarizeFleetTechLevelEffects({ bonuses: [
  { shipType: '구축', stat: '대공', value: 2 },
  { shipType: '구축', stat: '대공', value: 2 },
  { shipType: '초순', stat: '화력', value: 1 },
]}), [
  { shipType: '구축', stat: '대공', value: 2 },
  { shipType: '대형순', stat: '화력', value: 1 },
])

const levelStats = calcFleetTechLevelStats({
  유니온: 5937,
  로열: 4332,
  중앵: 5651,
  철혈: 6229,
})

const levels = calcFleetTechLevels({
  유니온: 5937,
  로열: 4332,
  중앵: 5651,
  철혈: 6229,
})

assert.equal(levels.유니온.level, 9)
assert.equal(levels.로열.level, 9)
assert.equal(levels.중앵.level, 9)
assert.equal(levels.철혈.level, 9)

const progress = calcFleetTechProgress({
  유니온: 299,
  로열: 4332,
  중앵: 5651,
  철혈: 6229,
})

assert.equal(progress.유니온.currentLevel, null)
assert.equal(progress.유니온.nextLevel.level, 1)
assert.equal(progress.유니온.pointsToNext, 1)
assert.equal(progress.로열.currentLevel.level, 9)
assert.equal(progress.로열.nextLevel, null)
assert.equal(progress.로열.pointsToNext, 0)
assert.equal(progress.로열.isMaxLevel, true)

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
