import { calcTechPoints } from '../utils/techPoints.js'
import { ACQUISITION_STATUSES, normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'

const RARITY_COLOR = {
  N: 'text-gray-400',
  R: 'text-blue-400',
  SR: 'text-purple-400',
  SSR: 'text-yellow-400',
  UR: 'text-red-400',
}

const SKILLED_OPTS = ['스작 안함', '스작 중', '스작 완료']
const AFFECTION_OPTS = ['호감작 안함', '호감작 중', '서약 완료', '호감도 Max']

export default function CharacterTable({ characters, updateUser }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-xs">
              <th className="px-3 py-2 text-left w-8">★</th>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-center">레어도</th>
              <th className="px-3 py-2 text-center">함종</th>
              <th className="px-3 py-2 text-center">진영</th>
              <th className="px-3 py-2 text-center">개장</th>
              <th className="px-3 py-2 text-center">획득/육성</th>
              <th className="px-3 py-2 text-center">스킬작</th>
              <th className="px-3 py-2 text-center">호감작</th>
              <th className="px-3 py-2 text-center">기술점수</th>
              <th className="px-3 py-2 text-center">입수 스탯</th>
              <th className="px-3 py-2 text-center">120 스탯</th>
              <th className="px-3 py-2 text-left">메모</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c, i) => (
              <CharacterRow key={c.id} char={c} updateUser={updateUser} even={i % 2 === 0} />
            ))}
          </tbody>
        </table>
        {characters.length === 0 && (
          <div className="text-center py-12 text-gray-500">해당 조건의 캐릭터가 없습니다</div>
        )}
      </div>
    </div>
  )
}

function CharacterRow({ char: c, updateUser, even }) {
  const bg = even ? 'bg-gray-900' : 'bg-gray-950'
  const acquired = normalizeAcquisitionStatus(c.acquired)
  const skilled = c.skilled || '스작 안함'
  const affection = c.affection || '호감작 안함'

  return (
    <tr className={`${bg} hover:bg-gray-800 transition-colors border-t border-gray-800`}>
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => updateUser(c.id, 'favorite', !c.favorite)}
          className={`text-lg leading-none ${c.favorite ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-500'}`}
        >
          ★
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {c.iconUrl ? (
            <img src={c.iconUrl} alt={c.name} className="w-8 h-8 rounded object-cover flex-shrink-0" loading="lazy"
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-700 flex-shrink-0" />
          )}
          <span className="font-medium">{c.name}</span>
        </div>
      </td>
      <td className={`px-3 py-2 text-center font-bold ${RARITY_COLOR[c.rarity] || 'text-gray-400'}`}>
        {c.rarity}
      </td>
      <td className="px-3 py-2 text-center text-gray-300">{c.shipType}</td>
      <td className="px-3 py-2 text-center text-gray-400 text-xs">{c.faction}</td>
      <td className="px-3 py-2 text-center">
        {c.canRemodel ? (
          <button
            onClick={() => updateUser(c.id, 'remodeled', c.remodeled === 'O' ? 'X' : 'O')}
            className={`text-xs px-2 py-0.5 rounded ${c.remodeled === 'O' ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            {c.remodeled === 'O' ? '개장' : '미개장'}
          </button>
        ) : (
          <span className="text-gray-600 text-xs">-</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <CycleButton value={acquired} options={ACQUISITION_STATUSES} onChange={v => updateUser(c.id, 'acquired', v)}
          colorMap={{ '미획득': 'bg-gray-700 text-gray-400', '획득': 'bg-blue-700 text-blue-200', '100': 'bg-yellow-700 text-yellow-200', '120': 'bg-green-700 text-green-200', '125': 'bg-purple-700 text-purple-200' }} />
      </td>
      <td className="px-3 py-2 text-center">
        <CycleButton value={skilled} options={SKILLED_OPTS} onChange={v => updateUser(c.id, 'skilled', v)}
          colorMap={{ '스작 완료': 'bg-green-700 text-green-200', '스작 중': 'bg-yellow-700 text-yellow-200', '스작 안함': 'bg-gray-700 text-gray-400' }} />
      </td>
      <td className="px-3 py-2 text-center">
        <CycleButton value={affection} options={AFFECTION_OPTS} onChange={v => updateUser(c.id, 'affection', v)}
          colorMap={{ '호감작 안함': 'bg-gray-700 text-gray-400', '호감작 중': 'bg-yellow-700 text-yellow-200', '서약 완료': 'bg-red-700 text-red-200', '호감도 Max': 'bg-pink-700 text-pink-200' }} />
      </td>
      <td className="px-3 py-2 text-center text-gray-300">{calcTechPoints(c)}</td>
      <td className="px-3 py-2 text-center">
        <StatCell data={c.statAcquired} />
      </td>
      <td className="px-3 py-2 text-center">
        <StatCell data={c.stat120} />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={c.comment || ''}
          onChange={e => updateUser(c.id, 'comment', e.target.value)}
          placeholder="메모..."
          className="bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none text-xs w-full text-gray-300 placeholder-gray-600"
        />
      </td>
    </tr>
  )
}

function StatCell({ data }) {
  if (!data || (!data.stat && data.value === 0)) return <span className="text-gray-600 text-xs">-</span>
  return (
    <div className="text-xs text-center">
      {data.shipTypes?.length > 0 && (
        <div className="text-gray-500">{data.shipTypes.join('/')}</div>
      )}
      {data.stat && (
        <div className="text-gray-300">
          <span className="text-blue-300">{data.stat}</span>
          {data.value > 0 && <span className="text-gray-400"> +{data.value}</span>}
        </div>
      )}
    </div>
  )
}

function CycleButton({ value, options, onChange, colorMap }) {
  const next = () => {
    const idx = options.indexOf(value)
    onChange(options[(idx + 1) % options.length])
  }
  const color = colorMap[value] || 'bg-gray-700 text-gray-400'
  return (
    <button onClick={next} className={`text-xs px-2 py-0.5 rounded ${color} hover:opacity-80 whitespace-nowrap`}>
      {value}
    </button>
  )
}
