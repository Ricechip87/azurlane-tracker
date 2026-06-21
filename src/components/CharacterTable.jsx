import { useEffect, useRef, useState } from 'react'
import { calcTechPoints } from '../utils/techPoints.js'
import { ACQUISITION_STATUSES, normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'
import { getEffectiveRarity } from '../utils/rarity.js'

const RARITY_COLOR = {
  N: 'text-gray-400',
  R: 'text-blue-400',
  SR: 'text-purple-400',
  SSR: 'text-yellow-400',
  UR: 'text-red-400',
}

const REMODEL_OPTS = ['없음', '미개장', '개장']
const KEEL_OPTS = ['없음', '가능', '완료']
const SKILLED_OPTS = ['스작 안함', '스작 중', '스작 완료']
const AFFECTION_OPTS = ['호감작 안함', '호감작 중', '서약 완료', '호감도 Max']
const EQUIP_OPTS = ['없음', '미제작', '제작']
const TH_CENTER = 'px-3 py-2 text-center align-middle whitespace-nowrap'
const TD_CENTER = 'px-3 py-2 text-center align-middle'

export default function CharacterTable({ characters, updateUser }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-700 bg-[#242424]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1440px] text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-[210px]" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-36" />
            <col className="w-36" />
          </colgroup>
          <thead>
            <tr className="bg-[#2b2b2b] text-xs text-gray-400">
              <th className={`${TH_CENTER} w-8`}>★</th>
              <th className="w-[210px] px-3 py-2 text-left align-middle whitespace-nowrap">이름</th>
              <th className={TH_CENTER}>레어도</th>
              <th className={TH_CENTER}>함종</th>
              <th className={TH_CENTER}>진영</th>
              <th className={TH_CENTER}>개장</th>
              <th className={TH_CENTER}>용골편찬</th>
              <th className={TH_CENTER}>획득/육성</th>
              <th className={TH_CENTER}>스킬작</th>
              <th className={TH_CENTER}>호감작</th>
              <th className={TH_CENTER}>전용 장비</th>
              <th className={TH_CENTER}>기술점수</th>
              <th className={TH_CENTER}>입수 스탯</th>
              <th className={TH_CENTER}>120 스탯</th>
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
  const bg = even ? 'bg-[#1f1f1f]' : 'bg-[#181818]'
  const acquired = normalizeAcquisitionStatus(c.acquired)
  const skilled = c.skilled || '스작 안함'
  const affection = c.affection || '호감작 안함'
  const equip = c.equip || '없음'
  const remodel = c.remodeled === 'O' ? '개장' : c.remodeled === 'X' ? '미개장' : (c.remodeled || '없음')
  const isSP = String(c.id).startsWith('P')
  const keel = c.keel || '없음'
  const rarity = getEffectiveRarity(c)

  return (
    <tr className={`${bg} border-t border-neutral-800 transition-colors hover:bg-[#2a2a2a]`}>
      <td className={TD_CENTER}>
        <button
          onClick={() => updateUser(c.id, 'favorite', !c.favorite)}
          className={`text-lg leading-none ${c.favorite ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-500'}`}
        >
          ★
        </button>
      </td>
      <td className="w-[210px] max-w-[210px] px-3 py-2 align-middle">
        <div className="flex w-full min-w-0 items-center gap-2 whitespace-nowrap">
          {c.iconUrl ? (
            <img src={c.iconUrl} alt={c.name} className="w-8 h-8 rounded object-cover flex-shrink-0" loading="lazy"
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-700 flex-shrink-0" />
          )}
          <AutoScrollingName name={c.name} isSP={isSP} />
        </div>
      </td>
      <td className={`${TD_CENTER} font-bold ${RARITY_COLOR[rarity] || 'text-gray-400'}`}>
        {rarity}
      </td>
      <td className={`${TD_CENTER} whitespace-nowrap text-gray-300`}>{c.shipType}</td>
      <td className={`${TD_CENTER} whitespace-nowrap text-xs text-gray-400`}>{c.faction}</td>
      <td className={TD_CENTER}>
        <StatusSelect value={remodel} options={REMODEL_OPTS} onChange={v => updateUser(c.id, 'remodeled', v)}
          colorMap={{ '없음': 'bg-gray-700 text-gray-400', '미개장': 'bg-yellow-700 text-yellow-200', '개장': 'bg-green-700 text-green-200' }} />
      </td>
      <td className={TD_CENTER}>
        {isSP
          ? <StatusSelect value={keel} options={KEEL_OPTS} onChange={v => updateUser(c.id, 'keel', v)}
              colorMap={{ '없음': 'bg-gray-700 text-gray-400', '가능': 'bg-yellow-700 text-yellow-200', '완료': 'bg-green-700 text-green-200' }} />
          : <span className="text-gray-600 text-xs">-</span>
        }
      </td>
      <td className={TD_CENTER}>
        <StatusSelect value={acquired} options={ACQUISITION_STATUSES} onChange={v => updateUser(c.id, 'acquired', v)}
          colorMap={{ '미획득': 'bg-gray-700 text-gray-400', '획득': 'bg-blue-700 text-blue-200', '풀돌': 'bg-cyan-700 text-cyan-200', '100': 'bg-yellow-700 text-yellow-200', '120': 'bg-green-700 text-green-200', '125': 'bg-purple-700 text-purple-200' }} />
      </td>
      <td className={TD_CENTER}>
        <StatusSelect value={skilled} options={SKILLED_OPTS} onChange={v => updateUser(c.id, 'skilled', v)}
          colorMap={{ '스작 완료': 'bg-green-700 text-green-200', '스작 중': 'bg-yellow-700 text-yellow-200', '스작 안함': 'bg-gray-700 text-gray-400' }} />
      </td>
      <td className={TD_CENTER}>
        <StatusSelect value={affection} options={AFFECTION_OPTS} onChange={v => updateUser(c.id, 'affection', v)}
          colorMap={{ '호감작 안함': 'bg-gray-700 text-gray-400', '호감작 중': 'bg-yellow-700 text-yellow-200', '서약 완료': 'bg-red-700 text-red-200', '호감도 Max': 'bg-pink-700 text-pink-200' }} />
      </td>
      <td className={TD_CENTER}>
        <StatusSelect value={equip} options={EQUIP_OPTS} onChange={v => updateUser(c.id, 'equip', v)}
          colorMap={{ '없음': 'bg-gray-700 text-gray-400', '미제작': 'bg-yellow-700 text-yellow-200', '제작': 'bg-green-700 text-green-200' }} />
      </td>
      <td className={`${TD_CENTER} text-gray-300`}>{calcTechPoints(c)}</td>
      <td className={TD_CENTER}>
        <StatCell data={c.statAcquired} />
      </td>
      <td className={TD_CENTER}>
        <StatCell data={c.stat120} />
      </td>
    </tr>
  )
}

function AutoScrollingName({ name, isSP }) {
  const viewportRef = useRef(null)
  const contentRef = useRef(null)
  const [scrollDistance, setScrollDistance] = useState(0)

  useEffect(() => {
    const updateScrollDistance = () => {
      const viewport = viewportRef.current
      const content = contentRef.current
      if (!viewport || !content) return
      setScrollDistance(Math.max(0, content.scrollWidth - viewport.clientWidth + 12))
    }

    updateScrollDistance()
    window.addEventListener('resize', updateScrollDistance)
    return () => window.removeEventListener('resize', updateScrollDistance)
  }, [name, isSP])

  const scrollStyle = scrollDistance > 0
    ? {
        '--name-scroll-distance': `${scrollDistance}px`,
        '--name-scroll-duration': `${Math.max(7, scrollDistance / 10)}s`,
      }
    : undefined

  return (
    <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden">
      <span
        ref={contentRef}
        className={`inline-block whitespace-nowrap font-medium ${scrollDistance > 0 ? 'auto-scroll-name' : ''}`}
        style={scrollStyle}
      >
        {name}{isSP && <span className="ml-1 text-xs text-cyan-400">(SP)</span>}
      </span>
    </div>
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

function StatusSelect({ value, options, onChange, colorMap }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const color = colorMap[value] || 'bg-gray-700 text-gray-400'

  useEffect(() => {
    if (!open) return undefined

    const updateMenuPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuStyle({
        left: `${rect.left}px`,
        top: `${rect.bottom + 4}px`,
        width: `${Math.max(rect.width, 80)}px`,
      })
    }

    const closeOnOutside = event => {
      if (buttonRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setOpen(false)
    }

    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpen(false)
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={`inline-flex min-w-20 items-center justify-between gap-2 whitespace-nowrap rounded border px-2 py-0.5 text-xs outline-none transition-colors hover:border-gray-500 focus:border-neutral-400 ${open ? 'border-neutral-400' : 'border-transparent'} ${color}`}
      >
        <span>{value}</span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="listbox"
          className="fixed z-50 rounded border border-neutral-600 bg-[#1a1a1a] p-1 text-left text-xs shadow-2xl"
          style={menuStyle}
        >
          {options.map(option => {
            const selected = option === value
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className={`block w-full whitespace-nowrap rounded px-2 py-1 text-left transition-colors ${selected ? 'bg-neutral-700 text-white' : 'text-gray-200 hover:bg-[#2a2a2a] hover:text-gray-100'}`}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
