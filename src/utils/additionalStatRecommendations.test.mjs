import assert from 'node:assert/strict'
import {
  ADDITIONAL_STATS,
  ADDITIONAL_STAT_SHIP_TYPES,
  buildAdditionalStatCandidates,
  getAdditionalStatPriority,
  getAvailableAdditionalShipTypes,
  resolveAdditionalStatSelection,
} from './additionalStatRecommendations.js'

assert.deepEqual(ADDITIONAL_STAT_SHIP_TYPES, [
  '순전', '전함', '항전', '모니터', '경항모', '항모',
  '구축', '경순', '중순', '대형순',
  '잠수', '잠항모',
])
assert.equal(getAdditionalStatPriority('구축', '뇌격'), 0)
assert.equal(getAdditionalStatPriority('구축', '회피'), 1)
assert.ok(getAdditionalStatPriority('구축', '대공') > getAdditionalStatPriority('구축', '명중'))
assert.equal(getAdditionalStatPriority('경순', '대공'), 0)
assert.equal(getAdditionalStatPriority('항전', '항공'), 1)
assert.equal(getAdditionalStatPriority('공작', '내구'), Number.POSITIVE_INFINITY)
assert.deepEqual(ADDITIONAL_STATS, ['뇌격', '대공', '화력', '항공', '장전', '명중', '회피'])
assert.deepEqual(getAvailableAdditionalShipTypes('항공'), ['항전', '경항모', '항모', '잠항모'])
assert.deepEqual(getAvailableAdditionalShipTypes('대공'), ['경순'])
assert.deepEqual(getAvailableAdditionalShipTypes(''), [])
assert.deepEqual(resolveAdditionalStatSelection('항공', '구축'), {
  stat: '항공',
  shipType: '항전',
  shipTypes: ['항전', '경항모', '항모', '잠항모'],
})
assert.deepEqual(resolveAdditionalStatSelection('대공', '경순'), {
  stat: '대공',
  shipType: '경순',
  shipTypes: ['경순'],
})
assert.deepEqual(resolveAdditionalStatSelection('기타', '공작'), {
  stat: '뇌격',
  shipType: '구축',
  shipTypes: ['구축', '경순', '중순', '대형순', '잠수', '잠항모'],
})
assert.deepEqual(resolveAdditionalStatSelection('뇌장', '잠수'), {
  stat: '뇌격',
  shipType: '잠수',
  shipTypes: ['구축', '경순', '중순', '대형순', '잠수', '잠항모'],
})

const candidates = buildAdditionalStatCandidates([
  {
    id: 1,
    name: '보유 모니터 전용',
    rarity: 'SSR',
    acquired: '100',
    statAcquired: { shipTypes: ['모니터'], stat: '화력', value: 1 },
    stat120: { shipTypes: ['모니터'], stat: '화력', value: 2 },
  },
  {
    id: 2,
    name: '미보유 중순 대형순 공용',
    rarity: 'SR',
    acquired: '미획득',
    statAcquired: { shipTypes: ['중순', '대형순', '모니터'], stat: '화력', value: 1 },
    stat120: { shipTypes: ['중순', '대형순', '모니터'], stat: '화력', value: 2 },
  },
  {
    id: 3,
    name: '완료 공용',
    rarity: 'SSR',
    acquired: '120',
    statAcquired: { shipTypes: ['중순', '대형순', '모니터'], stat: '화력', value: 1 },
    stat120: { shipTypes: ['중순', '대형순', '모니터'], stat: '화력', value: 2 },
  },
  {
    id: 4,
    name: '다른 스탯',
    rarity: 'SSR',
    acquired: '100',
    stat120: { shipTypes: ['모니터'], stat: '명중', value: 3 },
  },
], '모니터', '화력', {
  operationTierByName: new Map([
    ['보유 모니터 전용', 'SS'],
    ['미보유 중순 대형순 공용', 'A'],
  ]),
})

assert.deepEqual(candidates.map(candidate => candidate.name), ['미보유 중순 대형순 공용', '보유 모니터 전용'])
assert.equal(candidates[0].broadCoverage, true)
assert.equal(candidates[0].remainingGain, 3)
assert.equal(candidates[0].remainingSteps, 2)
assert.deepEqual(candidates[0].stages, {
  acquired: { applicable: true, completed: false, value: 1 },
  level120: { applicable: true, completed: false, value: 2 },
})
assert.deepEqual(candidates[0].targetShipTypes, ['중순', '대형순', '모니터'])
assert.equal(candidates[1].broadCoverage, false)
assert.equal(candidates[1].remainingGain, 2)
assert.equal(candidates[1].remainingSteps, 1)
assert.deepEqual(candidates[1].stages.acquired, { applicable: true, completed: true, value: 0 })

const partialMonitorCoverage = buildAdditionalStatCandidates([{
  id: 5,
  name: '중순 모니터 일부 공용',
  rarity: 'SSR',
  acquired: '100',
  stat120: { shipTypes: ['중순', '모니터'], stat: '화력', value: 2 },
}], '모니터', '화력')
assert.equal(partialMonitorCoverage[0].broadCoverage, false)

const aliasStatCandidates = buildAdditionalStatCandidates([{
  id: 6,
  name: '포격 별칭',
  rarity: 'SR',
  acquired: '100',
  stat120: { shipTypes: ['전함'], stat: '포격', value: 2 },
}], '전함', '화력')
assert.equal(aliasStatCandidates[0].remainingGain, 2)

const carrierCandidates = buildAdditionalStatCandidates([
  {
    id: 10,
    name: '경항모 전용',
    rarity: 'SSR',
    acquired: '100',
    stat120: { shipTypes: ['경항모'], stat: '항공', value: 3 },
  },
  {
    id: 11,
    name: '항모 공용',
    rarity: 'SR',
    acquired: '100',
    stat120: { shipTypes: ['경항모', '정규항모'], stat: '항공', value: 1 },
  },
], '경항모', '항공')
assert.deepEqual(carrierCandidates.map(candidate => candidate.name), ['항모 공용', '경항모 전용'])
