import assert from 'node:assert/strict'
import { getAvailability, getObtainabilitySourceSections, isCurrentlyObtainable, isGrowthRecommendationEligible, isResearchCandidateActionable, obtainabilityLabel } from './obtainability.js'

const permanentEasy = { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'easy', label: '쉬움' } }
const permanentNormal = { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'normal', label: '보통' } }
const activeEvent = { availability: { key: 'active-event', label: '현재 이벤트' }, difficulty: { key: 'event', label: '이벤트' } }
const rerunWait = { availability: { key: 'rerun-wait', label: '복각 대기' }, difficulty: { key: 'limited', label: '현재 획득 불가' } }
const collab = { availability: { key: 'collab-unknown', label: '콜라보 복각 미정' }, difficulty: { key: 'limited', label: '현재 획득 불가' } }

assert.equal(isCurrentlyObtainable(permanentEasy), true)
assert.equal(isCurrentlyObtainable(activeEvent), true)
assert.equal(isCurrentlyObtainable(rerunWait), false)
assert.equal(isCurrentlyObtainable(collab), false)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level120: false, obtainability: permanentEasy }), true)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level120: false, obtainability: permanentNormal }), false)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level120: false, obtainability: activeEvent }), true)
assert.equal(isGrowthRecommendationEligible({ acquired: false, level120: false, obtainability: rerunWait }), false)
assert.equal(isGrowthRecommendationEligible({ acquired: true, level120: false, obtainability: rerunWait }), true)
assert.equal(isGrowthRecommendationEligible({ acquired: true, level120: true, obtainability: permanentEasy }), false)
assert.equal(isResearchCandidateActionable({ acquired: false, obtainability: permanentNormal }), true)
assert.equal(isResearchCandidateActionable({ acquired: false, obtainability: activeEvent }), true)
assert.equal(isResearchCandidateActionable({ acquired: false, obtainability: rerunWait }), false)
assert.equal(isResearchCandidateActionable({ acquired: true, obtainability: collab }), true)
assert.equal(obtainabilityLabel(permanentEasy), '상시 획득')
assert.deepEqual(getObtainabilitySourceSections({
  ...permanentEasy,
  obtain: ['코어 월간 교환'],
  historicalObtain: ['이벤트：특별훈련'],
}), [
  { label: '현재 입수처', sources: ['코어 월간 교환'] },
  { label: '과거 이벤트 입수처', sources: ['이벤트：특별훈련'] },
])
assert.equal(getAvailability({ difficulty: { key: 'limited' } }).key, 'rerun-wait', '기존 JSON도 안전하게 해석한다')

console.log('obtainability tests passed')
