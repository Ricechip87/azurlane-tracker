import assert from 'node:assert/strict'
import {
  AFFECTION_OPTIONS,
  getAffectionMultiplier,
  getAffectionOptionLabel,
  isOathAffection,
  normalizeAffectionStatus,
} from './affection.js'

assert.deepEqual(AFFECTION_OPTIONS, [
  '기타',
  '호감 61+',
  '기쁨 81+',
  '사랑 100',
  '서약 100+',
  '서약 200',
])

assert.equal(normalizeAffectionStatus(undefined), '기타')
assert.equal(normalizeAffectionStatus('호감작 안함'), '기타')
assert.equal(normalizeAffectionStatus('호감작 중'), '호감 61+')
assert.equal(normalizeAffectionStatus('서약 완료'), '서약 100+')
assert.equal(normalizeAffectionStatus('호감도 Max'), '서약 200')
assert.equal(normalizeAffectionStatus('기쁨 81+ (3%)'), '기쁨 81+')

assert.equal(getAffectionMultiplier('기타'), 1)
assert.equal(getAffectionMultiplier('호감 61+'), 1.01)
assert.equal(getAffectionMultiplier('기쁨 81+'), 1.03)
assert.equal(getAffectionMultiplier('사랑 100'), 1.06)
assert.equal(getAffectionMultiplier('서약 100+'), 1.09)
assert.equal(getAffectionMultiplier('서약 200'), 1.12)
assert.equal(getAffectionMultiplier('서약 완료'), 1.09, '구 백업값도 새 보정으로 계산한다')

assert.equal(getAffectionOptionLabel('서약 200'), '서약 200 (12%)')
assert.equal(isOathAffection('서약 100+'), true)
assert.equal(isOathAffection('서약 200'), true)
assert.equal(isOathAffection('사랑 100'), false)

console.log('affection tests passed')
