import assert from 'node:assert/strict'
import { calcStatsByShipType, summarizeRoster } from './rosterStats.js'

const roster = [
  {
    acquired: '미획득',
    affection: '서약 완료',
    statAcquired: { shipTypes: ['전함'], stat: '화력', value: 99 },
    stat120: { shipTypes: ['전함'], stat: '화력', value: 99 },
  },
  {
    acquired: '획득',
    affection: '호감작 안함',
    statAcquired: { shipTypes: ['전함'], stat: '화력', value: 1 },
    stat120: { shipTypes: ['전함'], stat: '화력', value: 10 },
  },
  {
    acquired: '100',
    affection: '서약 완료',
    statAcquired: { shipTypes: ['전함'], stat: '화력', value: 2 },
    stat120: { shipTypes: ['전함'], stat: '화력', value: 20 },
  },
  {
    acquired: '120',
    affection: '서약 완료',
    statAcquired: { shipTypes: ['전함'], stat: '화력', value: 3 },
    stat120: { shipTypes: ['전함'], stat: '화력', value: 30 },
  },
  {
    acquired: '125',
    affection: '호감도 Max',
    statAcquired: { shipTypes: ['전함'], stat: '화력', value: 4 },
    stat120: { shipTypes: ['전함'], stat: '화력', value: 40 },
  },
]

assert.deepEqual(summarizeRoster(roster), {
  total: 5,
  acquired: 4,
  collectionRate: '80.0',
  level120: 2,
  level125: 1,
  oath: 2,
})

assert.deepEqual(calcStatsByShipType(roster, 'acquired'), {
  전함: { 화력: 10 },
})

assert.deepEqual(calcStatsByShipType(roster, '120'), {
  전함: { 화력: 70 },
})
