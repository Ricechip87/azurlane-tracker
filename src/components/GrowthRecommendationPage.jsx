
import { useMemo, useState } from 'react'
import growthRecommendationData from '../data/growthRecommendations.json'
import shipObtainabilityData from '../data/shipObtainability.json'
import { createShipObtainabilityLookup } from '../utils/shipObtainabilityLookup.js'
import { normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'
import { getEffectiveRarity } from '../utils/rarity.js'
import { getFactionBadgeName } from '../utils/factions.js'
import { getObtainabilitySourceSections, obtainabilityLabel } from '../utils/obtainability.js'
import {
  GROWTH_MODE_SOURCE,
  GROWTH_SHIP_TYPE_FILTER_ORDER,
  buildGrowthRecommendationSections,
  countGrowthRecommendationShipTypes,
  filterGrowthRecommendationSections,
  normalizeGrowthSummary,
} from '../utils/growthRecommendations.js'
import { RecommendationDetails, RecommendationDialog } from './recommendations/RecommendationDialog.jsx'
import { RecommendationShipArtwork } from './recommendations/RecommendationShipArtwork.jsx'

const MODES = [
  {
    id: 'main',
    label: '메인해역',
    description: '일반 해역 진행과 13~15지 대응을 기준으로 먼저 키워볼 함선을 모아봅니다.',
  },
  {
    id: 'operation',
    label: '대작전',
    description: '보스전, 장기전, 고난도 전투에서 가치가 높은 함선을 확인합니다.',
  },
  {
    id: 'newbie',
    label: '맨땅뉴비',
    description: '구하기 쉽거나 초반부터 오래 쓰기 좋은 함선을 우선해서 봅니다.',
  },
]

const COLLAB_FACTIONS = new Set([
  'DOAX VV',
  '그리드맨',
  '던만추',
  '데어라',
  '라이자',
  '블랙 록 슈터',
  '섬란 카구라',
  '아이마스',
  '초차원 넵튠',
  '칭송받는자',
  '키즈나 아이',
  '투러브',
  '홀로라이브',
])
export default function GrowthRecommendationPage({ characters }) {
  const [mode, setMode] = useState('main')
  const [shipTypeFilters, setShipTypeFilters] = useState({})
  const [openCard, setOpenCard] = useState(null)
  const recommendationData = growthRecommendationData
  const obtainabilityMap = useMemo(
    () => createShipObtainabilityLookup(shipObtainabilityData.ships),
    [],
  )
  const currentMode = MODES.find(item => item.id === mode) || MODES[0]
  const currentSource = recommendationData?.sources?.find(source => source.key === GROWTH_MODE_SOURCE[mode])
  const unratedRecentShips = recommendationData?.review?.unratedRecentShips || []

  const characterByName = useMemo(() => (
    new Map(characters.map(character => [character.name, character]))
  ), [characters])
  const allRecommendationSections = useMemo(() => (
    recommendationData && obtainabilityMap
      ? buildGrowthRecommendationSections(mode, characters, recommendationData, obtainabilityMap)
      : []
  ), [mode, characters, recommendationData, obtainabilityMap])

  return (
    <section className="space-y-4">
      <div className="rounded border border-neutral-700 bg-[#242424] px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-300">육성 추천 초안</div>
            <h2 className="mt-1 text-xl font-bold text-gray-100">{currentMode.label} 카드 추천</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{currentMode.description}</p>
            {currentSource?.updatedAt && (
              <p className="mt-2 text-xs font-semibold text-gray-400">
                원본 최신화 날짜: {formatSourceDate(currentSource.updatedAt)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {MODES.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id)
                  setShipTypeFilters({})
                  setOpenCard(null)
                }}
                className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${mode === item.id ? 'border-neutral-500 bg-neutral-700 text-white' : 'border-neutral-700 bg-[#1a1a1a] text-gray-400 hover:border-neutral-500 hover:text-gray-100'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {unratedRecentShips.length > 0 && (
        <div className="rounded border border-amber-800/70 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
          <span className="font-bold">원본 미평가 신규 함선:</span>{' '}
          {unratedRecentShips.map(ship => ship.name).join(', ')}
          <span className="ml-2 text-xs text-amber-300/80">원본에 등급이 없어 임의로 추천 등급을 부여하지 않았습니다.</span>
        </div>
      )}

      {recommendationData && obtainabilityMap && (
        <div className="space-y-4">
        {allRecommendationSections.map(section => (
          <GrowthRecommendationSection
            key={section.id}
            section={section}
            selectedShipType={shipTypeFilters[section.id] || '전체'}
            onShipTypeChange={shipType => setShipTypeFilters(previous => ({
              ...previous,
              [section.id]: shipType,
            }))}
            characterByName={characterByName}
            onOpenCard={setOpenCard}
          />
        ))}
      </div>
      )}
      {openCard && (
        <RecommendationCardPopup
          card={openCard.card}
          character={openCard.character}
          onClose={() => setOpenCard(null)}
        />
      )}
    </section>
  )
}

function GrowthRecommendationSection({
  section,
  selectedShipType,
  onShipTypeChange,
  characterByName,
  onOpenCard,
}) {
  const counts = countGrowthRecommendationShipTypes([section])
  const activeShipType = selectedShipType === '전체' || counts[selectedShipType]
    ? selectedShipType
    : '전체'
  const [displaySection] = filterGrowthRecommendationSections([section], activeShipType)

  return (
    <section className="rounded border border-neutral-700 bg-[#1a1a1a]">
      <div className="border-b border-neutral-700 bg-[#242424] px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="text-base font-bold text-gray-100">{section.title}</h3>
          <span className="text-xs text-gray-500">{section.description}</span>
        </div>
      </div>

      <GrowthShipTypeFilter
        selected={activeShipType}
        counts={counts}
        onChange={onShipTypeChange}
      />

      {displaySection.cards.length > 0 ? (
        displaySection.groupByLane ? (
          <LaneGroupedCards
            section={displaySection}
            characterByName={characterByName}
            onOpenCard={onOpenCard}
          />
        ) : (
        <div className="flex flex-wrap gap-2 p-3">
          {displaySection.cards.map(card => (
            <RecommendationCard
              key={`${displaySection.id}-${card.name}`}
              card={card}
              character={characterByName.get(card.name)}
              onOpen={onOpenCard}
            />
          ))}
        </div>
        )
      ) : (
        <EmptyRecommendationSection />
      )}
    </section>
  )
}

function GrowthShipTypeFilter({ selected, counts, onChange }) {
  const knownTypes = GROWTH_SHIP_TYPE_FILTER_ORDER.filter(shipType => counts[shipType])
  const extraTypes = Object.keys(counts)
    .filter(shipType => !GROWTH_SHIP_TYPE_FILTER_ORDER.includes(shipType))
    .sort((a, b) => a.localeCompare(b, 'ko'))
  const shipTypes = [...knownTypes, ...extraTypes]
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 bg-[#202020] px-3 py-2">
      <span className="mr-1 text-[11px] font-bold text-gray-500">함종</span>
        <ShipTypeFilterButton
          label="전체"
          count={total}
          selected={selected === '전체'}
          onClick={() => onChange('전체')}
        />
        {shipTypes.map(shipType => (
          <ShipTypeFilterButton
            key={shipType}
            label={shipType}
            count={counts[shipType]}
            selected={selected === shipType}
            onClick={() => onChange(shipType)}
          />
        ))}
    </div>
  )
}

function ShipTypeFilterButton({ label, count, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded border px-3 py-2 text-xs font-semibold transition-colors ${selected ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500 hover:text-gray-100'}`}
    >
      {label}
      <span className={`ml-1.5 text-[10px] ${selected ? 'text-cyan-300' : 'text-gray-600'}`}>{count}명</span>
    </button>
  )
}

function formatSourceDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return year && month && day ? `${year}/${month}/${day}` : value
}

function LaneGroupedCards({ section, characterByName, onOpenCard }) {
  const groups = [
    { lane: '전열', cards: section.cards.filter(card => card.lane === '전열') },
    { lane: '후열', cards: section.cards.filter(card => card.lane === '후열') },
  ]

  return (
    <div className="space-y-3 p-3">
      {groups.map(group => group.cards.length > 0 && (
        <div key={`${section.id}-${group.lane}`}>
          <div className="mb-2 text-xs font-bold text-gray-400">{group.lane}</div>
          <div className="flex flex-wrap gap-2">
            {group.cards.map(card => (
              <RecommendationCard
                key={`${section.id}-${group.lane}-${card.name}`}
                card={card}
                character={characterByName.get(card.name)}
                onOpen={onOpenCard}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RecommendationCard({ card, character, onOpen }) {
  const rarity = character ? getEffectiveRarity(character) : card.rarity
  const faction = getDisplayFaction(character?.faction)
  const shipType = character?.shipType || card.tags[0]
  const rarityStyle = rarityCardStyle(rarity)
  const status = card.status || normalizeAcquisitionStatus(character?.acquired)

  return (
    <button
      type="button"
      className={`group relative h-[214px] w-[172px] max-w-full flex-none overflow-hidden rounded-md border-2 bg-[#272727] text-left shadow-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-200 ${rarityStyle.card}`}
      onClick={() => onOpen?.({ card, character })}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#3a3a3a_0%,#202020_52%,#111_100%)]" />
      <RecommendationShipArtwork
        character={character}
        name={card.name}
        className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/90" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute right-2 top-2 flex flex-col items-end gap-1 text-[11px] font-black">
        <Badge tone="dark">{faction}</Badge>
        <Badge tone="dark">{shipType}</Badge>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-84px)] flex-wrap gap-1 text-[10px] font-black">
        <Badge tone="dark">{card.tier}</Badge>
        <Badge tone={rarityTone(rarity)}>{rarity}</Badge>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <h4 className="truncate text-sm font-black drop-shadow">{card.name}</h4>
        <div className="mt-2 truncate rounded bg-black/35 px-2 py-1 text-[11px] font-semibold text-gray-100 backdrop-blur-sm">
          {card.summary}
        </div>
      </div>
    </button>
  )
}

function getDisplayFaction(faction) {
  if (!faction) return '-'
  if (COLLAB_FACTIONS.has(faction)) return '콜라보'
  return getFactionBadgeName(faction)
}

function getCardDetails(card) {
  const reason = normalizeGrowthSummary(card.roleNote)
  return {
    reason: reason || card.summary || '원본 추천표 기준 추천 후보입니다.',
    sourceSections: getObtainabilitySourceSections(card.obtainability),
  }
}

function RecommendationCardPopup({ card, character, onClose }) {
  const rarity = character ? getEffectiveRarity(character) : card.rarity
  const faction = getDisplayFaction(character?.faction)
  const shipType = character?.shipType || card.tags[0]
  const status = card.status || normalizeAcquisitionStatus(character?.acquired)
  const details = getCardDetails(card)

  return (
    <RecommendationDialog name={card.name} onClose={onClose}>
        <div className="flex items-start gap-4 pr-6">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded border border-neutral-600 bg-[#181818]">
            <RecommendationShipArtwork
              character={character}
              name={card.name}
              className="h-full w-full object-cover object-top"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
              <Badge tone="dark">{card.tier}</Badge>
              <Badge tone={rarityTone(rarity)}>{rarity}</Badge>
              <Badge tone="dark">{faction}</Badge>
              <Badge tone="dark">{shipType}</Badge>
              <Badge tone={statusTone(status)}>{status}</Badge>
              {status === '미획득' && (
                <Badge tone={availabilityTone(card.obtainability)}>{obtainabilityLabel(card.obtainability)}</Badge>
              )}
            </div>
            <h4 className="mt-3 truncate text-lg font-black text-white">{card.name}</h4>
          </div>
        </div>
        <RecommendationDetails reason={details.reason} sourceSections={details.sourceSections} />
    </RecommendationDialog>
  )
}

function EmptyRecommendationSection() {
  return (
    <div className="p-3">
      <div className="flex min-h-[96px] items-center justify-center rounded border border-dashed border-gray-700 bg-gray-900/60 px-4 py-5 text-center">
        <div>
          <div className="text-sm font-semibold text-gray-300">현재 조건에서 추가 추천 후보가 없습니다.</div>
          <div className="mt-1 text-xs text-gray-500">보유함 반영 단계에서는 이미 충분히 육성된 구간이 이렇게 표시됩니다.</div>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, tone = 'gray', title }) {
  const tones = {
    gray: 'bg-gray-700 text-gray-100',
    blue: 'bg-neutral-600 text-white',
    dark: 'bg-black/65 text-gray-100 ring-1 ring-white/10',
    green: 'bg-emerald-500 text-gray-950',
    orange: 'bg-amber-500 text-gray-950',
    red: 'bg-rose-600 text-white',
    rainbow: 'bg-gradient-to-r from-fuchsia-500 via-amber-300 to-cyan-300 text-gray-950',
    gold: 'bg-yellow-500 text-gray-950',
    purple: 'bg-violet-600 text-white',
  }

  return (
    <span title={title} className={`whitespace-nowrap rounded-full px-1.5 py-0.5 ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  )
}

function rarityTone(rarity) {
  if (rarity === 'UR') return 'rainbow'
  if (rarity === 'SSR') return 'gold'
  if (rarity === 'SR') return 'purple'
  return 'blue'
}

function statusTone(status) {
  if (status === '미획득') return 'gray'
  if (status === '획득') return 'blue'
  if (status === '풀돌') return 'green'
  if (status === '100') return 'orange'
  return 'dark'
}

function difficultyTone(key) {
  if (key === 'easy') return 'green'
  if (key === 'normal') return 'blue'
  if (key === 'hard') return 'orange'
  if (key === 'limited') return 'red'
  return 'gray'
}

function availabilityTone(obtainability) {
  const key = obtainability?.availability?.key
  if (key === 'permanent') return 'blue'
  if (key === 'active-event') return 'green'
  if (key === 'rerun-wait' || key === 'collab-unknown') return 'red'
  return difficultyTone(obtainability?.difficulty?.key)
}

function rarityCardStyle(rarity) {
  if (rarity === 'UR') {
    return {
      card: 'border-cyan-300 shadow-cyan-950/40 ring-1 ring-fuchsia-400/80',
      bar: 'bg-gradient-to-r from-fuchsia-400 via-yellow-300 to-sky-400',
      portrait: 'border-cyan-200',
    }
  }

  if (rarity === 'SSR') {
    return {
      card: 'border-yellow-400 shadow-yellow-950/20',
      bar: 'bg-yellow-400',
      portrait: 'border-yellow-300',
    }
  }

  if (rarity === 'SR') {
    return {
      card: 'border-violet-500 shadow-violet-950/20',
      bar: 'bg-violet-500',
      portrait: 'border-violet-400',
    }
  }

  if (rarity === 'R') {
    return {
      card: 'border-blue-400 shadow-blue-950/20',
      bar: 'bg-blue-400',
      portrait: 'border-blue-300',
    }
  }

  return {
    card: 'border-gray-600 shadow-black/20',
    bar: 'bg-gray-600',
    portrait: 'border-gray-500',
  }
}
