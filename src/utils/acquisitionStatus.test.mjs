import assert from 'node:assert/strict'
import {
  ACQUISITION_STATUSES,
  isAcquiredStatus,
  isLevel100Status,
  isLevel120Status,
  isLevel125Status,
  normalizeAcquisitionStatus,
} from './acquisitionStatus.js'
import { calcTechPoints } from './techPoints.js'

assert.deepEqual(ACQUISITION_STATUSES, ['미획득', '획득', '풀돌', '100', '120', '125'])

assert.equal(normalizeAcquisitionStatus(), '미획득')
assert.equal(normalizeAcquisitionStatus('육성중'), '100')
assert.equal(normalizeAcquisitionStatus('육성 완료'), '120')
assert.equal(normalizeAcquisitionStatus('???'), '미획득')

assert.equal(isAcquiredStatus('미획득'), false)
assert.equal(isAcquiredStatus('획득'), true)
assert.equal(isAcquiredStatus('풀돌'), true)
assert.equal(isAcquiredStatus('100'), true)
assert.equal(isLevel100Status('풀돌'), false)
assert.equal(isLevel100Status('100'), true)
assert.equal(isLevel100Status('120'), true)
assert.equal(isLevel120Status('풀돌'), false)
assert.equal(isLevel120Status('100'), false)
assert.equal(isLevel120Status('120'), true)
assert.equal(isLevel120Status('125'), true)
assert.equal(isLevel125Status('120'), false)
assert.equal(isLevel125Status('125'), true)

const techPoints = { acquired: 3, maxLB: 7, lv120: 5 }
assert.equal(calcTechPoints({ acquired: '미획득', techPoints }), 0)
assert.equal(calcTechPoints({ acquired: '획득', techPoints }), 3)
assert.equal(calcTechPoints({ acquired: '풀돌', techPoints }), 10)
assert.equal(calcTechPoints({ acquired: '100', techPoints }), 10)
assert.equal(calcTechPoints({ acquired: '120', techPoints }), 15)
assert.equal(calcTechPoints({ acquired: '125', techPoints }), 15)
assert.equal(calcTechPoints({ acquired: '육성중', techPoints }), 10)
assert.equal(calcTechPoints({ acquired: '육성 완료', techPoints }), 15)
