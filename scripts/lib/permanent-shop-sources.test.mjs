import assert from 'node:assert/strict'
import { buildArenaShopGids, timelineFallbackSource } from './permanent-shop-sources.mjs'

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
