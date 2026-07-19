import assert from 'node:assert/strict'
import {
  calcFleetTechCandidates,
  FLEET_TECH_CANDIDATE_BASIS,
  splitFleetTechCandidates,
} from './fleetTechCandidates.js'

const candidates = calcFleetTechCandidates([
  {
    id: 1,
    name: 'SSR 100',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '100',
    techPoints: { acquired: 20, maxLB: 40, lv120: 30 },
  },
  {
    id: 2,
    name: 'UR acquired',
    rarity: 'UR',
    shipType: '전함',
    faction: 'HMS',
    acquired: '획득',
    techPoints: { acquired: 30, maxLB: 50, lv120: 30 },
  },
  {
    id: 3,
    name: 'SR bonus',
    rarity: 'SR',
    shipType: '잠수항모',
    faction: '로열',
    acquired: '100',
    techPoints: { acquired: 10, maxLB: 20, lv120: 100 },
  },
  {
    id: 4,
    name: 'N done',
    rarity: 'N',
    shipType: '구축',
    faction: '로열',
    acquired: '120',
    techPoints: { acquired: 10, maxLB: 20, lv120: 30 },
  },
  {
    id: 5,
    name: 'SSR missing',
    rarity: 'SSR',
    shipType: '운송함',
    faction: '로열',
    acquired: '미획득',
    techPoints: { acquired: 10, maxLB: 20, lv120: 30 },
  },
], '로열')

assert.deepEqual(candidates.map(candidate => candidate.name), [
  'SSR 100',
  'UR acquired',
  'SSR missing',
  'SR bonus',
])

assert.equal(candidates[0].remainingTechPoints, 30)
assert.equal(candidates[0].remainingSteps, 1)
assert.equal(candidates[0].position, '전열')
assert.deepEqual(candidates[0].stages, {
  acquired: { completed: true, value: 0 },
  maxLB: { completed: true, value: 0 },
  level120: { completed: false, value: 30 },
})

const split = splitFleetTechCandidates(candidates)
assert.deepEqual(split.map(group => group.title), ['UR / SSR', 'SR / R / N'])
assert.deepEqual(split[0].candidates.map(candidate => candidate.name), ['SSR 100', 'UR acquired', 'SSR missing'])
assert.deepEqual(split[1].candidates.map(candidate => candidate.name), ['SR bonus'])
assert.equal(split[0].candidates[0].position, '전열')
assert.equal(split[0].candidates[1].position, '후열')
assert.equal(split[1].candidates[0].position, '기타')

const maxLbCandidates = calcFleetTechCandidates([
  {
    id: 10,
    name: 'SSR missing maxlb',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '미획득',
    techPoints: { acquired: 20, maxLB: 40, lv120: 300 },
  },
  {
    id: 11,
    name: 'SSR acquired maxlb',
    rarity: 'SSR',
    shipType: '전함',
    faction: '로열',
    acquired: '획득',
    techPoints: { acquired: 20, maxLB: 50, lv120: 10 },
  },
  {
    id: 12,
    name: 'SSR full limit break',
    rarity: 'SSR',
    shipType: '전함',
    faction: '로열',
    acquired: '풀돌',
    techPoints: { acquired: 20, maxLB: 50, lv120: 400 },
  },
], '로열', { basis: 'maxLB' })

assert.deepEqual(maxLbCandidates.map(candidate => candidate.name), [
  'SSR acquired maxlb',
  'SSR missing maxlb',
])
assert.equal(maxLbCandidates[0].remainingTechPoints, 50)
assert.equal(maxLbCandidates[0].remainingSteps, 1)
assert.deepEqual(maxLbCandidates[0].stages, {
  acquired: { completed: true, value: 0 },
  maxLB: { completed: false, value: 50 },
  level120: { completed: true, value: 0 },
})

const maxLbGroupedCandidates = calcFleetTechCandidates([
  {
    id: 20,
    name: 'UR expensive',
    rarity: 'UR',
    shipType: '전함',
    faction: '로열',
    acquired: '획득',
    techPoints: { acquired: 20, maxLB: 200, lv120: 300 },
  },
  {
    id: 21,
    name: 'SSR practical',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '획득',
    techPoints: { acquired: 20, maxLB: 40, lv120: 300 },
  },
  {
    id: 22,
    name: 'SR practical',
    rarity: 'SR',
    shipType: '구축',
    faction: '로열',
    acquired: '획득',
    techPoints: { acquired: 20, maxLB: 30, lv120: 300 },
  },
  {
    id: 23,
    name: 'R low',
    rarity: 'R',
    shipType: '구축',
    faction: '로열',
    acquired: '획득',
    techPoints: { acquired: 20, maxLB: 25, lv120: 300 },
  },
  {
    id: 24,
    name: 'SSR submarine',
    rarity: 'SSR',
    shipType: '잠수',
    faction: '로열',
    acquired: '획득',
    techPoints: { acquired: 20, maxLB: 100, lv120: 300 },
  },
], '로열', { basis: FLEET_TECH_CANDIDATE_BASIS.MAX_LB })

assert.equal(maxLbGroupedCandidates.some(candidate => candidate.name === 'SSR submarine'), false)
const maxLbSplit = splitFleetTechCandidates(maxLbGroupedCandidates, FLEET_TECH_CANDIDATE_BASIS.MAX_LB)
assert.deepEqual(maxLbSplit.map(group => group.title), ['SSR / SR', 'UR', 'R / N'])
assert.deepEqual(maxLbSplit.map(group => group.candidates.map(candidate => candidate.name)), [
  ['SSR practical', 'SR practical'],
  ['UR expensive'],
  ['R low'],
])

const blendedCandidates = calcFleetTechCandidates([
  {
    id: 30,
    name: '보유 고평가 저득점',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '100',
    techPoints: { acquired: 10, maxLB: 20, lv120: 20 },
  },
  {
    id: 31,
    name: '보유 저평가 고득점',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '100',
    techPoints: { acquired: 10, maxLB: 20, lv120: 100 },
  },
  {
    id: 32,
    name: '미보유 쉬움',
    rarity: 'SSR',
    shipType: '전함',
    faction: '로열',
    acquired: '미획득',
    techPoints: { acquired: 20, maxLB: 30, lv120: 40 },
  },
  {
    id: 33,
    name: '미보유 어려움 고평가',
    rarity: 'SSR',
    shipType: '전함',
    faction: '로열',
    acquired: '미획득',
    techPoints: { acquired: 50, maxLB: 60, lv120: 70 },
  },
], '로열', {
  operationTierByName: new Map([
    ['보유 고평가 저득점', 'SS'],
    ['보유 저평가 고득점', 'A'],
    ['미보유 쉬움', 'A'],
    ['미보유 어려움 고평가', 'SS'],
  ]),
  obtainabilityByName: new Map([
    ['미보유 쉬움', {
      availability: { key: 'permanent', label: '상시 획득' },
      primaryRoute: { label: '상점 확정 교환', rank: 0 },
      difficulty: { key: 'easy', label: '쉬움' },
    }],
    ['미보유 어려움 고평가', {
      availability: { key: 'rerun-wait', label: '복각 대기' },
      difficulty: { key: 'limited', label: '한정' },
    }],
  ]),
})

assert.deepEqual(blendedCandidates.map(candidate => candidate.name), [
  '보유 고평가 저득점',
  '보유 저평가 고득점',
  '미보유 쉬움',
  '미보유 어려움 고평가',
])
assert.deepEqual(blendedCandidates[0].recommendationReasons, ['보유', '120만 남음', '대작전 SS', '+20점'])
assert.deepEqual(blendedCandidates[2].recommendationReasons, ['상점 확정 교환', '대작전 A', '+90점'])

const lowerTierCandidates = calcFleetTechCandidates([
  {
    id: 40,
    name: '대작전 C+ 함선',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '100',
    techPoints: { lv120: 10 },
  },
  {
    id: 41,
    name: '대작전 미평가 함선',
    rarity: 'SSR',
    shipType: '경순',
    faction: '로열',
    acquired: '100',
    techPoints: { lv120: 10 },
  },
], '로열', {
  operationTierByName: new Map([['대작전 C+ 함선', 'C+']]),
})
assert.deepEqual(lowerTierCandidates.map(candidate => candidate.name), ['대작전 C+ 함선', '대작전 미평가 함선'])
