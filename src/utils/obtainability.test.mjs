import assert from 'node:assert/strict'
import { getAvailability, getObtainabilitySourceSections, getPrimaryAcquisitionRoute, isCurrentlyObtainable, isGrowthRecommendationEligible, isResearchCandidateActionable, obtainabilityLabel, obtainabilityRank } from './obtainability.js'
import { isKstDateAfter, toKstDateKey } from './kstDate.js'

assert.equal(toKstDateKey(new Date('2026-08-13T14:59:59Z')), '2026-08-13')
assert.equal(toKstDateKey(new Date('2026-08-13T15:00:00Z')), '2026-08-14')
assert.equal(isKstDateAfter('2026-08-13', new Date('2026-08-13T14:59:59Z')), false)
assert.equal(isKstDateAfter('2026-08-13', new Date('2026-08-13T15:00:00Z')), true)

const permanentEasy = { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'easy', label: '쉬움' } }
const permanentNormal = { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'normal', label: '보통' } }
const activeEvent = { availability: { key: 'active-event', label: '현재 이벤트' }, difficulty: { key: 'event', label: '이벤트' } }
const rerunWait = { availability: { key: 'rerun-wait', label: '복각 대기' }, difficulty: { key: 'limited', label: '현재 획득 불가' } }
const collab = { availability: { key: 'collab-unknown', label: '콜라보 복각 미정' }, difficulty: { key: 'limited', label: '현재 획득 불가' } }

assert.equal(isCurrentlyObtainable(permanentEasy), true)
assert.equal(isCurrentlyObtainable(activeEvent), true)
assert.equal(isCurrentlyObtainable(rerunWait), false)
assert.equal(isCurrentlyObtainable(collab), false)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level125: false, obtainability: permanentEasy }), true)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level125: false, obtainability: permanentNormal }), false)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level125: false, obtainability: activeEvent }), true)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level125: false, obtainability: rerunWait }), false)
assert.equal(isGrowthRecommendationEligible({ acquired: true, level125: false, obtainability: rerunWait }), true)
assert.equal(isGrowthRecommendationEligible({ acquired: true, level125: true, obtainability: permanentEasy }), false)
assert.equal(isResearchCandidateActionable({ acquired: false, obtainability: permanentNormal }), true)
assert.equal(isResearchCandidateActionable({ acquired: false, obtainability: activeEvent }), true)
assert.equal(isResearchCandidateActionable({ acquired: false, obtainability: rerunWait }), false)
assert.equal(isResearchCandidateActionable({ acquired: true, obtainability: collab }), true)
assert.equal(obtainabilityLabel(permanentEasy), '상시 획득')
const mixedPermanent = {
  ...permanentEasy,
  acquisitionRoutes: [
    { key: 'core-monthly', label: '코어 월간 교환', certainty: 'guaranteed', rank: 0, sources: ['코어 월간 교환'] },
    { key: 'construction', label: '상시 건조', certainty: 'random', rank: 2, sources: ['소형함 상시 건조'] },
  ],
  primaryRoute: { key: 'core-monthly', label: '코어 월간 교환', certainty: 'guaranteed', rank: 0, sources: ['코어 월간 교환'] },
}
assert.equal(obtainabilityLabel(mixedPermanent), '상시 획득 · 코어 월간 교환')
assert.equal(getPrimaryAcquisitionRoute(mixedPermanent).key, 'core-monthly')
assert.equal(obtainabilityRank(mixedPermanent), 0)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level125: false, obtainability: mixedPermanent }), true, '확정 교환 후보는 미보유 육성 추천에 포함')
assert.deepEqual(getObtainabilitySourceSections(mixedPermanent), [
  { label: '코어 월간 교환 · 확정', sources: ['코어 월간 교환'] },
  { label: '상시 건조 · 확률', sources: ['소형함 상시 건조'] },
])
const highMapPermanent = {
  availability: { key: 'permanent', label: '상시 획득' },
  difficulty: { key: 'hard', label: '어려움' },
  primaryRoute: { key: 'high-map-drop', label: '고해역 드롭', certainty: 'random', rank: 3, sources: ['메인 스테이지 해역13-4'] },
}
assert.equal(isGrowthRecommendationEligible({ acquired: false, level125: false, obtainability: highMapPermanent }), false, '고해역 드롭 미보유함은 육성 추천에서 후순위 제외')
assert.equal(obtainabilityLabel(highMapPermanent), '상시 획득 · 고해역 드롭')
assert.deepEqual(getObtainabilitySourceSections({
  ...permanentEasy,
  obtain: ['코어 월간 교환'],
  historicalObtain: ['이벤트：특별훈련'],
}), [
  { label: '현재 입수처', sources: ['코어 월간 교환'] },
  { label: '과거 이벤트 입수처', sources: ['이벤트：특별훈련'] },
])
assert.equal(getAvailability({ difficulty: { key: 'limited' } }).key, 'rerun-wait', '기존 JSON도 안전하게 해석한다')

const activeNierEvent = {
  faction: '니어',
  availability: {
    key: 'active-event',
    label: '현재 이벤트',
    eventName: '자동 보병 인형의 여행',
    endsAt: '2026-08-13',
  },
  obtain: ['현재 이벤트: 자동 보병 인형의 여행 (2026-08-13까지)'],
  historicalObtain: ['이벤트: 자동 보병 인형의 여행'],
}
assert.equal(
  getAvailability(activeNierEvent, new Date('2026-08-13T12:00:00+09:00')).key,
  'active-event',
  '종료 당일까지는 현재 이벤트로 본다',
)
assert.deepEqual(
  getAvailability(activeNierEvent, new Date('2026-08-14T00:00:00+09:00')),
  { key: 'collab-unknown', label: '콜라보 복각 미정' },
  '종료 다음 날부터 콜라보 함선은 자동으로 복각 미정 처리한다',
)
assert.deepEqual(
  getObtainabilitySourceSections({
    ...activeNierEvent,
    availability: { ...activeNierEvent.availability, endsAt: '2020-01-01' },
  }),
  [{ label: '과거 이벤트 입수처', sources: ['이벤트: 자동 보병 인형의 여행'] }],
  '종료된 이벤트는 현재 이벤트 문구 대신 과거 입수처를 표시한다',
)
assert.equal(
  getPrimaryAcquisitionRoute({
    ...activeNierEvent,
    availability: { ...activeNierEvent.availability, endsAt: '2020-01-01' },
    primaryRoute: { key: 'active-event', label: '현재 이벤트', rank: 1 },
  }),
  null,
  '종료된 이벤트의 대표 입수처를 현재 이벤트로 남기지 않는다',
)

console.log('obtainability tests passed')
