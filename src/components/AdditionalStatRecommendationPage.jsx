import { useMemo, useState } from 'react'
import growthRecommendationData from '../data/growthRecommendations.json'
import shipObtainabilityData from '../data/shipObtainability.json'
import {
  ADDITIONAL_STAT_CATEGORIES,
  buildAdditionalStatCategoryCandidates,
  buildAdditionalStatCandidates,
  getAvailableAdditionalShipTypes,
  resolveAdditionalStatCategorySelection,
} from '../utils/additionalStatRecommendations.js'
import { calcMajorFactionTechPoints } from '../utils/fleetTech.js'
import { calcFleetTechLevelStats } from '../utils/fleetTechLevelStats.js'
import { getObtainabilitySourceSections, obtainabilityLabel } from '../utils/obtainability.js'
import { buildOperationTierByName } from '../utils/recommendationRanking.js'
import { getStatDisplayName } from '../utils/statLabels.js'
import { calcStatsByShipType, mergeStatsByShipType } from '../utils/rosterStats.js'
import { createShipObtainabilityLookup } from '../utils/shipObtainabilityLookup.js'
import { RecommendationDetails, RecommendationDialog } from './recommendations/RecommendationDialog.jsx'
import { RecommendationShipArtwork } from './recommendations/RecommendationShipArtwork.jsx'

const RARITY_BADGE_CLASS = {
  UR: 'bg-red-950 text-red-200',
  SSR: 'bg-amber-400 text-black',
  SR: 'bg-purple-700 text-white',
  R: 'bg-blue-700 text-white',
  N: 'bg-neutral-600 text-white',
}

export default function AdditionalStatRecommendationPage({ characters }) {
  const [categoryId, setCategoryId] = useState('destroyer')
  const [shipType, setShipType] = useState('')
  const [stat, setStat] = useState('뇌격')
  const [openCandidate, setOpenCandidate] = useState(null)
  const rankingData = useMemo(() => ({
    operationTierByName: buildOperationTierByName(growthRecommendationData),
    obtainabilityByName: createShipObtainabilityLookup(shipObtainabilityData.ships),
  }), [])
  const selection = useMemo(
    () => resolveAdditionalStatCategorySelection(categoryId, stat, shipType),
    [categoryId, shipType, stat],
  )
  const applicableShipTypes = useMemo(() => {
    const availableTypes = new Set(getAvailableAdditionalShipTypes(selection.stat))
    return selection.shipTypes.filter(type => availableTypes.has(type))
  }, [selection.shipTypes, selection.stat])
  const selectedShipTypes = useMemo(
    () => (selection.shipType ? [selection.shipType] : applicableShipTypes),
    [applicableShipTypes, selection.shipType],
  )
  const selectCategory = nextCategoryId => {
    const nextSelection = resolveAdditionalStatCategorySelection(nextCategoryId, stat)
    setCategoryId(nextSelection.category.id)
    setStat(nextSelection.stat)
    setShipType('')
  }
  const selectStat = nextStat => {
    const nextSelection = resolveAdditionalStatCategorySelection(categoryId, nextStat, selection.shipType)
    setStat(nextSelection.stat)
    setShipType(nextSelection.shipType)
  }

  const shipStats = useMemo(() => mergeStatsByShipType(
    calcStatsByShipType(characters, 'acquired'),
    calcStatsByShipType(characters, '120'),
  ), [characters])
  const factionLevelStats = useMemo(() => (
    calcFleetTechLevelStats(calcMajorFactionTechPoints(characters))
  ), [characters])
  const statSummaries = useMemo(() => selectedShipTypes.map(type => ({
    shipType: type,
    shipStatValue: shipStats[type]?.[selection.stat] || 0,
    factionLevelValue: factionLevelStats[type]?.[selection.stat] || 0,
  })), [factionLevelStats, selectedShipTypes, selection.stat, shipStats])
  const candidates = useMemo(() => (
    selection.shipType
      ? buildAdditionalStatCandidates(
        characters,
        selection.shipType,
        selection.stat,
        rankingData || {},
      )
      : buildAdditionalStatCategoryCandidates(
        characters,
        applicableShipTypes,
        selection.stat,
        rankingData || {},
      )
  ), [applicableShipTypes, characters, rankingData, selection.shipType, selection.stat])

  return (
    <section className="space-y-3">
      <div className="grid items-start gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <AdditionalStatControlPanel
          categories={ADDITIONAL_STAT_CATEGORIES}
          category={selection.category}
          onCategoryChange={selectCategory}
          shipType={selection.shipType}
          shipTypes={applicableShipTypes}
          onShipTypeChange={setShipType}
          stats={selection.stats}
          selectedStat={selection.stat}
          onStatChange={selectStat}
          statSummaries={statSummaries}
        />
        <CandidatePanel
          targetLabel={selection.shipType || selection.category.label}
          selectedStat={selection.stat}
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
  categories,
  category,
  onCategoryChange,
  shipType,
  shipTypes,
  onShipTypeChange,
  stats,
  selectedStat,
  onStatChange,
  statSummaries,
}) {
  return (
    <aside className="overflow-hidden border border-neutral-700 bg-[#202020] xl:sticky xl:top-3">
      <div className="border-b border-neutral-700 bg-[#262626] px-4 py-3">
        <h2 className="text-sm font-bold text-gray-100">추가 스탯 목표</h2>
        <p className="mt-1 text-[11px] leading-4 text-gray-500">함종 분류와 유효 스탯을 선택하면 남은 육성 후보를 보여줍니다.</p>
      </div>

      <ControlSection title="1. 함종 분류">
        <div className="grid grid-cols-2 gap-1.5">
          {categories.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCategoryChange(item.id)}
              className={`rounded border px-2 py-2 text-xs font-semibold transition-colors ${category.id === item.id ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-gray-600">공작·운송·범선은 추천 대상에서 제외</p>
      </ControlSection>

      <ControlSection title="2. 유효 스탯">
        <div className="grid grid-cols-2 gap-1.5">
          {stats.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => onStatChange(item)}
              className={`rounded border px-2 py-2 text-left text-xs font-semibold transition-colors ${selectedStat === item ? 'border-amber-500 bg-amber-950/40 text-amber-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              {getStatDisplayName(item)}
            </button>
          ))}
        </div>
      </ControlSection>

      {shipTypes.length > 1 && (
        <ControlSection title="3. 세부 함종 (선택)">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onShipTypeChange('')}
              className={`rounded border px-2 py-2 text-xs font-semibold transition-colors ${!shipType ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-200'}`}
            >
              전체
            </button>
          {shipTypes.map(type => (
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
          <p className="mt-2 text-[10px] text-gray-600">전체에서는 분류 공용 보너스를 먼저 표시</p>
        </ControlSection>
      )}

      <div className="border-t border-neutral-700 p-3">
        <StatSummary
          categoryLabel={category.label}
          selectedStat={selectedStat}
          summaries={statSummaries}
        />
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
    <div className="flex items-center justify-between gap-1.5 py-1">
      <div className="whitespace-nowrap text-[10px] text-gray-500">{label}</div>
      <div className={`shrink-0 text-xs font-black ${tone}`}>+{value}</div>
    </div>
  )
}

function StatSummary({ categoryLabel, selectedStat, summaries }) {
  return (
    <div className="rounded border border-cyan-900/70 bg-cyan-950/20 px-3 py-3">
      <div className="text-[10px] text-cyan-300/70">{categoryLabel} {getStatDisplayName(selectedStat)} 현재 합계</div>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {summaries.map(summary => (
          <div key={summary.shipType} className="rounded border border-cyan-900/40 bg-neutral-950/20 px-2 py-2">
            <div className="flex items-end justify-between gap-2">
              <div className="text-[10px] font-bold text-gray-400">{summary.shipType}</div>
              <div className="text-lg font-black leading-none text-cyan-300">
                +{summary.shipStatValue + summary.factionLevelValue}
              </div>
            </div>
            <div className="mt-2 divide-y divide-cyan-900/30 border-t border-cyan-900/40 pt-1">
              <StatBreakdown label="함선" value={summary.shipStatValue} tone="text-blue-300" />
              <StatBreakdown label="진영 기술 보너스" value={summary.factionLevelValue} tone="text-purple-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidatePanel({ targetLabel, selectedStat, candidates, onOpen }) {
  return (
    <section className="min-w-0 overflow-hidden border border-neutral-700 bg-[#202020]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-700 bg-[#262626] px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-gray-100">{targetLabel} · {getStatDisplayName(selectedStat)} 육성 후보</h2>
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
        <RecommendationShipArtwork
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
    : `${candidate.selectedShipType} ${getStatDisplayName(candidate.selectedStat)}을(를) 앞으로 +${candidate.remainingGain} 얻을 수 있습니다.`

  return (
    <RecommendationDialog name={candidate.name} onClose={onClose}>
      <div className="flex items-start gap-4 pr-6">
        <div className="h-24 w-24 flex-none overflow-hidden rounded border border-neutral-600 bg-[#181818]">
          <RecommendationShipArtwork character={candidate} className="h-full w-full object-cover object-top" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
            <span className="rounded bg-neutral-900 px-2 py-1">{candidate.rarity}</span>
            <span className="rounded bg-neutral-900 px-2 py-1">{candidate.status}</span>
            <span className="rounded bg-neutral-900 px-2 py-1">{candidate.operationTier ? `대작전 ${candidate.operationTier}` : '대작전 미평가'}</span>
          </div>
          <h3 className="mt-3 truncate text-lg font-black text-white">{candidate.name}</h3>
          <p className="mt-1 text-sm font-bold text-amber-300">{getStatDisplayName(candidate.selectedStat)} +{candidate.remainingGain}</p>
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

function formatStage(stage) {
  if (!stage.applicable) return '-'
  if (stage.completed) return '완료'
  return `+${stage.value}`
}
