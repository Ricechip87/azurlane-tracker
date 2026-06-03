export default function StatsBar({ characters, filtered }) {
  const total = characters.length
  const acquired = characters.filter(c => c.acquired === '획득').length
  const filteredAcquired = filtered.filter(c => c.acquired === '획득').length

  const rate = total ? ((acquired / total) * 100).toFixed(1) : 0
  const filteredRate = filtered.length ? ((filteredAcquired / filtered.length) * 100).toFixed(1) : 0

  const totalSP = characters.reduce((s, c) => s + (c.skillPoints || 0), 0)
  const acquiredSP = characters
    .filter(c => c.acquired === '획득')
    .reduce((s, c) => s + (c.skillPoints || 0), 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="전체 수집률" value={`${rate}%`} sub={`${acquired} / ${total}`} />
      <StatCard label="표시 목록 수집률" value={`${filteredRate}%`} sub={`${filteredAcquired} / ${filtered.length}`} />
      <StatCard label="획득 기술점수" value={acquiredSP} sub={`전체 ${totalSP}`} />
      <StatCard label="표시 목록 수" value={filtered.length} sub={`전체 ${total}`} />
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-blue-300">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  )
}
