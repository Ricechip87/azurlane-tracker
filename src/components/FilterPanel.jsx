import { ACQUISITION_FILTER_OPTIONS } from '../utils/acquisitionStatus.js'
import { getFactionOptions } from '../utils/factions.js'
import { SHIP_CLASSIFICATION_OPTIONS } from '../utils/shipClassifications.js'

const RARITIES = ['전체', 'N', 'R', 'SR', 'SSR', 'UR']
const SKILLED_OPTS = ['전체', '스작 완료', '스작 중', '스작 안함']
const AFFECTION_OPTS = ['전체', '호감도 Max', '서약 완료', '호감작 중', '호감작 안함']
const REMODEL_OPTS = ['전체', '없음', '미개장', '개장']
const SHIP_CLASSIFICATION_FILTER_OPTIONS = [
  '전체',
  { value: '__ship-classification-primary-divider', label: '────────', disabled: true },
  '전열',
  '후열',
  { value: '__ship-classification-detail-divider', label: '────────', disabled: true },
  ...SHIP_CLASSIFICATION_OPTIONS.filter(option => !['전체', '전열', '후열'].includes(option)),
]

export default function FilterPanel({ filters, setFilters, characters }) {
  const factions = getFactionOptions(characters.map(c => c.faction))

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const toggleButtonBase = 'h-[34px] text-xs border rounded px-3 py-1.5 transition-colors'
  const inactiveToggleButton = 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'

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
        <Select label="분류" value={filters.shipType} onChange={v => set('shipType', v)} options={SHIP_CLASSIFICATION_FILTER_OPTIONS} />
        <Select label="진영" value={filters.faction} onChange={v => set('faction', v)} options={factions} />
        <Select label="획득 여부" value={filters.acquired} onChange={v => set('acquired', v)} options={ACQUISITION_FILTER_OPTIONS} />
        <Select label="스킬작" value={filters.skilled} onChange={v => set('skilled', v)} options={SKILLED_OPTS} />
        <Select label="호감작" value={filters.affection} onChange={v => set('affection', v)} options={AFFECTION_OPTS} />
        <Select label="개장" value={filters.remodel} onChange={v => set('remodel', v)} options={REMODEL_OPTS} />

        <button
          type="button"
          aria-pressed={filters.favoritesOnly}
          onClick={() => set('favoritesOnly', !filters.favoritesOnly)}
          className={`${toggleButtonBase} ${filters.favoritesOnly ? 'border-yellow-500 bg-yellow-500/15 text-yellow-300' : inactiveToggleButton}`}
        >
          ★ 즐겨찾기만
        </button>

        <button
          type="button"
          aria-pressed={filters.researchOnly}
          onClick={() => set('researchOnly', !filters.researchOnly)}
          className={`${toggleButtonBase} ${filters.researchOnly ? 'border-cyan-500 bg-cyan-600/20 text-cyan-200' : inactiveToggleButton}`}
        >
          연구함만
        </button>

        <button
          type="button"
          onClick={() => setFilters({ search: '', rarity: '전체', shipType: '전체', faction: '전체', acquired: '전체', skilled: '전체', affection: '전체', remodel: '전체', favoritesOnly: false, researchOnly: false })}
          className="h-[34px] text-xs text-gray-400 hover:text-gray-200 hover:border-gray-600 border border-gray-700 rounded px-3 py-1.5 transition-colors"
        >
          필터 초기화
        </button>
      </div>
    </div>
  )
}

function getOptionValue(option) {
  return typeof option === 'string' ? option : option.value
}

function getOptionLabel(option) {
  return typeof option === 'string' ? option : option.label
}

function isOptionDisabled(option) {
  return typeof option === 'object' && option.disabled
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
        {options.map(o => (
          <option key={getOptionValue(o)} value={getOptionValue(o)} disabled={isOptionDisabled(o)}>
            {getOptionLabel(o)}
          </option>
        ))}
      </select>
    </div>
  )
}
