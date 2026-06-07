import { Fragment, useRef, useState } from 'react'
import { calcMajorFactionTechPoints, MAJOR_TECH_FACTIONS } from '../utils/fleetTech.js'
import {
  calcFleetTechCandidates,
  FLEET_TECH_CANDIDATE_BASIS,
  splitFleetTechCandidates,
} from '../utils/fleetTechCandidates.js'
import { summarizeRoster } from '../utils/rosterStats.js'
import { calcFleetTechProgress } from '../utils/fleetTechLevelStats.js'
import { normalizeStatShipTypeValue } from '../utils/shipClassifications.js'
import fleetTechGuideImage from '../assets/loading-illustrations/100021-painting.png'
import ussFleetTechImage from '../assets/fleet-tech-guides/uss-new-jersey.png'
import hmsFleetTechImage from '../assets/fleet-tech-guides/hms-albion.png'
import ijnFleetTechImage from '../assets/fleet-tech-guides/ijn-shinano.png'
import kmsFleetTechImage from '../assets/fleet-tech-guides/kms-bismarck-zwei.png'

const STAT_ORDER = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const SHIP_TYPE_ORDER = ['구축', '경순', '중순', '대형순', '순전', '전함', '경항모', '항모', '잠수', '항전', '공작', '모니터', '잠항모', '운송', '범선']
const RARITY_COLOR = {
  N: 'text-gray-500',
  R: 'text-blue-300',
  SR: 'text-purple-400',
  SSR: 'text-yellow-300',
  UR: 'text-red-300',
}

const FLEET_TECH_GUIDE_IMAGES = {
  유니온: ussFleetTechImage,
  로열: hmsFleetTechImage,
  중앵: ijnFleetTechImage,
  철혈: kmsFleetTechImage,
}

export default function StatsBar({ characters }) {
  const fullSummary = summarizeRoster(characters)

  return (
    <div className="relative w-[360px] bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="h-9 px-3 flex items-center justify-center text-center text-xs font-semibold text-gray-300 bg-gray-800 border-b border-gray-700">
        간단 통계
      </div>
      <div className="text-xs">
        <SummaryGroup title="현재 보유함 기준" summary={fullSummary} />
      </div>
    </div>
  )
}

export function FleetTechPanel({ characters, className = '', detailMode = 'popover' }) {
  const majorFactionTechPoints = calcMajorFactionTechPoints(characters)
  const majorFactionTechProgress = calcFleetTechProgress(majorFactionTechPoints)
  const usesInlineDetail = detailMode === 'inline'
  const inlineCellClass = usesInlineDetail ? 'flex min-h-[52px] items-center justify-center text-center' : ''
  const gridClass = usesInlineDetail
    ? 'grid-cols-[1.15fr_1fr_1fr_0.9fr_1.35fr_1fr]'
    : 'grid-cols-[1fr_auto_auto_auto_auto]'

  const [previewFaction, setPreviewFaction] = useState(null)
  const [effectFaction, setEffectFaction] = useState(null)
  const [inlineDetail, setInlineDetail] = useState(null)
  const [inlineImageContext, setInlineImageContext] = useState(null)
  const previewCloseTimer = useRef(null)
  const effectCloseTimer = useRef(null)

  const cancelPreviewClose = () => {
    if (previewCloseTimer.current) clearTimeout(previewCloseTimer.current)
  }

  const schedulePreviewClose = () => {
    cancelPreviewClose()
    previewCloseTimer.current = setTimeout(() => setPreviewFaction(null), 180)
  }

  const cancelEffectClose = () => {
    if (effectCloseTimer.current) clearTimeout(effectCloseTimer.current)
  }

  const scheduleEffectClose = () => {
    cancelEffectClose()
    effectCloseTimer.current = setTimeout(() => setEffectFaction(null), 180)
  }

  const showInlineDetail = (type, factionValue) => {
    setInlineDetail(current => (
      current?.type === type && current?.factionValue === factionValue ? null : { type, factionValue }
    ))
    setInlineImageContext({ type, factionValue })
    setPreviewFaction(null)
    setEffectFaction(null)
  }

  const inlineFaction = inlineDetail
    ? MAJOR_TECH_FACTIONS.find(faction => faction.value === inlineDetail.factionValue)
    : null
  const inlineProgress = inlineFaction ? majorFactionTechProgress[inlineFaction.value] : null

  return (
    <div className={className}>
      <div className="h-9 px-3 flex items-center text-xs font-semibold text-gray-300 bg-gray-800 border-b border-gray-700">
        획득 기술점수 <span className="ml-1 font-normal text-gray-500">(현재 보유함)</span>
      </div>
      <div className={usesInlineDetail ? 'grid gap-4 p-4 xl:grid-cols-[724px_minmax(0,1fr)]' : ''}>
        <div className={usesInlineDetail ? 'min-w-0 overflow-visible border border-gray-800 bg-gray-950' : 'overflow-visible'}>
          {usesInlineDetail && (
            <div className={`grid ${gridClass} divide-x divide-gray-800 border-b border-gray-800 bg-gray-900 text-xs text-gray-500`}>
              <div className={`${inlineCellClass} px-3 py-2`}>진영</div>
              <div className={`${inlineCellClass} px-3 py-2`}>현재 달성 레벨</div>
              <div className={`${inlineCellClass} px-3 py-2`}>레벨 달성 효과</div>
              <div className={`${inlineCellClass} px-3 py-2`}>현재 점수</div>
              <div className={`${inlineCellClass} px-3 py-2`}>
                <span>다음 레벨까지<br />남은 점수</span>
              </div>
              <div className={`${inlineCellClass} px-3 py-2`}>육성 추천 후보</div>
            </div>
          )}
          <div className={`grid ${gridClass} divide-x divide-gray-800 text-xs`}>
            {MAJOR_TECH_FACTIONS.map(faction => {
              const progress = majorFactionTechProgress[faction.value]
              const isCandidateOpen = previewFaction === faction.value
              const isEffectOpen = effectFaction === faction.value

              return (
                <div key={faction.value} className="contents">
                  <div className={`${inlineCellClass} px-4 py-3 text-gray-300`}>{faction.label}</div>
                  {usesInlineDetail && (
                    <div className={`${inlineCellClass} px-3 py-3 font-semibold text-blue-200 whitespace-nowrap`}>
                      LV.{progress?.currentLevel?.level || 0}
                    </div>
                  )}
                  <div
                    className={`${inlineCellClass} relative px-3 py-2 whitespace-nowrap`}
                    onMouseEnter={usesInlineDetail ? undefined : cancelEffectClose}
                    onMouseLeave={usesInlineDetail ? undefined : scheduleEffectClose}
                  >
                    <button
                      type="button"
                      onClick={() => usesInlineDetail
                        ? showInlineDetail('effect', faction.value)
                        : (() => {
                            setEffectFaction(isEffectOpen ? null : faction.value)
                            setPreviewFaction(null)
                          })()
                      }
                      className={`rounded border px-2 py-1 text-xs transition-colors ${(usesInlineDetail ? inlineDetail?.type === 'effect' && inlineDetail?.factionValue === faction.value : isEffectOpen) ? 'border-cyan-500 bg-cyan-600/20 text-cyan-200' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-cyan-600 hover:text-cyan-200'}`}
                    >
                      {usesInlineDetail ? '달성 효과' : `LV.${progress?.currentLevel?.level || 0} 달성 효과`}
                    </button>
                    {!usesInlineDetail && isEffectOpen && (
                      <LevelEffectPopover
                        faction={faction}
                        progress={progress}
                        onMouseEnter={cancelEffectClose}
                        onMouseLeave={scheduleEffectClose}
                      />
                    )}
                  </div>
                  <div className={`${inlineCellClass} px-4 py-3 text-blue-300 font-bold`}>{majorFactionTechPoints[faction.value]}</div>
                  <div className={`${inlineCellClass} px-3 py-3 text-gray-500 whitespace-nowrap`}>
                    {formatNextLevelProgress(progress)}
                  </div>
                  <div
                    className={`${inlineCellClass} relative px-3 py-2`}
                    onMouseEnter={usesInlineDetail ? undefined : cancelPreviewClose}
                    onMouseLeave={usesInlineDetail ? undefined : schedulePreviewClose}
                  >
                    <button
                      type="button"
                      onClick={() => usesInlineDetail
                        ? showInlineDetail('candidate', faction.value)
                        : (() => {
                            setPreviewFaction(isCandidateOpen ? null : faction.value)
                            setEffectFaction(null)
                          })()
                      }
                      className={`rounded border px-2 py-1 text-xs transition-colors ${(usesInlineDetail ? inlineDetail?.type === 'candidate' && inlineDetail?.factionValue === faction.value : isCandidateOpen) ? 'border-blue-500 bg-blue-600/20 text-blue-200' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-600 hover:text-blue-200'}`}
                    >
                      후보 보기
                    </button>
                    {!usesInlineDetail && isCandidateOpen && (
                      <TechCandidatePopover
                        faction={faction}
                        progress={progress}
                        characters={characters}
                        onMouseEnter={cancelPreviewClose}
                        onMouseLeave={schedulePreviewClose}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {usesInlineDetail && (
            <FleetTechGuideImagePanel context={inlineImageContext} />
          )}
        </div>
        {usesInlineDetail && (
          <div className="h-[760px] min-h-[760px] border border-gray-800 bg-gray-950/50">
            {inlineFaction ? (
              inlineDetail.type === 'effect' ? (
                <LevelEffectSection faction={inlineFaction} progress={inlineProgress} />
              ) : (
                <TechCandidateSection
                  key={inlineFaction.value}
                  faction={inlineFaction}
                  progress={inlineProgress}
                  characters={characters}
                />
              )
            ) : (
              <TechDetailEmptyState />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FleetTechGuideImagePanel({ context }) {
  const imageContextKey = context ? `${context.factionValue}:${context.type}` : 'default'
  const imageSrc = context ? FLEET_TECH_GUIDE_IMAGES[context.factionValue] || fleetTechGuideImage : fleetTechGuideImage

  return (
    <section className="border-t border-gray-800 bg-gray-950 p-4">
      <div key={imageContextKey} className="overflow-hidden rounded border border-gray-700 bg-gray-900 shadow-lg shadow-gray-950/50">
        <div className="aspect-video bg-gray-950">
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="border-t border-gray-800 px-4 py-3 text-sm text-gray-500">
          아 여기에 무슨 정보를 표기하지... 추천 받습니다.
        </div>
      </div>
    </section>
  )
}

function formatNextLevelProgress(progress) {
  if (!progress) return '-'
  if (progress.isMaxLevel) return 'MAX'
  return `다음 ${progress.pointsToNext}`
}

function LevelEffectPopover({ faction, progress, onMouseEnter, onMouseLeave }) {
  const currentLevel = progress?.currentLevel
  const effects = summarizeLevelEffects(currentLevel)
  const hasEffects = effects.length > 0

  return (
    <div
      className="absolute left-0 top-full z-30 mt-1 w-[420px] max-w-[calc(100vw-2rem)] rounded border border-gray-700 bg-gray-950 text-left shadow-2xl"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="h-8 px-3 flex items-center gap-3 bg-gray-800 border-b border-gray-700 text-xs">
        <span className="font-semibold text-gray-200">{faction.label} LV.{currentLevel?.level || 0} 달성 효과</span>
        <span className="text-gray-500">{currentLevel ? `${currentLevel.pt}점 기준` : '효과 없음'}</span>
      </div>
      {hasEffects ? (
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-gray-900 text-gray-500">
              <tr>
                <th className="px-3 py-1.5 text-left font-normal">함종</th>
                <th className="px-3 py-1.5 text-left font-normal">스탯</th>
                <th className="px-3 py-1.5 text-right font-normal">효과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {effects.map(effect => (
                <tr key={`${effect.shipType}:${effect.stat}`} className="hover:bg-gray-900/70">
                  <td className="px-3 py-1.5 text-gray-300">{effect.shipType}</td>
                  <td className="px-3 py-1.5 text-gray-400">{effect.stat}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-yellow-300">+{effect.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-3 py-3 text-xs text-gray-600">현재 레벨 효과 없음</div>
      )}
    </div>
  )
}

function LevelEffectSection({ faction, progress }) {
  const currentLevel = progress?.currentLevel
  const effects = summarizeLevelEffects(currentLevel)
  const hasEffects = effects.length > 0

  return (
    <section className="flex h-full flex-col p-4">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
        <h3 className="text-sm font-bold text-gray-100">{faction.label} LV.{currentLevel?.level || 0} 달성 효과</h3>
        <span className="text-xs text-gray-500">{currentLevel ? `${currentLevel.pt}점 기준` : '효과 없음'}</span>
      </div>
      {hasEffects ? (
        <div className="min-h-0 flex-1 overflow-auto border border-gray-800 bg-gray-950">
          <LevelEffectTable effects={effects} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center border border-gray-800 bg-gray-950 px-4 py-6 text-sm text-gray-600">현재 레벨 효과 없음</div>
      )}
    </section>
  )
}

function LevelEffectTable({ effects }) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-900 text-gray-500">
        <tr>
          <th className="px-3 py-1.5 text-left font-normal">함종</th>
          <th className="px-3 py-1.5 text-left font-normal">스탯</th>
          <th className="px-3 py-1.5 text-right font-normal">효과</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-900">
        {effects.map(effect => (
          <tr key={`${effect.shipType}:${effect.stat}`} className="hover:bg-gray-900/70">
            <td className="px-3 py-1.5 text-gray-300">{effect.shipType}</td>
            <td className="px-3 py-1.5 text-gray-400">{effect.stat}</td>
            <td className="px-3 py-1.5 text-right font-bold text-yellow-300">+{effect.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function summarizeLevelEffects(level) {
  const effects = []
  const seen = new Set()

  for (const bonus of level?.bonuses || []) {
    const shipType = normalizeStatShipTypeValue(bonus.shipType)
    const key = `${shipType}:${bonus.stat}`
    if (seen.has(key)) continue
    seen.add(key)
    effects.push({
      shipType,
      stat: bonus.stat,
      value: bonus.value || 0,
    })
  }

  return effects.sort((a, b) => {
    const shipTypeRank = SHIP_TYPE_ORDER.indexOf(a.shipType) - SHIP_TYPE_ORDER.indexOf(b.shipType)
    if (shipTypeRank !== 0) return shipTypeRank
    return STAT_ORDER.indexOf(a.stat) - STAT_ORDER.indexOf(b.stat)
  })
}

const CANDIDATE_BASIS_OPTIONS = [
  { value: FLEET_TECH_CANDIDATE_BASIS.LEVEL_120, label: '벽청년 이상' },
  { value: FLEET_TECH_CANDIDATE_BASIS.MAX_LB, label: '벽뉴비 권장' },
]

function TechCandidatePopover({ faction, progress, characters, onMouseEnter, onMouseLeave }) {
  const [basis, setBasis] = useState(FLEET_TECH_CANDIDATE_BASIS.LEVEL_120)
  const candidates = calcFleetTechCandidates(characters, faction.value, { basis })
  const candidateGroups = splitFleetTechCandidates(candidates, basis)
  const hasCandidates = candidates.length > 0

  return (
    <div
      className="absolute right-0 top-full z-30 mt-1 w-[780px] max-w-[calc(100vw-2rem)] rounded border border-gray-700 bg-gray-950 text-left shadow-2xl"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="min-h-10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-gray-800 border-b border-gray-700 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-200">{faction.label} 기술점수 후보</span>
          <span className="text-gray-500">{formatNextLevelProgress(progress)}</span>
        </div>
        <CandidateBasisToggle basis={basis} setBasis={setBasis} />
      </div>
      {hasCandidates ? (
        <CandidateTable basis={basis} candidateGroups={candidateGroups} />
      ) : (
        <div className="px-3 py-3 text-xs text-gray-600">후보 없음</div>
      )}
    </div>
  )
}

function TechCandidateSection({ faction, progress, characters }) {
  const [basis, setBasis] = useState(FLEET_TECH_CANDIDATE_BASIS.LEVEL_120)
  const candidates = calcFleetTechCandidates(characters, faction.value, { basis })
  const candidateGroups = splitFleetTechCandidates(candidates, basis)
  const hasCandidates = candidates.length > 0

  return (
    <section className="flex h-full flex-col p-4">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-gray-100">{faction.label} 기술점수 후보</h3>
          <span className="text-xs text-gray-500">{formatNextLevelProgress(progress)}</span>
        </div>
        <CandidateBasisToggle basis={basis} setBasis={setBasis} />
      </div>
      {hasCandidates ? (
        <div className="min-h-0 flex-1 overflow-hidden border border-gray-800 bg-gray-950">
          <CandidateTable basis={basis} candidateGroups={candidateGroups} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center border border-gray-800 bg-gray-950 px-4 py-6 text-sm text-gray-600">후보 없음</div>
      )}
    </section>
  )
}

function TechDetailEmptyState() {
  return (
    <div className="flex h-full min-h-[264px] items-center justify-center px-6 py-10 text-center">
      <div>
        <div className="text-sm font-semibold text-gray-300">상세 정보 선택</div>
        <div className="mt-2 text-xs leading-5 text-gray-600">
          왼쪽 표에서 `달성 효과` 또는 `후보 보기`를 누르면 이 영역에 상세 내용이 표시됩니다.
        </div>
      </div>
    </div>
  )
}

function CandidateBasisToggle({ basis, setBasis }) {
  return (
    <div className="flex overflow-hidden rounded border border-gray-700 bg-gray-950">
      {CANDIDATE_BASIS_OPTIONS.map(option => {
        const isActive = basis === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setBasis(option.value)}
            className={`h-7 px-3 text-xs font-semibold transition-colors ${isActive ? 'bg-blue-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function CandidateTable({ basis, candidateGroups }) {
  const showsLevel120 = basis === FLEET_TECH_CANDIDATE_BASIS.LEVEL_120
  const columnSpan = showsLevel120 ? 9 : 8

  return (
    <div className="h-full overflow-auto">
      <table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[11%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          {showsLevel120 && <col className="w-[9%]" />}
          <col className="w-[16%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-gray-900 text-gray-500">
          <tr>
            <th className="px-3 py-1.5 text-left font-normal">함선</th>
            <th className="px-2 py-1.5 text-center font-normal">등급</th>
            <th className="px-2 py-1.5 text-center font-normal">구분</th>
            <th className="px-2 py-1.5 text-center font-normal">현재 상태</th>
            <th className="px-2 py-1.5 text-center align-middle font-normal">획득</th>
            <th className="px-2 py-1.5 text-center align-middle font-normal">풀돌</th>
            {showsLevel120 && <th className="px-2 py-1.5 text-center align-middle font-normal">120</th>}
            <th className="px-2 py-1.5 text-center align-middle font-normal leading-4">
              <span>획득 가능<br />기술점수</span>
            </th>
            <th className="px-3 py-1.5 text-center align-middle font-normal">효율</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-900">
          {candidateGroups.map(group => (
            <Fragment key={group.key}>
              <CandidateGroupRow title={group.title} columnSpan={columnSpan} />
              <CandidateRows candidates={group.candidates} columnSpan={columnSpan} showsLevel120={showsLevel120} />
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CandidateGroupRow({ title, columnSpan }) {
  return (
    <tr className="bg-gray-900/80">
      <td colSpan={columnSpan} className="px-3 py-1.5 text-xs font-semibold text-gray-400">{title}</td>
    </tr>
  )
}

function CandidateRows({ candidates, columnSpan, showsLevel120 }) {
  if (!candidates.length) {
    return (
      <tr>
        <td colSpan={columnSpan} className="px-3 py-2 text-xs text-gray-600">후보 없음</td>
      </tr>
    )
  }

  return candidates.map(candidate => (
    <tr key={candidate.id} className="hover:bg-gray-900/70">
      <td className="truncate px-3 py-1.5 text-gray-200">{candidate.name}</td>
      <td className={`px-2 py-1.5 text-center font-bold ${RARITY_COLOR[candidate.rarity] || 'text-gray-400'}`}>{candidate.rarity}</td>
      <td className="px-2 py-1.5 text-center text-gray-500">{candidate.position}</td>
      <td className="px-2 py-1.5 text-center text-gray-400">{candidate.status}</td>
      <StageCell stage={candidate.stages.acquired} />
      <StageCell stage={candidate.stages.maxLB} />
      {showsLevel120 && <StageCell stage={candidate.stages.level120} />}
      <td className="px-2 py-1.5 text-center align-middle font-bold text-blue-300">{candidate.remainingTechPoints}</td>
      <td className="px-3 py-1.5 text-center align-middle font-bold text-yellow-300">{candidate.efficiency.toFixed(1)}</td>
    </tr>
  ))
}

function StageCell({ stage }) {
  return (
    <td className="px-2 py-1.5 text-center align-middle">
      {stage.completed
        ? <span className="text-gray-600">완료</span>
        : <span className="text-blue-300">{stage.value ? `+${stage.value}` : '-'}</span>
      }
    </td>
  )
}

function SummaryGroup({ title, summary }) {
  return (
    <div>
      <div className="px-4 py-1.5 text-gray-300 font-semibold bg-gray-800/50">{title}</div>
      <div className="grid grid-cols-2 divide-x divide-gray-800">
        <div className="px-4 py-1.5 text-gray-400">목록 수집률</div>
        <div className="px-4 py-1.5 text-blue-300 font-bold">{summary.collectionRate}%</div>
        <div className="px-4 py-1.5 text-gray-400">보유 수 / 목록 수</div>
        <div className="px-4 py-1.5 text-blue-300 font-bold">{summary.acquired} / {summary.total}</div>
        <div className="px-4 py-1.5 text-gray-400">120 이상</div>
        <div className="px-4 py-1.5 text-blue-300 font-bold">{summary.level120}</div>
        <div className="px-4 py-1.5 text-gray-400">125 이상</div>
        <div className="px-4 py-1.5 text-blue-300 font-bold">{summary.level125}</div>
        <div className="px-4 py-1.5 text-gray-400">서약</div>
        <div className="px-4 py-1.5 text-blue-300 font-bold">{summary.oath}</div>
      </div>
    </div>
  )
}
