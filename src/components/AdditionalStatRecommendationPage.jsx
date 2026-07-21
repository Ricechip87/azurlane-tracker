import { useEffect, useMemo, useState } from 'react'
import growthRecommendationsUrl from '../data/growthRecommendations.json?url'
import shipObtainabilityUrl from '../data/shipObtainability.json?url'
import {
  ADDITIONAL_STAT_SHIP_TYPES,
  buildAdditionalStatCandidates,
  getAdditionalStatLabel,
  getAdditionalStatPriorities,
  getAvailableAdditionalStats,
} from '../utils/additionalStatRecommendations.js'
import { calcMajorFactionTechPoints } from '../utils/fleetTech.js'
import { calcFleetTechLevelStats } from '../utils/fleetTechLevelStats.js'
import { getObtainabilitySourceSections, obtainabilityLabel } from '../utils/obtainability.js'
import { buildOperationTierByName } from '../utils/researchRecommendations.js'
import { calcStatsByShipType, mergeStatsByShipType } from '../utils/rosterStats.js'
import { RecommendationDetails, RecommendationDialog } from './recommendations/RecommendationDialog.jsx'

const RARITY_COLOR = { UR: 'text-red-300', SSR: 'text-yellow-300', SR: 'text-purple-400', R: 'text-blue-300', N: 'text-gray-400' }

export default function AdditionalStatRecommendationPage({ characters }) {
  const [shipType, setShipType] = useState('구축')
  const [stat, setStat] = useState('뇌격')
  const [rankingData, setRankingData] = useState(null)
  const [dataError, setDataError] = useState('')
  const [openCandidate, setOpenCandidate] = useState(null)
  const stats = useMemo(() => getAvailableAdditionalStats(shipType, characters), [shipType, characters])
  const explicitStats = useMemo(() => new Set(getAdditionalStatPriorities(shipType)), [shipType])
  const selectedStat = stats.includes(stat) ? stat : stats[0] || ''

  useEffect(() => {
    let ignore = false

    Promise.all([fetch(growthRecommendationsUrl), fetch(shipObtainabilityUrl)])
      .then(async ([growthResponse, obtainabilityResponse]) => {
        if (!growthResponse.ok) throw new Error(`growthRecommendations.json ${growthResponse.status}`)
        if (!obtainabilityResponse.ok) throw new Error(`shipObtainability.json ${obtainabilityResponse.status}`)
        return Promise.all([growthResponse.json(), obtainabilityResponse.json()])
      })
      .then(([growthData, obtainabilityData]) => {
        if (ignore) return
        setRankingData({
          operationTierByName: buildOperationTierByName(growthData),
          obtainabilityByName: new Map((obtainabilityData.ships || []).map(ship => [ship.name, ship])),
        })
        setDataError('')
      })
      .catch(error => {
        if (ignore) return
        setRankingData({})
        setDataError(error instanceof Error ? error.message : '알 수 없는 오류')
      })

    return () => { ignore = true }
  }, [])

  const shipStats = useMemo(() => mergeStatsByShipType(
    calcStatsByShipType(characters, 'acquired'),
    calcStatsByShipType(characters, '120'),
  ), [characters])
  const factionLevelStats = useMemo(() => (
    calcFleetTechLevelStats(calcMajorFactionTechPoints(characters))
  ), [characters])
  const shipStatValue = shipStats[shipType]?.[selectedStat] || 0
  const factionLevelValue = factionLevelStats[shipType]?.[selectedStat] || 0
  const candidates = useMemo(() => buildAdditionalStatCandidates(
    characters,
    shipType,
    selectedStat,
    rankingData || {},
  ), [characters, rankingData, selectedStat, shipType])

  return (
    <section className="space-y-3">
      <div className="border border-neutral-700 bg-[#242424] px-4 py-3 text-xs leading-5 text-gray-400">
        <span className="font-bold text-gray-200">추천 기준</span>
        <span className="ml-2">함종별 지정 스탯 우선순위를 사용합니다. 후보는 공용 적용 범위 → 보유 여부 → 남은 단계 → 입수 난이도 → 대작전 등급 → 증가량 순으로 정렬합니다.</span>
      </div>

      {dataError && (
        <div className="border border-amber-800/70 bg-amber-950/25 px-4 py-3 text-xs text-amber-200">
          대작전·입수 난이도 데이터를 불러오지 못해 기본 후보 순서로 표시합니다. ({dataError})
        </div>
      )}

      <section className="border border-neutral-700 bg-[#202020]">
        <div className="border-b border-neutral-700 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-100">1. 강화할 함종 선택</h2>
          <p className="mt-1 text-xs text-gray-500">공작·운송·범선은 추천 대상에서 제외했습니다.</p>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {ADDITIONAL_STAT_SHIP_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setShipType(type)}
              className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${shipType === type ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-neutral-700 bg-[#202020]">
        <div className="border-b border-neutral-700 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-100">2. 스탯 선택</h2>
          <p className="mt-1 text-xs text-gray-500">왼쪽부터 지정 우선순위이며, 나머지 스탯은 뒤에 표시합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {stats.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStat(item)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${selectedStat === item ? 'border-amber-500 bg-amber-950/50 text-amber-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              <span className="mr-1 font-black text-gray-500">{explicitStats.has(item) ? index + 1 : '기타'}</span>
              {getAdditionalStatLabel(item)}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatSummary label="현재 합계" value={shipStatValue + factionLevelValue} tone="text-cyan-300" />
        <StatSummary label="함선 획득·120" value={shipStatValue} tone="text-blue-300" />
        <StatSummary label="진영 기술 LV" value={factionLevelValue} tone="text-purple-300" />
      </div>

      <section className="border border-neutral-700 bg-[#202020]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-700 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-gray-100">3. {shipType} {getAdditionalStatLabel(selectedStat)} 후보</h2>
            <p className="mt-1 text-xs text-gray-500">아직 얻지 않은 획득 보너스와 120 보너스만 계산합니다.</p>
          </div>
          <span className="text-xs font-bold text-cyan-300">{candidates.length}명</span>
        </div>
        <CandidateTable candidates={candidates} onOpen={setOpenCandidate} />
      </section>

      {openCandidate && (
        <CandidatePopup candidate={openCandidate} onClose={() => setOpenCandidate(null)} />
      )}
    </section>
  )
}

function StatSummary({ label, value, tone }) {
  return (
    <div className="border border-neutral-700 bg-[#202020] px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-black ${tone}`}>+{value}</div>
    </div>
  )
}

function CandidateTable({ candidates, onOpen }) {
  if (!candidates.length) {
    return <div className="flex min-h-[180px] items-center justify-center px-4 py-8 text-sm text-gray-600">현재 남아 있는 후보가 없습니다.</div>
  }

  return (
    <div className="max-h-[620px] overflow-auto">
      <table className="w-full min-w-[820px] table-fixed text-xs">
        <thead className="sticky top-0 z-10 bg-[#292929] text-gray-500">
          <tr>
            <th className="w-[28%] px-3 py-2 text-left font-normal">함선</th>
            <th className="w-[8%] px-2 py-2 text-center font-normal">등급</th>
            <th className="w-[11%] px-2 py-2 text-center font-normal">현재 상태</th>
            <th className="w-[20%] px-2 py-2 text-left font-normal">적용 함종</th>
            <th className="w-[9%] px-2 py-2 text-center font-normal">획득</th>
            <th className="w-[9%] px-2 py-2 text-center font-normal">120</th>
            <th className="w-[15%] px-2 py-2 text-center font-normal">총 증가량</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {candidates.map(candidate => (
            <tr key={candidate.id} className="cursor-pointer hover:bg-[#2a2a2a]" onClick={() => onOpen(candidate)}>
              <td className="px-3 py-2">
                <div className="truncate font-semibold text-gray-200">{candidate.name}</div>
                <div className="mt-0.5 truncate text-[10px] text-gray-500">{candidate.operationTier ? `대작전 ${candidate.operationTier}` : '대작전 미평가'} · {obtainabilityLabel(candidate.obtainability)}</div>
              </td>
              <td className={`px-2 py-2 text-center font-bold ${RARITY_COLOR[candidate.rarity] || 'text-gray-400'}`}>{candidate.rarity}</td>
              <td className="px-2 py-2 text-center text-gray-400">{candidate.status}</td>
              <td className="px-2 py-2 text-gray-400">
                {candidate.targetShipTypes.join(' · ')}
                {candidate.broadCoverage && <span className="ml-2 rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">공용 우선</span>}
              </td>
              <StageCell stage={candidate.stages.acquired} />
              <StageCell stage={candidate.stages.level120} />
              <td className="px-2 py-2 text-center font-black text-amber-300">+{candidate.remainingGain}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StageCell({ stage }) {
  return (
    <td className="px-2 py-2 text-center">
      {!stage.applicable ? <span className="text-gray-700">-</span> : stage.completed ? <span className="text-gray-600">완료</span> : <span className="text-blue-300">+{stage.value}</span>}
    </td>
  )
}

function CandidatePopup({ candidate, onClose }) {
  const cardArtUrl = getCardArtUrl(candidate)
  const reason = candidate.broadCoverage
    ? `${candidate.targetShipTypes.join('·')}에 함께 적용되는 공용 보너스라 우선 배치했습니다.`
    : `${candidate.selectedShipType} ${getAdditionalStatLabel(candidate.selectedStat)}을(를) 앞으로 +${candidate.remainingGain} 얻을 수 있습니다.`

  return (
    <RecommendationDialog name={candidate.name} onClose={onClose}>
      <div className="flex items-start gap-4 pr-6">
        <div className="h-24 w-24 flex-none overflow-hidden rounded border border-neutral-600 bg-[#181818]">
          {cardArtUrl ? <img src={cardArtUrl} alt="" className="h-full w-full object-cover object-top" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
            <span className="rounded bg-neutral-900 px-2 py-1">{candidate.rarity}</span>
            <span className="rounded bg-neutral-900 px-2 py-1">{candidate.status}</span>
            <span className="rounded bg-neutral-900 px-2 py-1">{candidate.operationTier ? `대작전 ${candidate.operationTier}` : '대작전 미평가'}</span>
          </div>
          <h3 className="mt-3 truncate text-lg font-black text-white">{candidate.name}</h3>
          <p className="mt-1 text-sm font-bold text-amber-300">{getAdditionalStatLabel(candidate.selectedStat)} +{candidate.remainingGain}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-400">획득 <strong className="float-right text-blue-300">{formatStage(candidate.stages.acquired)}</strong></div>
        <div className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-400">120 <strong className="float-right text-blue-300">{formatStage(candidate.stages.level120)}</strong></div>
      </div>
      <RecommendationDetails reason={reason} sourceSections={getObtainabilitySourceSections(candidate.obtainability)} />
    </RecommendationDialog>
  )
}

function getCardArtUrl(character) {
  const fileName = character?.iconUrl?.split('/').pop()?.replace(/\.(png|webp)$/i, '.png')
  return fileName ? `${import.meta.env.BASE_URL}ship-card-art/${fileName}` : ''
}

function formatStage(stage) {
  if (!stage.applicable) return '-'
  if (stage.completed) return '완료'
  return `+${stage.value}`
}
