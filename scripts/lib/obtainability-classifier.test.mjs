import assert from 'node:assert/strict'
import { classifyObtainability } from './obtainability-classifier.mjs'

const permanentBuild = classifyObtainability({ name: '상시 건조 함선', faction: '로열', obtain: ['이벤트：과거 이벤트'], permanentSignals: { build: true } })
assert.equal(permanentBuild.availability.key, 'permanent')
assert.equal(permanentBuild.difficulty.key, 'normal')
assert.equal(permanentBuild.primaryRoute.key, 'construction')
assert.equal(permanentBuild.primaryRoute.label, '상시 건조')

const permanentMap = classifyObtainability({ name: '해역 드랍 함선', faction: '유니온', obtain: ['이벤트：과거 이벤트'], mapDrops: [{ stage: '3-4' }], permanentSignals: { map: true } })
assert.equal(permanentMap.availability.key, 'permanent')
assert.equal(permanentMap.difficulty.key, 'easy')

const coreMonthly = classifyObtainability({ name: '코어 월간 함선', faction: '유니온', obtain: ['이벤트：과거 이벤트'], permanentSources: ['코어 월간 교환'], permanentSignals: { coreMonthly: true } })
assert.equal(coreMonthly.availability.key, 'permanent')
assert.equal(coreMonthly.difficulty.key, 'easy')
assert.equal(coreMonthly.primaryRoute.key, 'core-monthly')
assert.equal(coreMonthly.primaryRoute.certainty, 'guaranteed')

const highMap = classifyObtainability({ name: '고해역 드랍 함선', faction: '유니온', obtain: ['메인 스테이지 해역13-4'], mapDrops: [{ stage: '13-4' }], permanentSignals: { map: true } })
assert.equal(highMap.difficulty.key, 'hard')
assert.equal(highMap.primaryRoute.key, 'high-map-drop')
assert.equal(highMap.primaryRoute.label, '고해역 드롭')

const exchangeAndBuild = classifyObtainability({
  name: '복수 입수처 함선',
  faction: '유니온',
  obtain: ['코어 월간 교환', '소형함 상시 건조'],
  permanentSources: ['코어 월간 교환', '소형함 상시 건조'],
  permanentSignals: { coreMonthly: true, build: true },
})
assert.deepEqual(exchangeAndBuild.acquisitionRoutes.map(route => route.key), ['core-monthly', 'construction'])
assert.equal(exchangeAndBuild.primaryRoute.key, 'core-monthly', '확정 교환을 확률 건조보다 우선한다')

const rotatingExchange = classifyObtainability({
  name: '랜덤 상점 함선',
  faction: '유니온',
  obtain: ['훈장 교환(랜덤 출현)', '지원 신청(랜덤 출현)', '훈장 지원(확률적 출현)'],
  permanentSignals: { shop: true },
})
assert.equal(rotatingExchange.primaryRoute.key, 'rotating-exchange')
assert.equal(rotatingExchange.primaryRoute.certainty, 'rotation')

const activeEvent = classifyObtainability({ name: '셰르부르', faction: '아이리스', obtain: ['이벤트：환몽의 카발카드'], activeEvent: { name: '환몽의 카발카드', endsAt: '2026-07-23' } })
assert.deepEqual(activeEvent.availability, { key: 'active-event', label: '현재 이벤트', eventName: '환몽의 카발카드', endsAt: '2026-07-23' })

const rerunWait = classifyObtainability({ name: '과거 이벤트 함선', faction: '사르데냐', obtain: ['이벤트：과거 이벤트'] })
assert.equal(rerunWait.availability.key, 'rerun-wait')
assert.equal(rerunWait.availability.label, '복각 대기')

const collab = classifyObtainability({ name: '쿠온', faction: '칭송받는자', obtain: ['이벤트：저편에서의 만남'] })
assert.equal(collab.availability.key, 'collab-unknown')
assert.equal(collab.availability.label, '콜라보 복각 미정')
assert.ok(!JSON.stringify(collab).includes('CN'), 'KR 앱 데이터에 CN 전용 상태를 노출하지 않는다')

const activeCollab = classifyObtainability({
  name: '2B',
  faction: '니어',
  obtain: ['현재 이벤트: 자동 보병 인형의 여행'],
  activeEvent: { name: '자동 보병 인형의 여행', endsAt: '2026-08-13' },
})
assert.equal(activeCollab.availability.key, 'active-event')
assert.equal(activeCollab.difficulty.key, 'event')

const endedCollab = classifyObtainability({
  name: '2B',
  faction: '니어',
  obtain: ['이벤트: 자동 보병 인형의 여행'],
})
assert.equal(endedCollab.availability.key, 'collab-unknown')

for (const name of ['슈퍼브', '서리', '그리핀']) {
  const currentKrEvent = classifyObtainability({
    name,
    faction: '로열',
    obtain: ['이벤트: 괴담 실록: 백야 빌라에서 탈출하라!'],
    activeEvent: { name: '괴담 실록: 백야 빌라에서 탈출하라!', endsAt: '2026-08-20' },
  })
  assert.equal(currentKrEvent.availability.key, 'active-event')
  assert.equal(currentKrEvent.availability.endsAt, '2026-08-20')
}

console.log('obtainability-classifier tests passed')
