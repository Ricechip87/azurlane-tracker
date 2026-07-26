import { useMemo, useState } from 'react'
import growthRecommendationData from '../data/growthRecommendations.json'
import shipObtainabilityData from '../data/shipObtainability.json'
import {
  ADDITIONAL_STAT_SHIP_TYPES,
  buildAdditionalStatCandidates,
  getAdditionalStatLabel,
  getAvailableAdditionalStats,
} from '../utils/additionalStatRecommendations.js'
import { calcMajorFactionTechPoints } from '../utils/fleetTech.js'
import { calcFleetTechLevelStats } from '../utils/fleetTechLevelStats.js'
import { getObtainabilitySourceSections, obtainabilityLabel } from '../utils/obtainability.js'
import { buildOperationTierByName } from '../utils/researchRecommendations.js'
import { calcStatsByShipType, mergeStatsByShipType } from '../utils/rosterStats.js'
import { createShipObtainabilityLookup } from '../utils/shipObtainabilityLookup.js'
import { RecommendationDetails, RecommendationDialog } from './recommendations/RecommendationDialog.jsx'

const RARITY_BADGE_CLASS = {
  UR: 'bg-red-950 text-red-200',
  SSR: 'bg-amber-400 text-black',
  SR: 'bg-purple-700 text-white',
  R: 'bg-blue-700 text-white',
  N: 'bg-neutral-600 text-white',
}

export default function AdditionalStatRecommendationPage({ characters }) {
  const [shipType, setShipType] = useState('구축')
  const [stat, setStat] = useState('뇌격')
  const [openCandidate, setOpenCandidate] = useState(null)
  const rankingData = useMemo(() => ({
    operationTierByName: buildOperationTierByName(growthRecommendationData),
    obtainabilityByName: createShipObtainabilityLookup(shipObtainabilityData.ships),
  }), [])
  const stats = useMemo(() => getAvailableAdditionalStats(shipType), [shipType])
  const selectedStat = stats.includes(stat) ? stat : stats[0] || ''

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
      <div className="grid items-start gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <AdditionalStatControlPanel
          shipType={shipType}
          onShipTypeChange={setShipType}
          stats={stats}
          selectedStat={selectedStat}
          onStatChange={setStat}
          shipStatValue={shipStatValue}
          factionLevelValue={factionLevelValue}
        />
        <CandidatePanel
          shipType={shipType}
          selectedStat={selectedStat}
          candidates={candidates}
          onOpen={setOpenCandidate}
        />
      </div>

      {openCandidate && (
        <CandidatePopup candidate={openCandidate} onClose={() => setOpenCandidate(null)} />
      )}
    </section>
  )
}

function AdditionalStatControlPanel({
  shipType,
  onShipTypeChange,
  stats,
  selectedStat,
  onStatChange,
  shipStatValue,
  factionLevelValue,
}) {
  return (
    <aside className="overflow-hidden border border-neutral-700 bg-[#202020] xl:sticky xl:top-3">
      <div className="border-b border-neutral-700 bg-[#262626] px-4 py-3">
        <h2 className="text-sm font-bold text-gray-100">추가 스탯 목표</h2>
        <p className="mt-1 text-[11px] leading-4 text-gray-500">함종과 유효 스탯을 선택하면 남은 육성 후보를 보여줍니다.</p>
      </div>

      <ControlSection title="1. 강화할 함종">
        <div className="grid grid-cols-3 gap-1.5">
          {ADDITIONAL_STAT_SHIP_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onShipTypeChange(type)}
              className={`rounded border px-2 py-2 text-xs font-semibold transition-colors ${shipType === type ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-gray-600">공작·운송·범선 제외</p>
      </ControlSection>

      <ControlSection title="2. 유효 스탯">
        <div className="space-y-1.5">
          {stats.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => onStatChange(item)}
              className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-xs transition-colors ${selectedStat === item ? 'border-amber-500 bg-amber-950/40 text-amber-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${selectedStat === item ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-gray-500'}`}>{index + 1}</span>
              <span className="font-semibold">{getAdditionalStatLabel(item)}</span>
            </button>
          ))}
        </div>
      </ControlSection>

      <div className="border-t border-neutral-700 p-3">
        <div className="rounded border border-cyan-900/70 bg-cyan-950/20 px-3 py-3">
          <div className="text-[10px] text-cyan-300/70">{shipType} {getAdditionalStatLabel(selectedStat)} 현재 합계</div>
          <div className="mt-1 text-2xl font-black text-cyan-300">+{shipStatValue + factionLevelValue}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-cyan-900/50 pt-2 text-[10px]">
            <StatBreakdown label="함선 획득·120" value={shipStatValue} tone="text-blue-300" />
            <StatBreakdown label="진영 기술 LV" value={factionLevelValue} tone="text-purple-300" />
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-700 px-3 py-3 text-[10px] leading-4 text-gray-500">
        <strong className="block text-gray-300">정렬 기준</strong>
        공용 적용 → 보유 → 남은 단계 → 입수 난이도 → 대작전 등급 → 증가량
      </div>
    </aside>
  )
}

function ControlSection({ title, children }) {
  return (
    <section className="border-b border-neutral-700 p-3">
      <h3 className="mb-2 text-xs font-bold text-gray-300">{title}</h3>
      {children}
    </section>
  )
}

function StatBreakdown({ label, value, tone }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className={`mt-0.5 text-sm font-black ${tone}`}>+{value}</div>
    </div>
  )
}

function CandidatePanel({ shipType, selectedStat, candidates, onOpen }) {
  return (
    <section className="min-w-0 overflow-hidden border border-neutral-700 bg-[#202020]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-700 bg-[#262626] px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-gray-100">{shipType} · {getAdditionalStatLabel(selectedStat)} 육성 후보</h2>
          <p className="mt-1 text-[11px] text-gray-500">미완료 획득 보너스와 120 보너스만 표시합니다. 카드를 누르면 입수처를 볼 수 있습니다.</p>
        </div>
        <span className="rounded bg-cyan-950 px-2 py-1 text-xs font-bold text-cyan-300">{candidates.length}명</span>
      </div>
      <CandidateList candidates={candidates} onOpen={onOpen} />
    </section>
  )
}

function CandidateList({ candidates, onOpen }) {
  if (!candidates.length) {
    return <div className="flex min-h-[300px] items-center justify-center px-4 py-8 text-sm text-gray-600">현재 남아 있는 후보가 없습니다.</div>
  }

  return (
    <div className="grid max-h-[760px] gap-2 overflow-auto p-3 lg:grid-cols-2">
      {candidates.map(candidate => (
        <CandidateCard key={candidate.id} candidate={candidate} onOpen={onOpen} />
      ))}
    </div>
  )
}

function CandidateCard({ candidate, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(candidate)}
      className="group flex min-w-0 overflow-hidden rounded border border-neutral-700 bg-[#181818] text-left transition-colors hover:border-cyan-800 hover:bg-[#222]"
    >
      <div className="h-28 w-24 flex-none overflow-hidden border-r border-neutral-700 bg-neutral-900">
        <ShipArtwork
          character={candidate}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-3 py-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-gray-100">{candidate.name}</div>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold">
              <span className={`rounded px-1.5 py-0.5 ${RARITY_BADGE_CLASS[candidate.rarity] || 'bg-neutral-700 text-gray-200'}`}>{candidate.rarity}</span>
              <span className="rounded bg-neutral-700 px-1.5 py-0.5 text-gray-200">{candidate.status}</span>
              <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-indigo-200">{candidate.operationTier ? `대작전 ${candidate.operationTier}` : '대작전 미평가'}</span>
              {candidate.broadCoverage && <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-emerald-300">공용 우선</span>}
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="text-[9px] text-gray-600">총 증가량</div>
            <div className="text-lg font-black text-amber-300">+{candidate.remainingGain}</div>
          </div>
        </div>
        <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <div className="truncate text-[10px] text-gray-500">{obtainabilityLabel(candidate.obtainability)}</div>
            <div className="mt-0.5 truncate text-[10px] text-gray-600">적용: {candidate.targetShipTypes.join(' · ')}</div>
          </div>
          <div className="flex flex-none gap-1">
            <StageBadge label="획득" stage={candidate.stages.acquired} />
            <StageBadge label="120" stage={candidate.stages.level120} />
          </div>
        </div>
      </div>
    </button>
  )
}

function StageBadge({ label, stage }) {
  const value = !stage.applicable ? '-' : stage.completed ? '완료' : `+${stage.value}`
  const tone = !stage.applicable || stage.completed ? 'text-gray-600' : 'text-blue-300'
  return <span className={`rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-[9px] ${tone}`}>{label} {value}</span>
}

function CandidatePopup({ candidate, onClose }) {
  const reason = candidate.broadCoverage
    ? `${candidate.targetShipTypes.join('·')}에 함께 적용되는 공용 보너스라 우선 배치했습니다.`
    : `${candidate.selectedShipType} ${getAdditionalStatLabel(candidate.selectedStat)}을(를) 앞으로 +${candidate.remainingGain} 얻을 수 있습니다.`

  return (
    <RecommendationDialog name={candidate.name} onClose={onClose}>
      <div className="flex items-start gap-4 pr-6">
        <div className="h-24 w-24 flex-none overflow-hidden rounded border border-neutral-600 bg-[#181818]">
          <ShipArtwork character={candidate} className="h-full w-full object-cover object-top" />
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

function ShipArtwork({ character, className, loading }) {
  const cardArtUrl = getCardArtUrl(character)
  const iconUrl = character?.iconUrl || ''
  if (!cardArtUrl && !iconUrl) {
    return <div className="flex h-full items-center justify-center text-[10px] text-gray-700">이미지 없음</div>
  }

  return (
    <img
      src={cardArtUrl || iconUrl}
      alt=""
      loading={loading}
      className={className}
      onError={event => {
        if (iconUrl && event.currentTarget.dataset.fallbackApplied !== 'true') {
          event.currentTarget.dataset.fallbackApplied = 'true'
          event.currentTarget.src = iconUrl
          return
        }
        event.currentTarget.style.display = 'none'
      }}
    />
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
