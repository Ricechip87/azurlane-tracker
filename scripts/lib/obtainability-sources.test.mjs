import assert from 'node:assert/strict'
import {
  PREFER_ALTOY_GIDS,
  selectObtainSources,
  resolveOfficialConstruction,
} from './obtainability-sources.mjs'
import { classifyObtainability } from './obtainability-classifier.mjs'
import officialConstruction from '../data/kr-permanent-construction.json' with { type: 'json' }

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

assert.deepEqual(selectObtainSources({
  gid: 10300010,
  localKrObtain: [],
  altoyObtain: ['이벤트：저편에서의 만남'],
}), ['이벤트：저편에서의 만남'])

const officialOverride = {
  gid: 40406,
  name: '알비트',
  effectiveAt: '2026-09-10',
  pool: 'heavy',
  source: 'https://cafe.naver.com/azurlanekorea/574296',
}
const staleLite = Object.freeze({ gid: 40406, light: false, heavy: false, special: false, limited: true, timer: '04:35:00' })
const beforePermanent = resolveOfficialConstruction({ gid: 40406, lite: staleLite, overrides: [officialOverride], today: '2026-09-09' })
assert.equal(beforePermanent.override, null, '시행일 이전에는 공식 상시화 예고를 현재 입수처로 사용하지 않는다')
assert.equal(beforePermanent.lite, staleLite, '미적용 원본 유지')
const permanent = resolveOfficialConstruction({ gid: 40406, lite: staleLite, overrides: [officialOverride], today: '2026-09-10' })
assert.deepEqual(permanent.lite, { ...staleLite, heavy: true, limited: false }, '공식 완료 공지의 정확한 건조 풀과 한정 종료를 반영')
assert.equal(permanent.override, officialOverride, '공식 보정 근거를 원본 검증 상태와 별도로 보존')
assert.equal(staleLite.heavy, false, '원본 객체를 덮어쓰지 않는다')
assert.equal(resolveOfficialConstruction({ gid: 40143, lite: staleLite, overrides: [officialOverride], today: '2026-09-11' }).override, null, '공지에 없는 함선은 추정하지 않는다')
const classification = classifyObtainability({
  faction: '철혈',
  obtain: ['중형함 상시 건조'],
  permanentSignals: { build: permanent.lite.heavy },
})
assert.equal(classification.availability.key, 'permanent')
assert.equal(classification.primaryRoute.key, 'construction')
assert.equal(classification.difficulty.key, 'normal')

assert.deepEqual(officialConstruction.ships.map(({ gid, name, pool }) => ({ gid, name, pool })), [
  { gid: 40406, name: '알비트', pool: 'heavy' },
  { gid: 40147, name: 'Z47', pool: 'light' },
  { gid: 40813, name: 'U-31', pool: 'special' },
], '9월 10일 KR 공지가 확정한 상시 건조 3척과 건조 풀만 보정')
for (const override of officialConstruction.ships) {
  assert.equal(override.effectiveAt, '2026-09-10')
  assert.equal(override.source, 'https://cafe.naver.com/azurlanekorea/574296')
  const resolved = resolveOfficialConstruction({ gid: override.gid, lite: {}, overrides: officialConstruction.ships, today: '2026-09-11' })
  assert.equal(resolved.lite[override.pool], true)
  assert.equal(resolved.lite.limited, false)
  assert.equal(resolved.override.name, override.name)
}
