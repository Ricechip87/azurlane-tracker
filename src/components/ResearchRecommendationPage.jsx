import { useEffect, useMemo, useState } from 'react'
import growthRecommendationsUrl from '../data/growthRecommendations.json?url'
import researchRecommendationData from '../data/researchRecommendations.json'
import shipObtainabilityUrl from '../data/shipObtainability.json?url'
import { normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'
import { normalizeFactionValue } from '../utils/factions.js'
import {
  buildOperationTierByName,
  buildResearchFactionProgress,
  buildResearchRecommendationState,
  getEligibleResearchXpShips,
  getResearchUnlockCandidates,
} from '../utils/researchRecommendations.js'

export default function ResearchRecommendationPage({ characters }) {
  const [selected, setSelected] = useState(null)
  const [selectedFaction, setSelectedFaction] = useState(null)
  const [candidateRankingData, setCandidateRankingData] = useState(null)
  const state = useMemo(
    () => buildResearchRecommendationState(researchRecommendationData.ships, characters),
    [characters],
  )
  const factionProgress = useMemo(
    () => buildResearchFactionProgress(researchRecommendationData.ships, state.factionTechPoints),
    [state.factionTechPoints],
  )
  const filterByFaction = items => selectedFaction
    ? items.filter(item => (item.unlockRequirements || []).some(requirement => normalizeFactionValue(requirement.faction) === selectedFaction))
    : items
  const visibleReady = filterByFaction(state.ready)
  const visibleLocked = filterByFaction(state.locked)
  const visibleCompleted = filterByFaction(state.completed)
  const visibleState = { ...state, ready: visibleReady, locked: visibleLocked, completed: visibleCompleted }
  const latestReadyGeneration = Math.max(0, ...visibleReady.map(item => item.generation))
  const priority = visibleReady.filter(item => item.generation === latestReadyGeneration)
  const otherReady = visibleReady.filter(item => item.generation !== latestReadyGeneration)

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
      <ResearchSummary state={visibleState} />

      <ResearchFactionProgress
        items={factionProgress}
        selectedFaction={selectedFaction}
        onSelect={setSelectedFaction}
      />

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
        items={visibleLocked}
        tone="locked"
        onSelect={setSelected}
      />

      <CompletedResearchSection items={visibleCompleted} onSelect={setSelected} />

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

function ResearchFactionProgress({ items, selectedFaction, onSelect }) {
  return (
    <section className="rounded border border-neutral-700 bg-[#1a1a1a]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-700 bg-[#242424] px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-gray-100">진영별 개발 해금 진행</h3>
          <p className="mt-1 text-xs text-gray-500">현재 기술점수를 기준으로 가장 가까운 미해금 개발함 하나를 표시합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded border px-3 py-1.5 text-xs font-bold ${selectedFaction ? 'border-neutral-600 bg-neutral-800 text-gray-300 hover:border-neutral-400' : 'border-cyan-500 bg-cyan-950/60 text-cyan-200'}`}
        >
          전체 보기
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="bg-[#202020] text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">진영</th>
              <th className="px-3 py-2 text-right">현재 기술점수</th>
              <th className="px-3 py-2 text-left">다음 개발함</th>
              <th className="px-3 py-2 text-right">필요 점수</th>
              <th className="px-3 py-2 text-right">부족 점수</th>
              <th className="px-3 py-2 text-center">목록 보기</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const selected = selectedFaction === item.faction
              const nextNames = item.nextTarget?.ships.join(' · ')
              return (
                <tr key={item.faction} className={`border-t border-neutral-800 ${selected ? 'bg-cyan-950/35' : 'bg-[#242424] hover:bg-[#292929]'}`}>
                  <th scope="row" className="px-3 py-2.5 text-left text-sm font-bold text-gray-100">{item.faction}</th>
                  <td className="px-3 py-2.5 text-right font-black text-cyan-300">{formatNumber(item.current)}점</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 font-semibold text-gray-300" title={nextNames || '기술점수 조건 모두 충족'}>
                    {nextNames || <span className="text-emerald-300">모두 충족</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-300">
                    {item.nextTarget ? `${formatNumber(item.nextTarget.required)}점` : '-'}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${item.nextTarget ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {item.nextTarget ? `${formatNumber(item.remaining)}점` : '0점'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(selected ? null : item.faction)}
                      className={`rounded border px-2.5 py-1 font-bold ${selected ? 'border-cyan-400 bg-cyan-900/60 text-cyan-100' : 'border-neutral-600 bg-neutral-800 text-gray-300 hover:border-neutral-400'}`}
                    >
                      {selected ? '선택됨' : '보기'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
          <div className="mt-2 text-[11px] font-bold text-gray-500">해금 조건을 채울 육성 후보 추천 기준</div>
          <div className="mt-1.5 grid gap-1.5 text-[11px] leading-5 text-gray-400 sm:grid-cols-2">
            <div className="rounded border border-neutral-700 bg-[#1a1a1a] px-2.5 py-1.5">
              <strong className="text-emerald-300">보유함 후보</strong> · 남은 육성 단계 → 대작전 등급 → 추가 기술점수
            </div>
            <div className="rounded border border-neutral-700 bg-[#1a1a1a] px-2.5 py-1.5">
              <strong className="text-sky-300">미보유함 후보</strong> · 입수 난이도 → 대작전 등급 → 추가 기술점수
            </div>
          </div>
          {candidateRankingData?.operationUpdatedAt && (
            <div className="mt-1.5 text-right text-[10px] text-gray-600">대작전 기준일 {candidateRankingData.operationUpdatedAt}</div>
          )}
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {item.unlock.requirements.length > 0 ? item.unlock.requirements.map(requirement => {
              const candidates = requirement.met ? [] : getResearchUnlockCandidates(requirement, characters, candidateRankingData || {})
              return (
                <div key={`${requirement.faction}-${requirement.type}`} className={`rounded border px-3 py-2 text-sm ${requirement.met ? 'border-emerald-900 bg-emerald-950/30 text-emerald-200' : 'border-amber-900 bg-amber-950/25 text-amber-100'}`}>
                  <div className="font-bold">{unlockRequirementLabel(requirement)}</div>
                  <div className="mt-1 text-xs opacity-75">{requirement.current} / {requirement.value}{requirement.remaining > 0 ? ` · ${requirement.remaining} 부족` : ' · 충족'}</div>
                  {candidates.length > 0 && (
                    <UnlockCandidateList candidates={candidates} />
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

function UnlockCandidateList({ candidates }) {
  const visibleCandidates = candidates.slice(0, 5)
  return (
    <div className="mt-3 border-t border-current/15 pt-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">해금용 육성 추천 후보</span>
        <span className="text-[10px] opacity-60">상위 {visibleCandidates.length}명 / 전체 {candidates.length}명</span>
      </div>
      <ol className="mt-2 space-y-1.5">
        {visibleCandidates.map((candidate, index) => (
          <li key={candidate.id ?? candidate.name} className="rounded border border-white/10 bg-black/25 px-2 py-2 text-gray-200">
            <div className="flex min-w-0 items-start gap-2">
              <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/60 text-[9px] font-black text-gray-400">{index + 1}</span>
              <span className="min-w-0 flex-1 break-words font-bold leading-4">{candidate.name}</span>
              {candidate.remainingTechPoints > 0 && (
                <span className="flex-none rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">+{candidate.remainingTechPoints}점</span>
              )}
            </div>
            <div className="ml-6 mt-1.5 flex flex-wrap gap-1">
              {candidateRankingBadges(candidate).map(badge => (
                <CandidateBadge key={`${candidate.name}-${badge.label}`} tone={badge.tone}>{badge.label}</CandidateBadge>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {candidates.length > visibleCandidates.length && (
        <div className="mt-2 text-center text-[10px] opacity-60">그 외 후보 {candidates.length - visibleCandidates.length}명</div>
      )}
    </div>
  )
}

function candidateRankingBadges(candidate) {
  const tier = candidate.operationTier || '미평가'
  if (normalizeAcquisitionStatus(candidate.status) !== '미획득') {
    const remaining = candidate.remainingSteps === 1 ? '120만 남음' : `${candidate.remainingSteps}단계 남음`
    return [
      { label: '보유', tone: 'owned' },
      { label: remaining, tone: 'neutral' },
      { label: `대작전 ${tier}`, tone: candidate.operationTier ? 'operation' : 'neutral' },
    ]
  }
  return [
    { label: candidate.difficulty?.label || '미확인', tone: difficultyCandidateTone(candidate.difficulty?.key) },
    { label: `대작전 ${tier}`, tone: candidate.operationTier ? 'operation' : 'neutral' },
  ]
}

function difficultyCandidateTone(key) {
  if (key === 'easy') return 'easy'
  if (key === 'normal') return 'normal'
  if (key === 'hard' || key === 'limited') return 'hard'
  return 'neutral'
}

function CandidateBadge({ children, tone }) {
  const styles = {
    owned: 'border-emerald-700 bg-emerald-950/70 text-emerald-200',
    easy: 'border-emerald-700 bg-emerald-950/70 text-emerald-200',
    normal: 'border-sky-800 bg-sky-950/70 text-sky-200',
    hard: 'border-rose-800 bg-rose-950/70 text-rose-200',
    operation: 'border-violet-800 bg-violet-950/70 text-violet-200',
    neutral: 'border-neutral-600 bg-neutral-800 text-gray-300',
  }
  return <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${styles[tone] || styles.neutral}`}>{children}</span>
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
