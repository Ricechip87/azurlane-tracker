import assert from 'node:assert/strict'
import {
  MANUAL_UNAVAILABLE_GIDS,
  PREFER_ALTOY_GIDS,
  selectObtainSources,
} from './obtainability-sources.mjs'

assert.equal(PREFER_ALTOY_GIDS.size, 21)
assert.ok(PREFER_ALTOY_GIDS.has(40505), '비스마르크 Zwei must prefer current ALtoy obtainability')
assert.ok(PREFER_ALTOY_GIDS.has(970101), '헌터(META) must prefer the META shop source')

assert.deepEqual(selectObtainSources({
  gid: 40505,
  localKrObtain: ['한정 이벤트: 오엽각 교차점'],
  altoyObtain: ['이벤트: 오엽각 교차점', '상설 UR 함선 교환'],
}), ['이벤트: 오엽각 교차점', '상설 UR 함선 교환'])

assert.deepEqual(selectObtainSources({
  gid: 10102,
  localKrObtain: ['KR 입수처'],
  altoyObtain: ['ALtoy 입수처'],
}), ['KR 입수처'])

assert.ok(MANUAL_UNAVAILABLE_GIDS.has(10300010))
assert.deepEqual(selectObtainSources({
  gid: 10300010,
  localKrObtain: [],
  altoyObtain: ['이벤트：저편에서의 만남'],
}), ['입수 못함'])
