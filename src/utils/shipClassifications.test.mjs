import assert from 'node:assert/strict'
import {
  getShipClassification,
  normalizeShipTypeValue,
  SHIP_CLASSIFICATION_OPTIONS,
} from './shipClassifications.js'

assert.deepEqual(SHIP_CLASSIFICATION_OPTIONS, [
  '전체',
  '구축',
  '경순',
  '중순',
  '전함',
  '항모',
  '공작',
  '잠수',
  '기타',
])

assert.equal(getShipClassification('구축'), '구축')
assert.equal(getShipClassification('경순'), '경순')
assert.equal(getShipClassification('중순'), '중순')
assert.equal(getShipClassification('대순'), '중순')
assert.equal(getShipClassification('전함'), '전함')
assert.equal(getShipClassification('순전'), '전함')
assert.equal(getShipClassification('경항모'), '항모')
assert.equal(getShipClassification('항모'), '항모')
assert.equal(getShipClassification('공작함'), '공작')
assert.equal(getShipClassification('잠수'), '잠수')
assert.equal(getShipClassification('잠수항모'), '잠수')
assert.equal(getShipClassification('모니터'), '기타')
assert.equal(getShipClassification('운송함'), '기타')
assert.equal(getShipClassification('범선'), '기타')
assert.equal(getShipClassification('항전'), '기타')

assert.equal(normalizeShipTypeValue('공작'), '공작함')
assert.equal(normalizeShipTypeValue('대순'), '대순')
assert.equal(getShipClassification('공작'), '공작')
