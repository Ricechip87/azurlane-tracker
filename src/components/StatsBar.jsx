import { useState } from 'react'
import { calcMajorFactionTechPoints, MAJOR_TECH_FACTIONS } from '../utils/fleetTech.js'
import { calcFleetTechCandidates, splitFleetTechCandidates } from '../utils/fleetTechCandidates.js'
import { calcStatsByShipType, mergeStatsByShipType, summarizeRoster } from '../utils/rosterStats.js'
import { calcFleetTechLevelStats, calcFleetTechProgress } from '../utils/fleetTechLevelStats.js'

const STAT_ORDER = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const SHIP_TYPE_ORDER = ['구축', '경순', '중순', '대형순', '순전', '전함', '경항모', '항모', '잠수', '항전', '공작', '모니터', '잠항모', '운송', '범선']
const RARITY_COLOR = {
  N: 'text-gray-500',
  R: 'text-blue-300',
  SR: 'text-purple-400',
  SSR: 'text-yellow-300',
  UR: 'text-red-300',
}

export default function StatsBar({ characters }) {
  const fullSummary = summarizeRoster(characters)
  const majorFactionTechPoints = calcMajorFactionTechPoints(characters)
  const majorFactionTechProgress = calcFleetTechProgress(majorFactionTechPoints)

  const [selectedType, setSelectedType] = useState('전함')
  const [previewFaction, setPreviewFaction] = useState(null)

  const acquiredStats = calcStatsByShipType(characters, 'acquired')
  const maxedStats = calcStatsByShipType(characters, '120')
  const levelStats = calcFleetTechLevelStats(majorFactionTechPoints)
  const totalStats = mergeStatsByShipType(acquiredStats, maxedStats, levelStats)
  const previewFactionInfo = MAJOR_TECH_FACTIONS.find(faction => faction.value === previewFaction)
  const previewProgress = previewFaction ? majorFactionTechProgress[previewFaction] : null
  const previewCandidates = previewFaction ? calcFleetTechCandidates(characters, previewFaction) : []

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex flex-wrap">

        {/* 좌측: 간단 통계 */}
        <div className="border-r border-gray-800 shrink-0 w-[360px]">
          <div className="h-9 px-3 flex items-center justify-center text-center text-xs font-semibold text-gray-300 bg-gray-800 border-b border-gray-700">
            간단 통계
          </div>
          <div className="text-xs">
            <SummaryGroup title="전체 보유함 기준" summary={fullSummary} />
          </div>
        </div>

        {/* 가운데: 기술점수 */}
        <div className="border-r border-gray-800 shrink-0 w-[520px]">
          <div className="h-9 px-3 flex items-center text-xs font-semibold text-gray-300 bg-gray-800 border-b border-gray-700">
            획득 기술점수 <span className="ml-1 font-normal text-gray-500">(전체 보유함)</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] divide-x divide-gray-800 text-xs">
            {MAJOR_TECH_FACTIONS.map(faction => {
              const progress = majorFactionTechProgress[faction.value]
              const isOpen = previewFaction === faction.value

              return (
                <div key={faction.value} className="contents">
                  <div className="px-4 py-3 text-gray-300">{faction.label}</div>
                  <div className="px-3 py-3 text-center text-gray-400 whitespace-nowrap">
                    Lv.{progress?.currentLevel?.level || 0}
                  </div>
                  <div className="px-4 py-3 text-right text-blue-300 font-bold">{majorFactionTechPoints[faction.value]}</div>
                  <div className="px-3 py-3 text-right text-gray-500 whitespace-nowrap">
                    {formatNextLevelProgress(progress)}
                  </div>
                  <div className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setPreviewFaction(isOpen ? null : faction.value)}
                      className={`rounded border px-2 py-1 text-xs transition-colors ${isOpen ? 'border-blue-500 bg-blue-600/20 text-blue-200' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-600 hover:text-blue-200'}`}
                    >
                      후보 보기
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 우측: 추가 스탯 */}
        <div className="flex-1 min-w-0">
          <div className="h-9 bg-gray-800 border-b border-gray-700 px-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-300">전체 목록의 추가 스탯</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {SHIP_TYPE_ORDER.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="divide-y divide-gray-800">
            <StatGroup label="인게임 효과 합계" statsByType={totalStats} selectedType={selectedType} sub="획득/120/함대 기술 레벨 기준" />
          </div>
        </div>

      </div>
      {previewFactionInfo && (
        <TechCandidatePreview
          faction={previewFactionInfo}
          progress={previewProgress}
          candidates={previewCandidates}
        />
      )}
    </div>
  )
}

function formatNextLevelProgress(progress) {
  if (!progress) return '-'
  if (progress.isMaxLevel) return 'MAX'
  return `다음 ${progress.pointsToNext}`
}

function TechCandidatePreview({ faction, progress, candidates }) {
  const splitCandidates = splitFleetTechCandidates(candidates)

  return (
    <div className="border-t border-gray-800 bg-gray-950/40">
      <div className="h-9 px-4 flex items-center gap-3 bg-gray-800/80 border-b border-gray-700 text-xs">
        <span className="font-semibold text-gray-200">{faction.label} 기술점수 후보</span>
        <span className="text-gray-500">{formatNextLevelProgress(progress)}</span>
      </div>
      <div className="p-3 space-y-3">
        <CandidateSection title="UR / SSR" candidates={splitCandidates.high} />
        <CandidateSection title="SR / R / N" candidates={splitCandidates.low} />
      </div>
    </div>
  )
}

function CandidateSection({ title, candidates }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-gray-400">{title}</div>
      {candidates.length ? (
        <div className="max-h-72 overflow-auto border border-gray-800">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-normal">함선</th>
                <th className="px-2 py-2 text-center font-normal">등급</th>
                <th className="px-2 py-2 text-center font-normal">현재 상태</th>
                <th className="px-2 py-2 text-right font-normal">획득</th>
                <th className="px-2 py-2 text-right font-normal">풀돌</th>
                <th className="px-2 py-2 text-right font-normal">120</th>
                <th className="px-2 py-2 text-right font-normal">남은 기술점수</th>
                <th className="px-3 py-2 text-right font-normal">효율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {candidates.map(candidate => (
                <tr key={candidate.id} className="hover:bg-gray-900/70">
                  <td className="px-3 py-1.5 text-gray-200">{candidate.name}</td>
                  <td className={`px-2 py-1.5 text-center font-bold ${RARITY_COLOR[candidate.rarity] || 'text-gray-400'}`}>{candidate.rarity}</td>
                  <td className="px-2 py-1.5 text-center text-gray-400">{candidate.status}</td>
                  <StageCell stage={candidate.stages.acquired} />
                  <StageCell stage={candidate.stages.maxLB} />
                  <StageCell stage={candidate.stages.level120} />
                  <td className="px-2 py-1.5 text-right font-bold text-blue-300">{candidate.remainingTechPoints}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-yellow-300">{candidate.efficiency.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-800 px-3 py-3 text-xs text-gray-600">후보 없음</div>
      )}
    </div>
  )
}

function StageCell({ stage }) {
  return (
    <td className="px-2 py-1.5 text-right">
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

function StatGroup({ label, statsByType, selectedType, sub }) {
  const typeStats = statsByType[selectedType] || {}
  const hasData = Object.keys(typeStats).length > 0

  return (
    <div className="px-4 py-2 min-w-0">
      <div className="text-xs text-gray-400 mb-1.5 font-medium">{label}</div>
      <table className="text-xs w-full">
        <thead>
          <tr className="text-gray-600">
            <th className="text-left pr-3 font-normal">함종</th>
            {STAT_ORDER.map(s => (
              <th key={s} className="px-1 font-normal text-center">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-800">
            <td className="pr-3 py-0.5 text-gray-400 whitespace-nowrap">{selectedType}</td>
            {STAT_ORDER.map(stat => (
              <td key={stat} className="px-1 py-0.5 text-center">
                {typeStats[stat]
                  ? <span className="font-bold text-yellow-300">{typeStats[stat]}</span>
                  : <span className="text-gray-700">-</span>
                }
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {!hasData && <div className="text-xs text-gray-600 mt-1">해당 함종 데이터 없음</div>}
      <div className="mt-1 text-xs text-gray-600">* {sub}</div>
    </div>
  )
}
