import { useEffect, useMemo, useRef, useState } from 'react'
import shipCombatData from '../data/shipCombatData.json'
import shipDatabaseDetails from '../data/shipDatabaseDetails.json'
import shipObtainabilityData from '../data/shipObtainability.json'
import { AFFECTION_SELECT_OPTIONS, getAffectionOptionLabel } from '../utils/affection.js'
import { getFactionBadgeName, getFactionOptions } from '../utils/factions.js'
import {
  getAvailability,
  getObtainabilitySourceSections,
  getPrimaryAcquisitionRoute,
} from '../utils/obtainability.js'
import { createShipObtainabilityLookup, getShipObtainability } from '../utils/shipObtainabilityLookup.js'
import { SHIP_CLASSIFICATION_OPTIONS } from '../utils/shipClassifications.js'
import {
  DEFAULT_SHIP_DATABASE_FILTERS,
  SHIP_DATABASE_STAGES,
  SHIP_DATABASE_STAT_KEYS,
  SHIP_DATABASE_STAT_LABELS,
  calculateShipDatabaseStats,
  filterShipDatabaseCharacters,
  getArmorLabel,
  getVisibleRetrofitBonuses,
  hasUnresolvedSkillValues,
  sortShipDatabaseCharacters,
} from '../utils/shipDatabase.js'
import { getStatDisplayName } from '../utils/statLabels.js'
import { RecommendationShipArtwork } from './recommendations/RecommendationShipArtwork.jsx'

const INITIAL_VISIBLE_COUNT = 72
const VISIBLE_COUNT_STEP = 72
const RARITY_OPTIONS = ['전체', 'UR', 'SSR', 'SR', 'R', 'N']
const obtainabilityLookup = createShipObtainabilityLookup(shipObtainabilityData.ships)

export default function ShipDatabasePage({ characters }) {
  const [filters, setFilters] = useState(DEFAULT_SHIP_DATABASE_FILTERS)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const [selectedGid, setSelectedGid] = useState(null)
  const listScrollPosition = useRef(0)
  const cardRefs = useRef(new Map())
  const detailHeadingRef = useRef(null)

  const filteredCharacters = useMemo(
    () => sortShipDatabaseCharacters(
      filterShipDatabaseCharacters(characters, filters),
      shipDatabaseDetails.ships,
    ),
    [characters, filters],
  )
  const factionOptions = useMemo(
    () => getFactionOptions(new Set(characters.map(character => character.faction))),
    [characters],
  )
  const selectedCharacter = selectedGid == null
    ? null
    : characters.find(character => String(character.gid) === String(selectedGid))

  useEffect(() => {
    if (!selectedCharacter) return
    window.scrollTo({ top: 0, behavior: 'auto' })
    detailHeadingRef.current?.focus()
  }, [selectedCharacter])

  const openDetail = character => {
    listScrollPosition.current = window.scrollY
    setSelectedGid(character.gid)
  }

  const updateFilters = updater => {
    setFilters(current => typeof updater === 'function' ? updater(current) : updater)
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }

  const closeDetail = () => {
    const previousGid = selectedGid
    setSelectedGid(null)
    window.setTimeout(() => {
      window.scrollTo({ top: listScrollPosition.current, behavior: 'auto' })
      cardRefs.current.get(String(previousGid))?.focus()
    }, 0)
  }

  if (selectedCharacter) {
    return (
      <ShipDatabaseDetail
        character={selectedCharacter}
        onBack={closeDetail}
        headingRef={detailHeadingRef}
      />
    )
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-4 p-4">
      <header className="border border-neutral-700 bg-[#242424] px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-400">함선 도감</div>
            <h1 className="mt-1 text-2xl font-black text-white">함순이 DB</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              KR에 적용된 함선을 도감순으로 확인합니다. 카드를 누르면 능력치, 스킬, 입수처와 함대기술을 볼 수 있습니다.
            </p>
          </div>
          <div className="rounded border border-neutral-700 bg-[#191919] px-4 py-2 text-sm">
            <span className="text-gray-500">총 함선 </span>
            <strong className="text-cyan-300">{characters.length}</strong>
            <span className="mx-2 text-neutral-700">/</span>
            <span className="text-gray-500">표시 </span>
            <strong className="text-white">{filteredCharacters.length}</strong>
          </div>
        </div>
      </header>

      <ShipDatabaseFilters
        filters={filters}
        setFilters={updateFilters}
        factionOptions={factionOptions}
      />

      <section className="border border-neutral-700 bg-[#1c1c1c] p-3 sm:p-4">
        {filteredCharacters.length ? (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(154px,172px))] justify-center gap-2.5 sm:justify-start">
              {filteredCharacters.slice(0, visibleCount).map(character => (
                <ShipDatabaseCard
                  key={character.gid}
                  character={character}
                  onOpen={openDetail}
                  buttonRef={node => {
                    if (node) cardRefs.current.set(String(character.gid), node)
                    else cardRefs.current.delete(String(character.gid))
                  }}
                />
              ))}
            </div>
            {visibleCount < filteredCharacters.length && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(count => count + VISIBLE_COUNT_STEP)}
                  className="rounded border border-cyan-700 bg-cyan-950/40 px-6 py-2 text-sm font-bold text-cyan-200 hover:border-cyan-500 hover:bg-cyan-950/70"
                >
                  더 보기 · {Math.min(VISIBLE_COUNT_STEP, filteredCharacters.length - visibleCount)}척
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-52 items-center justify-center text-sm text-gray-500">
            현재 조건에 맞는 함선이 없습니다.
          </div>
        )}
      </section>
    </main>
  )
}

function ShipDatabaseFilters({ filters, setFilters, factionOptions }) {
  const update = (field, value) => setFilters(current => ({ ...current, [field]: value }))

  return (
    <section className="border border-neutral-700 bg-[#242424] p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(140px,0.7fr))_auto_auto]">
        <label className="min-w-0">
          <span className="sr-only">함선 이름 검색</span>
          <input
            type="search"
            value={filters.search}
            onChange={event => update('search', event.target.value)}
            placeholder="함선 이름 검색"
            className="h-10 w-full rounded border border-neutral-600 bg-[#171717] px-3 text-sm text-gray-100 outline-none placeholder:text-gray-600 focus:border-cyan-500"
          />
        </label>
        <FilterSelect label="등급" value={filters.rarity} onChange={value => update('rarity', value)}>
          {RARITY_OPTIONS.map(option => <option key={option}>{option}</option>)}
        </FilterSelect>
        <FilterSelect label="함종" value={filters.shipType} onChange={value => update('shipType', value)}>
          {SHIP_CLASSIFICATION_OPTIONS.map(option => <option key={option}>{option}</option>)}
        </FilterSelect>
        <FilterSelect label="진영" value={filters.faction} onChange={value => update('faction', value)}>
          {factionOptions.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </FilterSelect>
        <button
          type="button"
          onClick={() => update('remodelOnly', !filters.remodelOnly)}
          className={`h-10 rounded border px-3 text-sm font-bold ${filters.remodelOnly ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300' : 'border-neutral-600 bg-[#1b1b1b] text-gray-400 hover:text-white'}`}
          aria-pressed={filters.remodelOnly}
        >
          개장 가능만
        </button>
        <button
          type="button"
          onClick={() => setFilters(DEFAULT_SHIP_DATABASE_FILTERS)}
          className="h-10 rounded border border-neutral-600 bg-[#1b1b1b] px-3 text-sm text-gray-400 hover:text-white"
        >
          초기화
        </button>
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-10 w-full rounded border border-neutral-600 bg-[#171717] px-3 text-sm text-gray-200 outline-none focus:border-cyan-500"
      >
        {children}
      </select>
    </label>
  )
}

function ShipDatabaseCard({ character, onOpen, buttonRef }) {
  const combat = shipCombatData.ships[String(character.gid)]
  const obtainability = getShipObtainability(obtainabilityLookup, character)
  const availability = getAvailability(obtainability)
  const route = getPrimaryAcquisitionRoute(obtainability)
  const rarity = getDatabaseRarityLabel(character, combat)
  const style = rarityCardStyle(character.rarity)

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onOpen(character)}
      className={`group relative h-[214px] w-full max-w-[172px] overflow-hidden rounded-md border-2 bg-[#272727] text-left shadow-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-200 ${style}`}
      aria-label={`${character.name} 상세 정보`}
      title={character.name}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#3a3a3a_0%,#202020_52%,#111_100%)]" />
      <RecommendationShipArtwork
        character={character}
        className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/90" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/55 to-transparent" />

      <div className="absolute left-2 top-2 flex max-w-[calc(100%-78px)] flex-wrap gap-1 text-[10px] font-black">
        <Badge tone={rarityTone(character.rarity)}>{rarity}</Badge>
        {character.canRemodel && <Badge tone="green">개장</Badge>}
      </div>
      <div className="absolute right-2 top-2 flex flex-col items-end gap-1 text-[10px] font-black">
        <Badge tone="dark">{getFactionBadgeName(character.faction)}</Badge>
        <Badge tone="dark">{character.shipType}</Badge>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <h2 className="truncate text-sm font-black drop-shadow">{character.name}</h2>
        <div className="mt-2 truncate rounded bg-black/40 px-2 py-1 text-[11px] font-semibold text-gray-100 backdrop-blur-sm">
          {route?.label || availability.label}
        </div>
      </div>
    </button>
  )
}

function ShipDatabaseDetail({ character, onBack, headingRef }) {
  const [stageId, setStageId] = useState('125')
  const [affection, setAffection] = useState('기타')
  const combat = shipCombatData.ships[String(character.gid)]
  const detail = shipDatabaseDetails.ships[String(character.gid)] || {}
  const obtainability = getShipObtainability(obtainabilityLookup, character)
  const sourceSections = getObtainabilitySourceSections(obtainability)
  const stats = calculateShipDatabaseStats(combat, stageId, affection)
  const retrofitBonuses = getVisibleRetrofitBonuses(combat)
  const rarity = getDatabaseRarityLabel(character, combat)

  return (
    <main className="mx-auto max-w-[1280px] space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          ref={headingRef}
          type="button"
          onClick={onBack}
          className="rounded border border-neutral-600 bg-[#242424] px-4 py-2 text-sm font-bold text-gray-200 hover:border-cyan-600 hover:text-white"
        >
          ← 목록으로
        </button>
      </div>

      <section className="border border-neutral-700 bg-[#242424] p-4">
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="mx-auto h-[300px] w-[220px] max-w-full overflow-hidden rounded-md border border-neutral-600 bg-[#181818]">
            <RecommendationShipArtwork
              character={character}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
              <Badge tone={rarityTone(character.rarity)}>{rarity}</Badge>
              <Badge tone="dark">{getFactionBadgeName(character.faction)}</Badge>
              <Badge tone="dark">{character.shipType}</Badge>
              {character.canRemodel && <Badge tone="green">개장 가능</Badge>}
            </div>
            <h1 className="mt-3 break-words text-2xl font-black text-white sm:text-3xl">{character.name}</h1>
            {detail.className && <p className="mt-2 text-sm text-gray-400">{detail.className}</p>}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <SummaryItem label="장갑" value={getArmorLabel(detail.armor)} />
              <SummaryItem label="진영" value={getFactionBadgeName(character.faction)} />
              <SummaryItem
                label="함종"
                value={detail.retrofit?.shipType && detail.retrofit.shipType !== character.shipType
                  ? `${detail.retrofit.shipType} · 개장 완료`
                  : character.shipType}
              />
              <SummaryItem label="입수 상태" value={getAvailability(obtainability).label} />
            </div>

            <div className="mt-5 rounded border border-neutral-700 bg-[#191919] px-4 py-3">
              <div className="text-xs font-bold text-gray-500">대표 입수처</div>
              <div className="mt-1 text-sm text-gray-100">
                {getPrimaryAcquisitionRoute(obtainability)?.sources?.join(', ')
                  || sourceSections[0]?.sources?.join(', ')
                  || '확인된 입수처 정보가 없습니다.'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-neutral-700 bg-[#242424]">
        <SectionHeader
          title="능력치"
          description={`${getAffectionOptionLabel(affection)} 기준입니다. 연구함과 개장 가능 함선은 100부터 완성 상태를 적용합니다.`}
        />
        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="능력치 단계">
              {SHIP_DATABASE_STAGES.map(stage => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setStageId(stage.id)}
                  className={`rounded border px-3 py-1.5 text-xs font-bold ${stageId === stage.id ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200' : 'border-neutral-600 bg-[#191919] text-gray-400 hover:text-white'}`}
                  aria-pressed={stageId === stage.id}
                >
                  {stage.label}
                </button>
              ))}
            </div>
            <label className="flex min-w-44 flex-col gap-1 text-xs text-gray-400">
              호감도
              <select
                value={affection}
                onChange={event => setAffection(event.target.value)}
                className="rounded border border-neutral-600 bg-[#191919] px-3 py-1.5 text-sm font-bold text-gray-100 outline-none focus:border-cyan-500"
              >
                {AFFECTION_SELECT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {SHIP_DATABASE_STAT_KEYS.map(key => (
              <StatItem key={key} label={SHIP_DATABASE_STAT_LABELS[key]} value={stats[key]} />
            ))}
          </div>
        </div>
      </section>

      {character.canRemodel && (
        <section className="border border-emerald-900 bg-[#202420]">
          <SectionHeader
            title="개장 완료 보너스"
            description="장비 슬롯과 장비 효율 변화는 제외하고 함선 자체 능력치 증가만 표시합니다."
          />
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(retrofitBonuses).map(([key, value]) => (
              <StatItem key={key} label={SHIP_DATABASE_STAT_LABELS[key] || key} value={`+${value}`} accent="green" />
            ))}
          </div>
        </section>
      )}

      <section className="border border-neutral-700 bg-[#242424]">
        <SectionHeader title="스킬" description="스킬 이름과 효과만 표시하며 장비 관련 정보는 포함하지 않습니다." />
        <div className="space-y-2 p-4">
          {detail.skills?.length ? detail.skills.map((skill, index) => (
            <article key={`${skill.name}-${index}`} className={`rounded border px-4 py-3 ${skill.retrofit ? 'border-emerald-800 bg-emerald-950/20' : 'border-neutral-700 bg-[#191919]'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-gray-100">{skill.name}</h3>
                {skill.retrofit && <Badge tone="green">개장</Badge>}
                {hasUnresolvedSkillValues(skill.effect) && <Badge tone="gold">원천 수치 확인 중</Badge>}
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-300">{skill.effect}</p>
              {hasUnresolvedSkillValues(skill.effect) && (
                <p className="mt-2 text-xs text-amber-300">
                  공개 원천에 아직 확정 수치가 없어 X로 표시된 값입니다. 확인 전까지 수치를 추정하지 않습니다.
                </p>
              )}
            </article>
          )) : (
            <div className="rounded border border-dashed border-neutral-700 px-4 py-6 text-center text-sm text-gray-500">
              공개 원천에서 확인 가능한 스킬 설명이 없습니다.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-neutral-700 bg-[#242424]">
          <SectionHeader title="입수 정보" description="현재 입수처와 과거 이벤트 입수처를 구분합니다." />
          <div className="space-y-2 p-4">
            {sourceSections.length ? sourceSections.map(section => (
              <div key={section.label} className="rounded border border-neutral-700 bg-[#191919] px-4 py-3">
                <h3 className="text-xs font-black text-gray-400">{section.label}</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-200">
                  {section.sources.map(source => <li key={source}>• {source}</li>)}
                </ul>
              </div>
            )) : (
              <p className="rounded border border-dashed border-neutral-700 px-4 py-6 text-center text-sm text-gray-500">
                확인된 입수처 정보가 없습니다.
              </p>
            )}
          </div>
        </section>

        <section className="border border-neutral-700 bg-[#242424]">
          <SectionHeader title="함대기술" description="획득·풀돌·120 달성 시 얻는 기술점수와 추가 능력치입니다." />
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-3 gap-2">
              <StatItem label="획득" value={`+${character.techPoints?.acquired || 0}`} />
              <StatItem label="풀돌" value={`+${character.techPoints?.maxLB || 0}`} />
              <StatItem label="120" value={`+${character.techPoints?.lv120 || 0}`} />
            </div>
            <FleetTechBonus label="획득 보너스" bonus={character.statAcquired} />
            <FleetTechBonus label="120 보너스" bonus={character.stat120} />
          </div>
        </section>
      </div>
    </main>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded border border-neutral-700 bg-[#191919] px-3 py-2">
      <div className="text-[11px] font-bold text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-gray-100">{value || '-'}</div>
    </div>
  )
}

function SectionHeader({ title, description }) {
  return (
    <header className="border-b border-neutral-700 px-4 py-3">
      <h2 className="text-base font-black text-gray-100">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>}
    </header>
  )
}

function StatItem({ label, value, accent = 'cyan' }) {
  return (
    <div className="rounded border border-neutral-700 bg-[#191919] px-3 py-2">
      <div className="text-[11px] font-bold text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-black ${accent === 'green' ? 'text-emerald-400' : 'text-cyan-300'}`}>
        {value}
      </div>
    </div>
  )
}

function FleetTechBonus({ label, bonus }) {
  const value = Number(bonus?.value || 0)
  return (
    <div className="rounded border border-neutral-700 bg-[#191919] px-4 py-3">
      <div className="text-xs font-black text-gray-400">{label}</div>
      {value ? (
        <div className="mt-2 text-sm text-gray-200">
          {bonus.shipTypes?.join(' · ') || '전체'} · {getStatDisplayName(bonus.stat)} +{value}
        </div>
      ) : (
        <div className="mt-2 text-sm text-gray-600">추가 능력치 없음</div>
      )}
    </div>
  )
}

function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-700 text-gray-100',
    dark: 'bg-black/65 text-gray-100 ring-1 ring-white/10',
    green: 'bg-emerald-500 text-gray-950',
    blue: 'bg-blue-500 text-white',
    gold: 'bg-yellow-500 text-gray-950',
    purple: 'bg-violet-600 text-white',
    rainbow: 'bg-gradient-to-r from-fuchsia-500 via-amber-300 to-cyan-300 text-gray-950',
  }
  return (
    <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  )
}

function getDatabaseRarityLabel(character, combat) {
  if (!combat?.research) return character.rarity
  if (character.rarity === 'UR') return 'DR · UR'
  if (character.rarity === 'SSR') return 'PR · SSR'
  return character.rarity
}

function rarityTone(rarity) {
  if (rarity === 'UR') return 'rainbow'
  if (rarity === 'SSR') return 'gold'
  if (rarity === 'SR') return 'purple'
  if (rarity === 'R') return 'blue'
  return 'gray'
}

function rarityCardStyle(rarity) {
  if (rarity === 'UR') return 'border-cyan-300 shadow-cyan-950/40 ring-1 ring-fuchsia-400/80'
  if (rarity === 'SSR') return 'border-yellow-400 shadow-yellow-950/20'
  if (rarity === 'SR') return 'border-violet-500 shadow-violet-950/20'
  if (rarity === 'R') return 'border-blue-400 shadow-blue-950/20'
  return 'border-gray-600 shadow-black/20'
}
