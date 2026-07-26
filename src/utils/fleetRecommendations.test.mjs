import assert from 'node:assert/strict'
import {
  buildFleetRecommendation,
  calculateShipStats,
  getAffinityMultiplier,
  getShipProgress,
  withSafetyMargin,
} from './fleetRecommendations.js'

const source = {
  base: { health: 100, firepower: 10, aviation: 0, antiair: 20, evasion: 10 },
  maxBase: { health: 400, firepower: 40, aviation: 0, antiair: 80, evasion: 20 },
  growth: { health: 1000, firepower: 1000, aviation: 0, antiair: 500, evasion: 200 },
  enhance: { health: 50, firepower: 20 },
  retrofit: { firepower: 5 },
  research: false,
}

assert.equal(getAffinityMultiplier('호감작 안함'), 1)
assert.equal(getAffinityMultiplier('서약 완료'), 1.06)
assert.equal(getAffinityMultiplier('호감도 Max'), 1.12)
assert.deepEqual(getShipProgress({ acquired: '풀돌' }), {
  level: 70,
  maxLimitBreak: true,
  fullEnhance: true,
  developmentLevel: null,
})
assert.equal(getShipProgress({ acquired: '120' }).level, 120)
assert.equal(getShipProgress({ acquired: '풀돌' }, true).developmentLevel, 1)
assert.equal(getShipProgress({ acquired: '100' }, true).developmentLevel, 30)
assert.equal(withSafetyMargin(172), 190)

const level70 = calculateShipStats(source, {
  acquired: '풀돌',
  affection: '서약 완료',
  remodeled: '개장',
})
assert.equal(level70.health, Math.floor((400 + (1000 * 69 / 1000) + 50) * 1.06))
assert.equal(level70.firepower, Math.floor((40 + (1000 * 69 / 1000) + 20 + 5) * 1.06))

const researchSource = { ...source, research: true }
const researchBelow100 = calculateShipStats(researchSource, {
  acquired: '풀돌',
  affection: '호감도 Max',
})
assert.equal(researchBelow100.firepower, Math.floor((40 + (1000 * 69 / 1000)) * 1.12))
const researchAt100 = calculateShipStats(researchSource, {
  acquired: '100',
  affection: '호감도 Max',
})
assert.equal(researchAt100.firepower, Math.floor((40 + (1000 * 99 / 1000) + 20) * 1.12))

const shipData = Object.fromEntries([
  ...makeShips('rear', 12, '항모'),
  ...makeShips('front', 12, '구축'),
  ...makeShips('sub', 4, '잠수'),
])
const characters = Object.entries(shipData).map(([gid, data]) => ({
  id: Number(gid),
  gid: Number(gid),
  name: data.name,
  shipType: data.shipType,
  rarity: 'SSR',
  acquired: '125',
  affection: '호감도 Max',
}))
const result = buildFleetRecommendation({
  characters,
  shipData,
  stage: {
    id: 1504,
    chapter: 15,
    airDominance: 2820,
    bestAirDominance: 3665,
    avoidRequirement: 172,
    supportFleetCount: 1,
    submarineFleetCount: 1,
  },
  rosterMode: 'current',
  battleMode: 'first-clear',
  equipmentProfile: 'standard',
})

assert.equal(result.fleets.mob.rear.length, 3)
assert.equal(result.fleets.mob.front.length, 3)
assert.equal(result.fleets.boss.rear.length, 3)
assert.equal(result.fleets.boss.front.length, 3)
assert.equal(result.fleets.support.length, 3)
assert.equal(result.fleets.submarine.length, 3)
const used = [
  ...result.fleets.mob.rear,
  ...result.fleets.mob.front,
  ...result.fleets.boss.rear,
  ...result.fleets.boss.front,
  ...result.fleets.support,
  ...result.fleets.submarine,
].map(ship => ship.gid)
assert.equal(new Set(used).size, used.length)
assert.equal(result.requirements.safeAvoid, 190)

console.log('fleetRecommendations: passed')

function makeShips(prefix, count, shipType) {
  return Array.from({ length: count }, (_, index) => {
    const gid = (prefix === 'rear' ? 1000 : prefix === 'front' ? 2000 : 3000) + index
    return [String(gid), {
      ...source,
      name: `${prefix}-${index}`,
      shipType,
      research: false,
      equipSlots: [[10], [10], [10], [10], [10]],
    }]
  })
}
