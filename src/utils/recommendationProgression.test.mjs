import assert from 'node:assert/strict'
import { buildAdditionalStatCandidates } from './additionalStatRecommendations.js'
import { calcFleetTechCandidates } from './fleetTechCandidates.js'
import { buildGrowthRecommendationSections } from './growthRecommendations.js'
import { buildResearchRecommendationState } from './researchRecommendations.js'

const recommendationData = {
  recommendations: [{
    source: 'main',
    name: '진행 상태 검증함',
    tier: 'SS',
    shipType: '구축',
    sheetGroup: '전열',
  }],
}
const researchShips = [{
  id: 'progress-test',
  name: '진행 상태 검증함',
  generation: 1,
  planRarity: 'PR',
  unlockRequirements: [],
}]

function character(acquired) {
  return {
    id: 'progress-test',
    name: '진행 상태 검증함',
    faction: '로열',
    shipType: '구축',
    rarity: 'SSR',
    acquired,
    techPoints: { acquired: 10, maxLB: 20, lv120: 30 },
    statAcquired: { shipTypes: ['구축'], stat: '뇌격', value: 1 },
    stat120: { shipTypes: ['구축'], stat: '뇌격', value: 2 },
  }
}

function growthNames(roster) {
  return new Set(
    buildGrowthRecommendationSections('main', roster, recommendationData, new Map())
      .flatMap(section => section.cards)
      .map(card => card.name),
  )
}

const level100Roster = [character('100')]
assert.equal(growthNames(level100Roster).has('진행 상태 검증함'), true)
assert.deepEqual(
  buildResearchRecommendationState(researchShips, level100Roster).completed.map(item => item.name),
  ['진행 상태 검증함'],
)
assert.equal(calcFleetTechCandidates(level100Roster, '로열')[0].remainingTechPoints, 30)
assert.equal(buildAdditionalStatCandidates(level100Roster, '구축', '뇌격')[0].remainingGain, 2)

const level120Roster = [character('120')]
assert.equal(growthNames(level120Roster).has('진행 상태 검증함'), true)
assert.equal(calcFleetTechCandidates(level120Roster, '로열').length, 0)
assert.equal(buildAdditionalStatCandidates(level120Roster, '구축', '뇌격').length, 0)

const level125Roster = [character('125')]
assert.equal(growthNames(level125Roster).has('진행 상태 검증함'), false)
assert.deepEqual(
  buildResearchRecommendationState(researchShips, level125Roster).completed.map(item => item.name),
  ['진행 상태 검증함'],
)
