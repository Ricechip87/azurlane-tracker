import { ACQUISITION_FILTER_OPTIONS } from '../utils/acquisitionStatus.js'

const RARITIES = ['전체', 'N', 'R', 'SR', 'SSR', 'UR']
const SKILLED_OPTS = ['전체', '스작 완료', '스작 중', '스작 안함']
const AFFECTION_OPTS = ['전체', '호감도 Max', '서약 완료', '호감작 중', '호감작 안함']
const REMODEL_OPTS = ['전체', '개장', '미개장']

export default function FilterPanel({ filters, setFilters, characters }) {
  const shipTypes = ['전체', ...new Set(characters.map(c => c.shipType).filter(Boolean))]
  const factions = ['전체', ...new Set(characters.map(c => c.faction).filter(Boolean))]

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">이름 검색</label>
          <input
            type="text"
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            placeholder="이름 입력..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-40 focus:outline-none focus:border-blue-500"
          />
        </div>

        <Select label="레어도" value={filters.rarity} onChange={v => set('rarity', v)} options={RARITIES} />
        <Select label="함종" value={filters.shipType} onChange={v => set('shipType', v)} options={shipTypes} />
        <Select label="진영" value={filters.faction} onChange={v => set('faction', v)} options={factions} />
        <Select label="획득 여부" value={filters.acquired} onChange={v => set('acquired', v)} options={ACQUISITION_FILTER_OPTIONS} />
        <Select label="스킬작" value={filters.skilled} onChange={v => set('skilled', v)} options={SKILLED_OPTS} />
        <Select label="호감작" value={filters.affection} onChange={v => set('affection', v)} options={AFFECTION_OPTS} />
        <Select label="개장" value={filters.remodel} onChange={v => set('remodel', v)} options={REMODEL_OPTS} />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={e => set('favoritesOnly', e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          <span className="text-yellow-400">★ 즐겨찾기만</span>
        </label>

        <button
          onClick={() => setFilters({ search: '', rarity: '전체', shipType: '전체', faction: '전체', acquired: '전체', skilled: '전체', affection: '전체', remodel: '전체', favoritesOnly: false })}
          className="text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded px-2 py-1.5"
        >
          초기화
        </button>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
