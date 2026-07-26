export const OPERATION_TIER_ORDER = ['SS+', 'SS', 'S+', 'S', 'A+', 'A', 'B+', 'B', 'C+']

export function operationTierRank(tier) {
  const index = OPERATION_TIER_ORDER.indexOf(tier)
  return index < 0 ? OPERATION_TIER_ORDER.length : index
}

export function buildOperationTierByName(growthRecommendationData) {
  const result = new Map()

  for (const recommendation of growthRecommendationData?.recommendations || []) {
    if (recommendation.source !== 'operation-siren' || !recommendation.name || !recommendation.tier) continue
    const previous = result.get(recommendation.name)
    if (!previous || operationTierRank(recommendation.tier) < operationTierRank(previous)) {
      result.set(recommendation.name, recommendation.tier)
    }
  }

  return result
}
