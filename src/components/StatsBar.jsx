import { summarizeRoster } from '../utils/rosterStats.js'

export default function StatsBar({ characters }) {
  const fullSummary = summarizeRoster(characters)

  return (
    <div className="relative w-[360px] overflow-hidden rounded-lg border border-neutral-700 bg-[#242424]">
      <div className="flex h-9 items-center justify-center border-b border-neutral-700 bg-[#2b2b2b] px-3 text-center text-xs font-semibold text-gray-300">
        간단 통계
      </div>
      <div className="text-xs">
        <SummaryGroup title="현재 보유함 기준" summary={fullSummary} />
      </div>
    </div>
  )
}
function SummaryGroup({ title, summary }) {
  return (
    <div>
      <div className="bg-[#2b2b2b] px-4 py-1.5 font-semibold text-gray-300">{title}</div>
      <div className="grid grid-cols-2 divide-x divide-neutral-800">
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
