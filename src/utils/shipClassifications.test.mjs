import assert from 'node:assert/strict'
import {
  getShipClassification,
  getShipPosition,
  matchesShipClassification,
  normalizeShipTypeValue,
  SHIP_CLASSIFICATION_OPTIONS,
} from './shipClassifications.js'

assert.deepEqual(SHIP_CLASSIFICATION_OPTIONS, [
  '전체',
  '전열',
  '후열',
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
assert.equal(getShipClassification('초순'), '중순')
assert.equal(getShipClassification('대형순'), '중순')
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

assert.equal(getShipPosition('구축'), '전열')
assert.equal(getShipPosition('대순'), '전열')
assert.equal(getShipPosition('운송함'), '전열')
assert.equal(getShipPosition('순전'), '후열')
assert.equal(getShipPosition('항모'), '후열')
assert.equal(getShipPosition('항전'), '후열')
assert.equal(getShipPosition('잠수'), '기타')
assert.equal(getShipPosition('잠수항모'), '기타')
assert.equal(getShipPosition('범선'), '기타')

assert.equal(matchesShipClassification('대순', '전열'), true)
assert.equal(matchesShipClassification('초순', '중순'), true)
assert.equal(matchesShipClassification('대형순', '중순'), true)
assert.equal(matchesShipClassification('항모', '후열'), true)
assert.equal(matchesShipClassification('잠수', '전열'), false)
assert.equal(matchesShipClassification('순전', '전함'), true)
