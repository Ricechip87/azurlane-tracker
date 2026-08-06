import assert from 'node:assert/strict'
import { buildOperationTierByName, buildRecommendationRankingData, operationTierRank } from './recommendationRanking.js'

assert.equal(operationTierRank('SS+'), 0)
assert.equal(operationTierRank('SS'), 1)
assert.equal(operationTierRank('C+'), 8)
assert.equal(operationTierRank('미평가'), 9)
assert.equal(operationTierRank(null), 9)

assert.deepEqual(
  [...buildOperationTierByName({
    recommendations: [
      { source: 'main', name: '테스트 함선', tier: 'SS+' },
      { source: 'operation-siren', name: '테스트 함선', tier: 'A' },
      { source: 'operation-siren', name: '중복 함선', tier: 'B' },
      { source: 'operation-siren', name: '중복 함선', tier: 'S' },
    ],
  })],
  [['테스트 함선', 'A'], ['중복 함선', 'S']],
)

const rankingData = buildRecommendationRankingData(
  { recommendations: [{ source: 'operation-siren', name: '테스트 함선', tier: 'S' }] },
  [{ id: 1, gid: 1001, name: '테스트 함선' }],
)
assert.equal(rankingData.operationTierByName.get('테스트 함선'), 'S')
assert.equal(rankingData.obtainabilityByName.get({ gid: 1001 })?.name, '테스트 함선')
