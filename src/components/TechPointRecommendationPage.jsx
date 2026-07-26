import { useMemo } from 'react'
import growthRecommendationData from '../data/growthRecommendations.json'
import shipObtainabilityData from '../data/shipObtainability.json'
import { buildOperationTierByName } from '../utils/researchRecommendations.js'
import { createShipObtainabilityLookup } from '../utils/shipObtainabilityLookup.js'
import FleetTechPanel from './fleet-tech/FleetTechPanel.jsx'

export default function TechPointRecommendationPage({ characters }) {
  const candidateRankingData = useMemo(() => ({
    operationTierByName: buildOperationTierByName(growthRecommendationData),
    obtainabilityByName: createShipObtainabilityLookup(shipObtainabilityData.ships),
  }), [])

  return (
    <section className="space-y-3">
      <div className="border border-neutral-700 bg-[#242424] px-4 py-3 text-xs leading-5 text-gray-400">
        <span className="font-bold text-gray-200">추천 기준</span>
        <span className="ml-2">각 그룹 안에서 보유 여부 → 남은 육성 단계 → 미보유함 입수 난이도 → 최신 대작전 추천 등급 → 획득 가능 기술점수 순으로 추천합니다. 잠수함 계열은 일반 함선과 경쟁시키지 않고 맨 마지막 별도 항목으로 분리합니다.</span>
      </div>
      <div className="relative overflow-visible rounded border border-neutral-700 bg-[#242424]">
        <FleetTechPanel
          characters={characters}
          detailMode="inline"
          candidateRankingData={candidateRankingData}
        />
      </div>
    </section>
  )
}
