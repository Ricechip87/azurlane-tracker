import { useEffect, useState } from 'react'
import growthRecommendationsUrl from '../data/growthRecommendations.json?url'
import shipObtainabilityUrl from '../data/shipObtainability.json?url'
import { buildOperationTierByName } from '../utils/researchRecommendations.js'
import FleetTechPanel from './fleet-tech/FleetTechPanel.jsx'

export default function TechPointRecommendationPage({ characters }) {
  const [candidateRankingData, setCandidateRankingData] = useState(null)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadRankingData() {
      try {
        const [growthResponse, obtainabilityResponse] = await Promise.all([
          fetch(growthRecommendationsUrl),
          fetch(shipObtainabilityUrl),
        ])
        if (!growthResponse.ok) throw new Error(`growthRecommendations.json ${growthResponse.status}`)
        if (!obtainabilityResponse.ok) throw new Error(`shipObtainability.json ${obtainabilityResponse.status}`)

        const [growthData, obtainabilityData] = await Promise.all([
          growthResponse.json(),
          obtainabilityResponse.json(),
        ])
        if (ignore) return
        setCandidateRankingData({
          operationTierByName: buildOperationTierByName(growthData),
          obtainabilityByName: new Map((obtainabilityData.ships || []).map(ship => [ship.name, ship])),
        })
      } catch (error) {
        if (ignore) return
        setDataError(error instanceof Error ? error.message : '알 수 없는 오류')
      }
    }

    loadRankingData()
    return () => { ignore = true }
  }, [])

  return (
    <section className="space-y-3">
      <div className="border border-neutral-700 bg-[#242424] px-4 py-3 text-xs leading-5 text-gray-400">
        <span className="font-bold text-gray-200">추천 기준</span>
        <span className="ml-2">각 희귀도 그룹 안에서 보유 여부 → 남은 육성 단계 → 미보유함 입수 난이도 → 최신 대작전 추천 등급 → 획득 가능 기술점수 순으로 추천합니다.</span>
      </div>
      {dataError && (
        <div className="border border-rose-900 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
          육성 추천·입수 난이도 데이터를 불러오지 못해 기술점수 기본 정보만 표시합니다. ({dataError})
        </div>
      )}
      {!candidateRankingData && !dataError ? (
        <div className="flex min-h-[240px] items-center justify-center border border-neutral-700 bg-[#242424] text-sm text-gray-500">
          추천 기준 데이터를 불러오는 중입니다.
        </div>
      ) : (
        <div className="relative overflow-visible rounded border border-neutral-700 bg-[#242424]">
          <FleetTechPanel
            characters={characters}
            detailMode="inline"
            candidateRankingData={candidateRankingData}
          />
        </div>
      )}
    </section>
  )
}
