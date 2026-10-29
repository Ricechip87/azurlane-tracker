import assert from 'node:assert/strict'
import { deferPendingShopSignals } from './permanent-shop-sources.mjs'

{
  const signals = Object.freeze({ arenaShop: true, shop: true, other: true, timeline: true, build: false, map: false, archive: false, coreMonthly: false })
  assert.equal(deferPendingShopSignals(signals, null), signals, '기존 상점은 변경하지 않는다')
  assert.ok(Object.values(deferPendingShopSignals(signals, { gid: 960011 })).every(value => value === false), '공식 예고는 선행 상점 및 timeline 신호를 현재 입수로 만들지 않는다')
  assert.equal(deferPendingShopSignals({ ...signals, build: true }, { gid: 960011 }).build, true, '독립적으로 확인된 건조 경로는 유지한다')
}
import { buildArenaShopGids, timelineFallbackSource } from './permanent-shop-sources.mjs'
import { resolveOfficialPermanentShop } from './permanent-shop-sources.mjs'
import officialShops from '../data/kr-permanent-shops.json' with { type: 'json' }
import { classifyObtainability } from './obtainability-classifier.mjs'

const kimberly = officialShops.ships.find(row => row.gid === 970104)
assert.equal(kimberly.effectiveAt, '2026-10-08')
assert.equal(resolveOfficialPermanentShop({ gid: 970104, shops: officialShops.ships, today: '2026-10-07' }), null)
for (const today of ['2026-10-08', '2026-10-14', '2026-12-08']) {
  const resolved = resolveOfficialPermanentShop({ gid: 970104, shops: officialShops.ships, today })
  assert.equal(resolved, kimberly, '월드 투어 종료일은 상시 이전 상점의 종료일이 아니다')
  const classified = classifyObtainability({ faction: 'META', obtain: resolved.obtain, permanentSources: ['이벤트: 월드 투어'], permanentSignals: { shop: true } })
  assert.equal(classified.availability.key, 'permanent', '오래된 월드 투어 원본보다 공식 상점 입수가 우선')
  assert.equal(classified.primaryRoute.key, 'special-exchange')
}
assert.equal(resolveOfficialPermanentShop({ gid: 970113, shops: officialShops.ships, today: '2026-10-14' }), null, '다른 월드 투어 META를 상시화하지 않는다')

const arenaData = {
  1: { commodity_list_1: [[43037, 300]], commodity_list_2: [[43042, 300]] },
}
const shopData = {
  43037: { id: 43037, genre: 'arena_shop', type: 4, effect_args: [201331] },
  43042: { id: 43042, genre: 'arena_shop', type: 4, effect_args: [401241] },
  99999: { id: 99999, genre: 'arena_shop', type: 4, effect_args: [9600061] },
}

assert.deepEqual([...buildArenaShopGids(arenaData, shopData)], [20133, 40124], '현재 연습 상점 목록에 든 함선만 추출')
assert.equal(timelineFallbackSource({ source: null, date: '2023-05-18' }), 'KR 상시편입 확인 (2023-05-18, 세부 입수처 미확인)')
assert.equal(timelineFallbackSource({ source: '연습 상점(랜덤 출현)', date: '2025-10-30' }), '연습 상점(랜덤 출현) (2025-10-30 상시편입)')

console.log('permanent shop source tests passed')
