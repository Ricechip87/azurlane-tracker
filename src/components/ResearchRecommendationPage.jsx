import { useEffect, useMemo, useState } from 'react'
import growthRecommendationsUrl from '../data/growthRecommendations.json?url'
import researchRecommendationData from '../data/researchRecommendations.json'
import shipObtainabilityUrl from '../data/shipObtainability.json?url'
import { normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'
import {
  buildOperationTierByName,
  buildResearchRecommendationState,
  getEligibleResearchXpShips,
  getResearchUnlockCandidates,
} from '../utils/researchRecommendations.js'

export default function ResearchRecommendationPage({ characters }) {
  const [selected, setSelected] = useState(null)
  const [candidateRankingData, setCandidateRankingData] = useState(null)
  const state = useMemo(
    () => buildResearchRecommendationState(researchRecommendationData.ships, characters),
    [characters],
  )
  const latestReadyGeneration = Math.max(0, ...state.ready.map(item => item.generation))
  const priority = state.ready.filter(item => item.generation === latestReadyGeneration)
  const otherReady = state.ready.filter(item => item.generation !== latestReadyGeneration)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch(growthRecommendationsUrl).then(response => {
        if (!response.ok) throw new Error(`growthRecommendations.json ${response.status}`)
        return response.json()
      }),
      fetch(shipObtainabilityUrl).then(response => {
        if (!response.ok) throw new Error(`shipObtainability.json ${response.status}`)
        return response.json()
      }),
    ]).then(([growthData, obtainabilityData]) => {
      if (cancelled) return
      const operationSource = (growthData.sources || []).find(source => source.key === 'operation-siren')
      setCandidateRankingData({
        operationTierByName: buildOperationTierByName(growthData),
        operationUpdatedAt: operationSource?.updatedAt || null,
        obtainabilityByName: new Map((obtainabilityData.ships || []).map(ship => [ship.name, ship])),
      })
    }).catch(() => {
      if (!cancelled) setCandidateRankingData({})
    })

    return () => { cancelled = true }
  }, [])

  return (
    <section className="space-y-4">
      <ResearchSummary state={state} />

      <div className="rounded border border-sky-900/70 bg-sky-950/25 px-4 py-3 text-sm leading-6 text-sky-100">
        <strong>9기 반영 정책:</strong> KR 기본 데이터에 정식 편입된 뒤 추가합니다. 현재 추천은 검증된 1~8기 42명을 기준으로 계산합니다.
      </div>

      <ResearchSection
        title={latestReadyGeneration ? `최우선 추천 · ${latestReadyGeneration}기` : '최우선 추천'}
        description="현재 해금 조건을 충족한 미획득 개발함 중 가장 최신 기수입니다."
        items={priority}
        tone="priority"
        onSelect={setSelected}
      />

      <ResearchSection
        title="다른 개발 가능 후보"
        description="지금 바로 개발을 시작할 수 있는 이전 기수 함선입니다."
        items={otherReady}
        tone="ready"
        onSelect={setSelected}
      />

      <ResearchSection
        title="해금 조건 부족"
        description="부족한 진영 기술점수 또는 도감 등록 수를 채우면 개발할 수 있습니다."
        items={state.locked}
        tone="locked"
        onSelect={setSelected}
      />

      <CompletedResearchSection items={state.completed} onSelect={setSelected} />

      {selected && (
        <ResearchDetailModal
          item={selected}
          characters={characters}
          candidateRankingData={candidateRankingData}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}

function ResearchSummary({ state }) {
  return (
    <section className="grid gap-px overflow-hidden rounded border border-neutral-700 bg-neutral-700 sm:grid-cols-3">
      <SummaryCell label="개발 가능" value={state.ready.length} tone="text-emerald-300" />
      <SummaryCell label="해금 필요" value={state.locked.length} tone="text-amber-300" />
      <SummaryCell label="개발 완료" value={state.completed.length} tone="text-sky-300" />
    </section>
  )
}

function SummaryCell({ label, value, tone }) {
  return (
    <div className="bg-[#242424] px-4 py-3">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-black ${tone}`}>{value}</div>
    </div>
  )
}

function ResearchSection({ title, description, items, tone, onSelect }) {
  return (
    <section className="rounded border border-neutral-700 bg-[#1a1a1a]">
      <header className="border-b border-neutral-700 bg-[#242424] px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="text-base font-bold text-gray-100">{title}</h3>
          <span className="text-xs text-gray-500">{description}</span>
        </div>
      </header>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2 p-3">
          {items.map(item => (
            <ResearchCard key={item.id} item={item} tone={tone} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-gray-600">해당하는 개발함이 없습니다.</div>
      )}
    </section>
  )
}

function ResearchCard({ item, tone, onSelect }) {
  const character = item.character
  const status = normalizeAcquisitionStatus(character?.acquired)
  const artUrl = getCardArtUrl(item)
  const border = tone === 'priority'
    ? 'border-cyan-400'
    : tone === 'ready'
      ? 'border-emerald-500'
      : 'border-amber-600'

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`group relative h-[232px] w-[172px] max-w-full flex-none overflow-hidden rounded-md border-2 bg-[#272727] text-left shadow-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-200 ${border}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#3a3a3a_0%,#202020_52%,#111_100%)]" />
      <img
        src={artUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/95" />

      <div className="absolute left-2 top-2 flex gap-1 text-[10px] font-black">
        <CardBadge>{item.generation}기</CardBadge>
        <CardBadge tone={item.planRarity === 'DR' ? 'gold' : 'purple'}>{item.planRarity}</CardBadge>
      </div>
      <div className="absolute right-2 top-2 flex flex-col items-end gap-1 text-[10px] font-black">
        <CardBadge>{item.faction}</CardBadge>
        <CardBadge>{item.shipType}</CardBadge>
        {item.coinStrengthening.available && <CardBadge tone="green">물자강화</CardBadge>}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <h4 className="truncate text-sm font-black drop-shadow">{item.name}</h4>
        <div className="mt-2 truncate rounded bg-black/45 px-2 py-1 text-[11px] font-semibold text-gray-100 backdrop-blur-sm">
          {item.unlock.met ? `개발 가능 · ${status}` : summarizeUnlock(item.unlock.requirements)}
        </div>
      </div>
    </button>
  )
}

function CompletedResearchSection({ items, onSelect }) {
  return (
    <details className="rounded border border-neutral-700 bg-[#1a1a1a]">
      <summary className="cursor-pointer bg-[#242424] px-4 py-3 text-sm font-bold text-gray-300">
        개발 완료 · {items.length}명
      </summary>
      <div className="flex flex-wrap gap-2 p-3">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded border border-neutral-700 bg-[#242424] px-3 py-2 text-xs text-gray-400 hover:border-neutral-500 hover:text-gray-100"
          >
            {item.generation}기 · {item.name}
          </button>
        ))}
      </div>
    </details>
  )
}

function ResearchDetailModal({ item, characters, candidateRankingData, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-600 bg-[#242424] p-5 text-gray-100 shadow-2xl"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} 개발 정보`}
      >
        <div className="flex items-start gap-4">
          <img src={getCardArtUrl(item)} alt="" className="h-28 w-28 flex-none rounded border border-neutral-600 bg-[#181818] object-cover object-top" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
              <CardBadge>{item.generation}기</CardBadge>
              <CardBadge tone={item.planRarity === 'DR' ? 'gold' : 'purple'}>{item.planRarity}</CardBadge>
              <CardBadge>{item.faction}</CardBadge>
              <CardBadge>{item.shipType}</CardBadge>
              {item.coinStrengthening.available && <CardBadge tone="green">물자강화 가능</CardBadge>}
            </div>
            <h3 className="mt-3 text-xl font-black">{item.name}</h3>
            <p className="mt-2 text-sm text-gray-400">{item.unlockText}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-gray-500 hover:bg-neutral-700 hover:text-white" aria-label="닫기">✕</button>
        </div>

        <section className="mt-5">
          <h4 className="text-sm font-bold text-gray-300">해금 조건</h4>
          <p className="mt-1 text-[11px] leading-5 text-gray-500">
            보유함은 남은 단계 → 대작전 등급 → 기술점수, 미보유함은 입수 난이도 → 대작전 등급 → 기술점수 순입니다.
            {candidateRankingData?.operationUpdatedAt ? ` 대작전 기준일 ${candidateRankingData.operationUpdatedAt}` : ''}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {item.unlock.requirements.length > 0 ? item.unlock.requirements.map(requirement => {
              const candidates = requirement.met ? [] : getResearchUnlockCandidates(requirement, characters, candidateRankingData || {})
              return (
                <div key={`${requirement.faction}-${requirement.type}`} className={`rounded border px-3 py-2 text-sm ${requirement.met ? 'border-emerald-900 bg-emerald-950/30 text-emerald-200' : 'border-amber-900 bg-amber-950/25 text-amber-100'}`}>
                  <div className="font-bold">{unlockRequirementLabel(requirement)}</div>
                  <div className="mt-1 text-xs opacity-75">{requirement.current} / {requirement.value}{requirement.remaining > 0 ? ` · ${requirement.remaining} 부족` : ' · 충족'}</div>
                  {candidates.length > 0 && (
                    <div className="mt-2 border-t border-current/15 pt-2 text-xs leading-5">
                      <span className="font-bold">채울 후보:</span>{' '}
                      {candidates.slice(0, 5).map(candidate => (
                        `${candidate.name}(${candidateRankingSummary(candidate)})`
                      )).join(', ')}
                      {candidates.length > 5 ? ` 외 ${candidates.length - 5}명` : ''}
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className="rounded border border-emerald-900 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">별도 해금 조건 없음</div>
            )}
          </div>
        </section>

        <section className="mt-5">
          <h4 className="text-sm font-bold text-gray-300">경험치작 편성 조건</h4>
          <div className="mt-2 space-y-2">
            {item.xpPhases.map(phase => {
              const eligible = getEligibleResearchXpShips(phase, characters)
              return (
                <div key={phase.phase} className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-3">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <strong>{phase.phase}차 · {formatNumber(phase.requiredXp)} EXP</strong>
                    <span className="text-gray-400">보유 조건 일치 {eligible.length}명</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{phase.factions.join(' · ')} / {phase.lane}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-300">
                    {eligible.length > 0 ? eligible.slice(0, 12).map(character => character.name).join(', ') : '현재 보유 상태에서 조건에 맞는 함선이 없습니다.'}
                    {eligible.length > 12 ? ` 외 ${eligible.length - 12}명` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function summarizeUnlock(requirements) {
  const first = requirements.find(requirement => !requirement.met) || requirements[0]
  if (!first) return '개발 가능'
  return `${first.faction} ${first.remaining} 부족`
}

function unlockRequirementLabel(requirement) {
  if (requirement.type === 'roster-count') return `${requirement.faction} ${requirement.lane} 도감 등록`
  return `${requirement.faction} 기술점수`
}

function getCardArtUrl(item) {
  const fileName = item.iconUrl.split('/').pop().replace(/\.(png|webp)$/i, '.png')
  return `${import.meta.env.BASE_URL}ship-card-art/${fileName}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function candidateRankingSummary(candidate) {
  const tier = candidate.operationTier || '미평가'
  const points = candidate.remainingTechPoints ? `·+${candidate.remainingTechPoints}` : ''
  if (normalizeAcquisitionStatus(candidate.status) !== '미획득') {
    const remaining = candidate.remainingSteps === 1 ? '120만 남음' : `${candidate.remainingSteps}단계 남음`
    return `보유·${remaining}·대작전 ${tier}${points}`
  }
  return `${candidate.difficulty?.label || '미확인'}·대작전 ${tier}${points}`
}

function CardBadge({ children, tone = 'dark' }) {
  const styles = {
    dark: 'border-white/10 bg-black/70 text-white',
    gold: 'border-amber-300/60 bg-amber-400 text-black',
    purple: 'border-violet-300/50 bg-violet-600 text-white',
    green: 'border-emerald-300/50 bg-emerald-500 text-black',
  }
  return <span className={`rounded-full border px-1.5 py-0.5 shadow-sm ${styles[tone] || styles.dark}`}>{children}</span>
}
