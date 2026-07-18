import { useEffect, useMemo, useRef, useState } from 'react'
import growthRecommendationsUrl from '../data/growthRecommendations.json?url'
import researchRecommendationData from '../data/researchRecommendations.json'
import shipObtainabilityUrl from '../data/shipObtainability.json?url'
import { isAcquiredStatus, normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'
import { getFactionDisplayName, getFactionDisplayText } from '../utils/factions.js'
import {
  buildOperationTierByName,
  buildResearchFactionProgress,
  buildResearchRecommendationState,
  buildWebResearchRecommendationGroups,
  getEligibleResearchXpShips,
  getResearchUnlockCandidates,
  groupResearchShipsByGeneration,
} from '../utils/researchRecommendations.js'

const RESEARCH_SHIP_BY_NAME = new Map(researchRecommendationData.ships.map(ship => [ship.name, ship]))

export default function ResearchRecommendationPage({ characters }) {
  const [targetId, setTargetId] = useState(() => typeof window === 'undefined' ? '' : window.localStorage.getItem('azurlane-research-target') || '')
  const [candidateRankingData, setCandidateRankingData] = useState(null)
  const goalRef = useRef(null)
  const state = useMemo(
    () => buildResearchRecommendationState(researchRecommendationData.ships, characters),
    [characters],
  )
  const factionProgress = useMemo(
    () => buildResearchFactionProgress(researchRecommendationData.ships, state.factionTechPoints),
    [state.factionTechPoints],
  )
  const allItems = useMemo(
    () => [...state.ready, ...state.locked, ...state.completed].sort((a, b) => b.generation - a.generation || a.name.localeCompare(b.name, 'ko')),
    [state],
  )
  const selectedTarget = allItems.find(item => String(item.id) === String(targetId)) || null
  const webRecommendationGroups = useMemo(
    () => buildWebResearchRecommendationGroups(state, candidateRankingData?.operationTierByName),
    [state, candidateRankingData],
  )

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (targetId) window.localStorage.setItem('azurlane-research-target', targetId)
    else window.localStorage.removeItem('azurlane-research-target')
  }, [targetId])

  const selectGoal = item => {
    setTargetId(String(item.id))
    requestAnimationFrame(() => goalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <section className="space-y-4" ref={goalRef}>
      <ResearchSummary state={state} />

      <ResearchGoalWorkspace
        key={selectedTarget?.id || 'no-target'}
        items={allItems}
        selectedTarget={selectedTarget}
        onSelectId={setTargetId}
        characters={characters}
        candidateRankingData={candidateRankingData}
      />

      <div className="rounded border border-sky-900/70 bg-sky-950/25 px-4 py-3 text-sm leading-6 text-sky-100">
        <strong>9기 반영 정책:</strong> KR 기본 데이터에 정식 편입된 뒤 추가합니다. 현재 추천은 검증된 1~8기 42명을 기준으로 계산합니다.
      </div>

      <WebResearchRecommendations groups={webRecommendationGroups} onSelect={selectGoal} />

      <details className="rounded border border-neutral-700 bg-[#1a1a1a]">
        <summary className="cursor-pointer bg-[#242424] px-4 py-3 text-sm font-bold text-gray-300">보조 정보 · 진영별 기술점수 이정표</summary>
        <ResearchFactionProgress items={factionProgress} />
      </details>

      <CompletedResearchSection items={state.completed} onSelect={selectGoal} />
    </section>
  )
}

function ResearchGoalWorkspace({ items, selectedTarget, onSelectId, characters, candidateRankingData }) {
  const [pickerOpen, setPickerOpen] = useState(!selectedTarget)
  const generationGroups = groupResearchShipsByGeneration(items)

  const selectTarget = item => {
    onSelectId(String(item.id))
    setPickerOpen(false)
  }

  return (
    <section className="overflow-hidden rounded border border-cyan-900/70 bg-[#1a1a1a]">
      <header className="border-b border-neutral-700 bg-[#242424] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-cyan-100">내 개발 목표</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">원하는 개발함을 선택하면 해금부터 경험치작과 강화까지 현재 해야 할 일을 보여줍니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(open => !open)}
            className={`min-w-[280px] rounded border px-3 py-2 text-left text-sm font-bold ${pickerOpen ? 'border-cyan-500 bg-cyan-950/40 text-cyan-100' : 'border-neutral-600 bg-[#181818] text-gray-100 hover:border-cyan-600'}`}
            aria-expanded={pickerOpen}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{selectedTarget ? goalOptionLabel(selectedTarget) : '최신 기수부터 개발함 선택하기'}</span>
              <span className="text-xs text-gray-500">{pickerOpen ? '▲ 접기' : '▼ 목표 변경'}</span>
            </span>
          </button>
        </div>
      </header>

      {pickerOpen ? (
        <ResearchGoalPicker groups={generationGroups} selectedTarget={selectedTarget} onSelect={selectTarget} />
      ) : selectedTarget ? (
        <ResearchGoalPanel item={selectedTarget} characters={characters} candidateRankingData={candidateRankingData} />
      ) : (
        <div className="px-5 py-10 text-center">
          <div className="text-sm font-bold text-gray-300">먼저 목표 개발함을 선택하세요.</div>
          <p className="mt-2 text-xs text-gray-600">아직 목표를 모르겠다면 아래 웹 자동 추천 카드에서 하나를 선택할 수 있습니다.</p>
        </div>
      )}
    </section>
  )
}

function ResearchGoalPicker({ groups, selectedTarget, onSelect }) {
  return (
    <div className="space-y-4 bg-[#181818] p-4">
      <div>
        <h3 className="text-sm font-black text-gray-100">최신 기수부터 목표 선택</h3>
        <p className="mt-1 text-xs text-gray-500">함선 이미지와 현재 해금 상태를 확인하고 선택하세요. 선택하면 목록이 접히고 상세 로드맵이 열립니다.</p>
      </div>
      {groups.map(group => (
        <section key={group.generation} className="rounded border border-neutral-700 bg-[#202020]">
          <header className="flex items-center justify-between border-b border-neutral-700 px-3 py-2">
            <h4 className="text-sm font-black text-cyan-200">{group.generation}기</h4>
            <span className="text-[11px] text-gray-600">{group.items.length}명</span>
          </header>
          <div className="flex flex-wrap gap-2 p-3">
            {group.items.map(item => {
              const selected = String(selectedTarget?.id) === String(item.id)
              const completed = isResearchCompleted(item)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`group relative h-[178px] w-[142px] max-w-full flex-none overflow-hidden rounded border-2 bg-[#272727] text-left shadow outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white ${selected ? 'border-cyan-400' : completed ? 'border-sky-700' : item.unlock.met ? 'border-emerald-600' : 'border-neutral-600 hover:border-neutral-400'}`}
                >
                  <img src={getCardArtUrl(item)} alt="" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/95" />
                  <div className="absolute left-1.5 top-1.5 flex gap-1 text-[9px] font-black">
                    <CardBadge tone={item.planRarity === 'DR' ? 'gold' : 'purple'}>{item.planRarity}</CardBadge>
                    {item.coinStrengthening.available && <CardBadge tone="green">물자</CardBadge>}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                    <div className="break-keep text-sm font-black leading-5 drop-shadow">{item.name}</div>
                    <div className={`mt-1 text-[10px] font-bold ${completed ? 'text-sky-300' : item.unlock.met ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {completed ? '개발 완료' : item.unlock.met ? '바로 개발 가능' : summarizeUnlock(item.unlock.requirements)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function ResearchGoalPanel({ item, characters, candidateRankingData }) {
  const completed = isResearchCompleted(item)
  return (
    <div className="p-4">
      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <img src={getCardArtUrl(item)} alt="" className="h-[232px] w-[172px] max-w-full rounded-md border-2 border-cyan-500 bg-[#181818] object-cover object-top" />
          <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-black">
            <CardBadge>{item.generation}기</CardBadge>
            <CardBadge tone={item.planRarity === 'DR' ? 'gold' : 'purple'}>{item.planRarity}</CardBadge>
            <CardBadge>{getFactionDisplayName(item.faction)}</CardBadge>
            {item.coinStrengthening.available && <CardBadge tone="green">물자강화</CardBadge>}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black text-white">{item.name}</h3>
            <span className={`rounded px-2 py-1 text-[11px] font-black ${completed ? 'bg-sky-900 text-sky-200' : item.unlock.met ? 'bg-emerald-900 text-emerald-200' : 'bg-amber-900 text-amber-200'}`}>
              {completed ? '개발 완료' : item.unlock.met ? '바로 개발 가능' : '해금 준비 중'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-400">{getFactionDisplayText(item.unlockText)}</p>

          <h4 className="mt-5 text-sm font-black text-gray-200">1. 해금하려면 지금 무엇을 해야 하나요?</h4>
          <div className="mt-2 grid gap-2 xl:grid-cols-2">
            {item.unlock.requirements.map(requirement => {
              const candidates = requirement.met ? [] : getResearchUnlockCandidates(requirement, characters, candidateRankingData || {})
              const candidateTitle = requirement.type === 'roster-count' ? '추가 획득 추천 후보' : '육성 추천 후보'
              return (
                <div key={`${requirement.faction}-${requirement.type}`} className={`rounded border p-3 text-sm ${requirement.met ? 'border-emerald-900 bg-emerald-950/25' : 'border-amber-900 bg-amber-950/20'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <strong>{unlockRequirementLabel(requirement)}</strong>
                    <span className={requirement.met ? 'text-emerald-300' : 'text-amber-300'}>{requirement.current} / {requirement.value}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{requirement.met ? '조건 충족' : requirement.type === 'roster-count' ? `${requirement.remaining}명 추가 획득 필요` : `${requirement.remaining}점 추가 필요`}</div>
                  {candidates.length > 0 && <UnlockCandidateList candidates={candidates} title={candidateTitle} />}
                </div>
              )
            })}
          </div>

          <h4 className="mt-5 text-sm font-black text-gray-200">2. 해금 후 경험치작 편성</h4>
          <div className="mt-2 grid gap-2 xl:grid-cols-2">
            {item.xpPhases.map(phase => {
              const eligible = getEligibleResearchXpShips(phase, characters)
              return (
                <div key={phase.phase} className="rounded border border-neutral-700 bg-[#202020] p-3 text-sm">
                  <div className="flex justify-between gap-2"><strong>{phase.phase}차 · {formatNumber(phase.requiredXp)} EXP</strong><span className="text-xs text-cyan-300">보유 {eligible.length}명</span></div>
                  <div className="mt-1 text-xs text-gray-500">{phase.factions.map(getFactionDisplayName).join(' · ')} / {phase.lane}</div>
                  <p className="mt-2 text-xs leading-5 text-gray-300">{eligible.length ? eligible.slice(0, 10).map(character => character.name).join(', ') : '현재 조건에 맞는 보유함이 없습니다.'}{eligible.length > 10 ? ` 외 ${eligible.length - 10}명` : ''}</p>
                </div>
              )
            })}
          </div>

          <h4 className="mt-5 text-sm font-black text-gray-200">3. 개발 후 강화 방식</h4>
          <div className={`mt-2 rounded border px-3 py-2 text-sm ${item.coinStrengthening.available ? 'border-emerald-900 bg-emerald-950/25 text-emerald-200' : 'border-violet-900 bg-violet-950/25 text-violet-200'}`}>
            {item.coinStrengthening.available ? '물자강화 가능 · 개발 후 도면 부담을 줄여 빠르게 강화할 수 있습니다.' : '도면강화 대상 · 해당 기수 연구를 통해 강화 도면을 모아야 합니다.'}
          </div>
        </div>
      </div>
    </div>
  )
}

function WebResearchRecommendations({ groups, onSelect }) {
  return (
    <section className="rounded border border-neutral-700 bg-[#1a1a1a]">
      <header className="border-b border-neutral-700 bg-[#242424] px-4 py-3">
        <h2 className="text-base font-black text-gray-100">웹 자동 추천</h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">목표를 못 정했다면 현재 보유 상태, 해금 거리, 물자강화와 대작전 추천 가치를 나눠서 확인하세요. 카드를 누르면 위 목표로 설정됩니다.</p>
      </header>
      <div className="grid gap-3 p-3 xl:grid-cols-2">
        {groups.map(group => (
          <div key={group.key} className="rounded border border-neutral-700 bg-[#202020]">
            <div className="border-b border-neutral-700 px-3 py-2.5">
              <h3 className="text-sm font-bold text-gray-200">{group.title}</h3>
              <p className="mt-1 text-[11px] leading-4 text-gray-500">{group.description}</p>
            </div>
            {group.items.length ? (
              <div className="flex flex-wrap gap-2 p-3">{group.items.map(item => <ResearchCard key={item.id} item={item} tone={group.tone} onSelect={onSelect} />)}</div>
            ) : <div className="px-3 py-8 text-center text-xs text-gray-600">현재 조건에 해당하는 추천이 없습니다.</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function goalOptionLabel(item) {
  const status = isResearchCompleted(item) ? '완료' : item.unlock.met ? '개발 가능' : '해금 준비'
  return `${item.generation}기 · ${item.name} · ${status}`
}

function isResearchCompleted(item) {
  return isAcquiredStatus(item.character?.acquired)
}

function ResearchFactionProgress({ items }) {
  return (
    <section className="border-t border-neutral-700 bg-[#1a1a1a]">
      <header className="border-b border-neutral-700 bg-[#202020] px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-gray-100">진영별 기술점수 이정표</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">목표 개발함 추천과 별개인 기술점수 참고표입니다. 도감 등록 조건은 포함하지 않습니다.</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-xs">
          <thead className="bg-[#202020] text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">진영</th>
              <th className="px-3 py-2 text-right">현재 기술점수</th>
              <th className="px-3 py-2 text-left">다음 기술점수 해금 함선</th>
              <th className="px-3 py-2 text-right">필요 점수</th>
              <th className="px-3 py-2 text-right">부족 점수</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const nextNames = item.nextTarget?.ships.join(' · ')
              return (
                <tr key={item.faction} className="border-t border-neutral-800 bg-[#242424] hover:bg-[#292929]">
                  <th scope="row" className="px-3 py-2.5 text-left text-sm font-bold text-gray-100">{getFactionDisplayName(item.faction)}</th>
                  <td className="px-3 py-2.5 text-right font-black text-cyan-300">{formatNumber(item.current)}점</td>
                  <td className="min-w-[300px] px-3 py-2.5 font-semibold text-gray-300" title={nextNames || '기술점수 조건 모두 충족'}>
                    {item.nextTarget ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.nextTarget.ships.map(name => {
                          const ship = RESEARCH_SHIP_BY_NAME.get(name)
                          return (
                            <span key={name} className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900/70 px-2 py-1">
                              <span className="text-[10px] font-black text-cyan-300">{ship?.generation || '?'}기</span>
                              <span>{name}</span>
                            </span>
                          )
                        })}
                      </div>
                    ) : <span className="text-emerald-300">기술점수 조건 모두 충족</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-300">
                    {item.nextTarget ? `${formatNumber(item.nextTarget.required)}점` : '-'}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${item.nextTarget ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {item.nextTarget ? `${formatNumber(item.remaining)}점` : '0점'}
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

function ResearchCard({ item, tone, onSelect }) {
  const character = item.character
  const status = normalizeAcquisitionStatus(character?.acquired)
  const artUrl = getCardArtUrl(item)
  const border = tone === 'priority'
    ? 'border-cyan-400'
    : tone === 'ready' || tone === 'quick'
      ? 'border-emerald-500'
      : tone === 'long'
        ? 'border-violet-500'
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
        <CardBadge>{getFactionDisplayName(item.faction)}</CardBadge>
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

function summarizeUnlock(requirements) {
  const first = requirements.find(requirement => !requirement.met) || requirements[0]
  if (!first) return '개발 가능'
  if (first.type === 'roster-count') return `${getFactionDisplayName(first.faction)} ${first.lane} ${first.remaining}명 부족`
  return `${getFactionDisplayName(first.faction)} ${first.remaining}점 부족`
}

function unlockRequirementLabel(requirement) {
  if (requirement.type === 'roster-count') return `${getFactionDisplayName(requirement.faction)} ${requirement.lane} 도감 등록`
  return `${getFactionDisplayName(requirement.faction)} 기술점수`
}

function getCardArtUrl(item) {
  const fileName = item.iconUrl.split('/').pop().replace(/\.(png|webp)$/i, '.png')
  return `${import.meta.env.BASE_URL}ship-card-art/${fileName}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function UnlockCandidateList({ candidates, title = '해금용 육성 추천 후보' }) {
  const visibleCandidates = candidates.slice(0, 5)
  return (
    <div className="mt-3 border-t border-current/15 pt-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{title}</span>
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
