import assert from 'node:assert/strict'
import { classifyObtainability } from './obtainability-classifier.mjs'

const permanentBuild = classifyObtainability({ name: '상시 건조 함선', faction: '로열', obtain: ['이벤트：과거 이벤트'], permanentSignals: { build: true } })
assert.equal(permanentBuild.availability.key, 'permanent')
assert.equal(permanentBuild.difficulty.key, 'normal')

const permanentMap = classifyObtainability({ name: '해역 드랍 함선', faction: '유니온', obtain: ['이벤트：과거 이벤트'], mapDrops: [{ stage: '3-4' }], permanentSignals: { map: true } })
assert.equal(permanentMap.availability.key, 'permanent')
assert.equal(permanentMap.difficulty.key, 'easy')

const coreMonthly = classifyObtainability({ name: '코어 월간 함선', faction: '유니온', obtain: ['이벤트：과거 이벤트'], permanentSources: ['코어 월간 교환'], permanentSignals: { coreMonthly: true } })
assert.equal(coreMonthly.availability.key, 'permanent')
assert.equal(coreMonthly.difficulty.key, 'normal')

const activeEvent = classifyObtainability({ name: '셰르부르', faction: '아이리스', obtain: ['이벤트：환몽의 카발카드'], activeEvent: { name: '환몽의 카발카드', endsAt: '2026-07-23' } })
assert.deepEqual(activeEvent.availability, { key: 'active-event', label: '현재 이벤트', eventName: '환몽의 카발카드', endsAt: '2026-07-23' })

const rerunWait = classifyObtainability({ name: '과거 이벤트 함선', faction: '사르데냐', obtain: ['이벤트：과거 이벤트'] })
assert.equal(rerunWait.availability.key, 'rerun-wait')
assert.equal(rerunWait.availability.label, '복각 대기')

const collab = classifyObtainability({ name: '쿠온', faction: '칭송받는자', obtain: ['이벤트：저편에서의 만남'] })
assert.equal(collab.availability.key, 'collab-unknown')
assert.equal(collab.availability.label, '콜라보 복각 미정')
assert.ok(!JSON.stringify(collab).includes('CN'), 'KR 앱 데이터에 CN 전용 상태를 노출하지 않는다')

console.log('obtainability-classifier tests passed')
