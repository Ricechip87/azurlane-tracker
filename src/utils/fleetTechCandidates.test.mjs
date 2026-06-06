import assert from 'node:assert/strict'
import { calcFleetTechCandidates, splitFleetTechCandidates } from './fleetTechCandidates.js'

const candidates = calcFleetTechCandidates([
  {
    id: 1,
    name: 'SSR 100',
    rarity: 'SSR',
    faction: '로열',
    acquired: '100',
    techPoints: { acquired: 20, maxLB: 40, lv120: 30 },
  },
  {
    id: 2,
    name: 'UR acquired',
    rarity: 'UR',
    faction: 'HMS',
    acquired: '획득',
    techPoints: { acquired: 30, maxLB: 50, lv120: 30 },
  },
  {
    id: 3,
    name: 'SR efficient',
    rarity: 'SR',
    faction: '로열',
    acquired: '100',
    techPoints: { acquired: 10, maxLB: 20, lv120: 100 },
  },
  {
    id: 4,
    name: 'N done',
    rarity: 'N',
    faction: '로열',
    acquired: '120',
    techPoints: { acquired: 10, maxLB: 20, lv120: 30 },
  },
  {
    id: 5,
    name: 'SSR missing',
    rarity: 'SSR',
    faction: '로열',
    acquired: '미획득',
    techPoints: { acquired: 10, maxLB: 20, lv120: 30 },
  },
], '로열')

assert.deepEqual(candidates.map(candidate => candidate.name), [
  'UR acquired',
  'SSR 100',
  'SSR missing',
  'SR efficient',
])

assert.equal(candidates[1].remainingTechPoints, 30)
assert.equal(candidates[1].remainingSteps, 1)
assert.equal(candidates[1].efficiency, 30)
assert.deepEqual(candidates[1].stages, {
  acquired: { completed: true, value: 0 },
  maxLB: { completed: true, value: 0 },
  level120: { completed: false, value: 30 },
})

const split = splitFleetTechCandidates(candidates)
assert.deepEqual(split.high.map(candidate => candidate.name), ['UR acquired', 'SSR 100', 'SSR missing'])
assert.deepEqual(split.low.map(candidate => candidate.name), ['SR efficient'])
