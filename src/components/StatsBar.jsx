import { useState } from 'react'
import { isAcquiredStatus, isLevel120Status } from '../utils/acquisitionStatus.js'
import { calcMajorFactionTechPoints, MAJOR_TECH_FACTIONS } from '../utils/fleetTech.js'

const STAT_ORDER = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const SHIP_TYPE_ORDER = ['구축', '경순', '중순', '대순', '경항모', '항모', '전함', '순전', '항전', '잠수', '잠순', '모니터', '보급']

// { 함종: { 스탯: 합계 } }
function calcStatsByShipType(characters, mode) {
  const result = {}
  for (const c of characters) {
    const isAcquired = isAcquiredStatus(c.acquired)
    const isMaxed = isLevel120Status(c.acquired)

    const data = mode === '입수' ? (isAcquired ? c.statAcquired : null)
                                 : (isMaxed ? c.stat120 : null)

    if (!data?.stat || !data.shipTypes?.length) continue

    for (const shipType of data.shipTypes) {
      if (!result[shipType]) result[shipType] = {}
      result[shipType][data.stat] = (result[shipType][data.stat] || 0) + (data.value || 0)
    }
  }
  return result
}

export default function StatsBar({ characters, filtered }) {
  const total = characters.length
  const acquiredCount = filtered.filter(c => isAcquiredStatus(c.acquired)).length
  const maxed = filtered.filter(c => isLevel120Status(c.acquired)).length
  const rate = filtered.length ? ((acquiredCount / filtered.length) * 100).toFixed(1) : 0
  const majorFactionTechPoints = calcMajorFactionTechPoints(characters)

  const [selectedType, setSelectedType] = useState('전함')

  const acquiredStats = calcStatsByShipType(filtered, '입수')
  const maxedStats = calcStatsByShipType(filtered, '120')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex flex-wrap">

        {/* 좌측: 간단 통계 */}
        <div className="border-r border-gray-800 shrink-0">
          <div className="h-9 px-3 flex items-center justify-center text-center text-xs font-semibold text-gray-300 bg-gray-800 border-b border-gray-700">
            간단 통계
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-800 text-xs">
            <div className="px-4 py-1.5 text-gray-400">표시 목록 수집률</div>
            <div className="px-4 py-1.5 text-blue-300 font-bold">{rate}%</div>
            <div className="px-4 py-1.5 text-gray-400">표시 목록 수 (전체)</div>
            <div className="px-4 py-1.5 text-blue-300 font-bold">{filtered.length} ({total})</div>
            <div className="px-4 py-1.5 text-gray-400">120 이상</div>
            <div className="px-4 py-1.5 text-blue-300 font-bold">{maxed}</div>
            <div className="col-span-2 px-4 py-1.5 text-gray-300 font-semibold bg-gray-800/60 border-t border-gray-800">
              획득 기술점수 <span className="font-normal text-gray-500">(전체 보유함)</span>
            </div>
            {MAJOR_TECH_FACTIONS.map(faction => (
              <div key={faction.value} className="contents">
                <div className="px-4 py-1.5 text-gray-400">{faction.label}</div>
                <div className="px-4 py-1.5 text-blue-300 font-bold">{majorFactionTechPoints[faction.value]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 추가 스탯 */}
        <div className="flex-1 min-w-0">
          <div className="h-9 bg-gray-800 border-b border-gray-700 px-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-300">표시된 목록의 추가 스탯</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {SHIP_TYPE_ORDER.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex divide-x divide-gray-800">
            <StatGroup label="입수 스탯 총합" statsByType={acquiredStats} selectedType={selectedType} sub="획득/풀돌/100/120/125 기준" />
            <StatGroup label="120 스탯 총합" statsByType={maxedStats} selectedType={selectedType} sub="120/125 기준" />
          </div>
        </div>

      </div>
    </div>
  )
}

function StatGroup({ label, statsByType, selectedType, sub }) {
  const typeStats = statsByType[selectedType] || {}
  const hasData = Object.keys(typeStats).length > 0

  return (
    <div className="flex-1 px-4 py-2 min-w-0">
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
