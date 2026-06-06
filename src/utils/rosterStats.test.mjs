import assert from 'node:assert/strict'
import { calcStatsByShipType, mergeStatsByShipType, summarizeRoster } from './rosterStats.js'

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

assert.deepEqual(
  calcStatsByShipType([
    {
      acquired: '획득',
      statAcquired: { shipTypes: ['경항모', '정규항모'], stat: '내구', value: 2 },
    },
    {
      acquired: '120',
      statAcquired: { shipTypes: ['정규항모'], stat: '항공', value: 1 },
      stat120: { shipTypes: ['정규항모'], stat: '대공', value: 1 },
    },
  ], 'acquired'),
  {
    경항모: { 내구: 2 },
    항모: { 내구: 2, 항공: 1 },
  }
)

assert.deepEqual(
  calcStatsByShipType([
    {
      acquired: '획득',
      statAcquired: { shipTypes: ['경항모', '정규항모'], stat: '대잠', value: 1 },
    },
  ], 'acquired'),
  {
    경항모: { 대잠: 1 },
  }
)

assert.deepEqual(
  mergeStatsByShipType(
    { 순전: { 내구: 176, 화력: 79 } },
    { 순전: { 내구: 55, 화력: 20 }, 전함: { 대공: 10 } },
  ),
  {
    순전: { 내구: 231, 화력: 99 },
    전함: { 대공: 10 },
  }
)

assert.deepEqual(
  calcStatsByShipType([
    {
      acquired: '획득',
      statAcquired: { shipTypes: ['초순', '대순'], stat: '화력', value: 1 },
    },
    {
      acquired: '획득',
      statAcquired: { shipTypes: ['잠수항모', '잠순'], stat: '대잠', value: 2 },
    },
    {
      acquired: '획득',
      statAcquired: { shipTypes: ['운송함', '보급'], stat: '내구', value: 3 },
    },
  ], 'acquired'),
  {
    대형순: { 화력: 1 },
    잠항모: { 대잠: 2 },
    운송: { 내구: 3 },
  }
)
