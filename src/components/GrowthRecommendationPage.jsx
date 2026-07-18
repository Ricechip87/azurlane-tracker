import { useEffect, useMemo, useState } from 'react'
import growthRecommendationsUrl from '../data/growthRecommendations.json?url'
import shipObtainabilityUrl from '../data/shipObtainability.json?url'
import { isAcquiredStatus, isLevel120Status, normalizeAcquisitionStatus } from '../utils/acquisitionStatus.js'
import { getEffectiveRarity } from '../utils/rarity.js'
import { getFactionDisplayName, getFactionDisplayText } from '../utils/factions.js'
import { getObtainabilitySourceSections, isGrowthRecommendationEligible, obtainabilityLabel, obtainabilityRank } from '../utils/obtainability.js'

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

const MODE_SOURCE = {
  main: 'main',
  operation: 'operation-siren',
  newbie: 'newbie',
}

const MAIN_FORCE_TYPES = new Set(['전함', '순전', '항전', '항모', '경항모', '모니터'])
const SUBMARINE_TYPES = new Set(['잠수', '잠수항모'])
const POSITION_TYPES = ['구축', '경순', '중순', '대순', '전함', '순전', '항모', '경항모']
const FACTION_LABELS = {
  유니온: 'USS',
  로열: 'HMS',
  중앵: 'IJN',
  철혈: 'KMS',
  동황: 'ROC',
  노스유니온: 'SN',
  아이리스: 'FFNF',
  비시아: 'MNF',
  사르데냐: 'RN',
  튤리퍼: 'HNLMS',
  템페스타: '템페스타',
}
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
const TIER_ORDER = ['SS+', 'SS', 'S+', 'S', 'A+', 'A', 'B+', 'B']
function buildRecommendationSections(mode, characters, growthRecommendationData, obtainabilityByName) {
  const characterByName = new Map(characters.map(character => [character.name, character]))
  const candidates = getCandidatesForMode(mode, characterByName, growthRecommendationData, obtainabilityByName)
  const regularCandidates = candidates.filter(candidate => !isSubmarineCandidate(candidate))
  const submarineCandidates = candidates.filter(isSubmarineCandidate)
  const tierGroups = [...new Set(regularCandidates.map(candidate => candidate.tier))]
    .sort((a, b) => tierScore(a) - tierScore(b))
  const topTier = tierGroups[0]
  const nextTier = tierGroups[1]

  return [
    {
      id: 'top',
      title: '최우선 추천',
      description: topTier ? '현재 조건에서 남은 후보 중 가장 높은 추천 등급입니다.' : '조건에 맞는 최우선 후보를 찾지 못했습니다.',
      cards: cardsForSection(regularCandidates.filter(candidate => candidate.tier === topTier), 16),
      groupByLane: true,
    },
    {
      id: 'next',
      title: '차순위 추천',
      description: nextTier ? '현재 조건에서 최우선 바로 다음 추천 등급입니다.' : '최우선 바로 아래 단계 후보가 없거나 이미 충분히 육성되었습니다.',
      cards: cardsForSection(regularCandidates.filter(candidate => candidate.tier === nextTier), 16),
      groupByLane: true,
    },
    {
      id: 'vanguard',
      title: '전열 기준 추천',
      description: '구축, 경순, 중순, 대순 등 전열 포지션 보강 후보입니다.',
      cards: cardsForSection(regularCandidates.filter(candidate => candidate.lane === '전열'), 24),
    },
    {
      id: 'main-force',
      title: '후열 기준 추천',
      description: '전함, 항모, 경항모 등 후열 포지션 보강 후보입니다.',
      cards: cardsForSection(regularCandidates.filter(candidate => candidate.lane === '후열'), 24),
    },
    {
      id: 'special',
      title: '특수 항목 추천',
      description: '힐러, 버퍼, 디버퍼, 서포터 역할이 명확한 후보입니다.',
      cards: cardsForSection(regularCandidates.filter(isSpecialCandidate), 24),
    },
    {
      id: 'position-fill',
      title: '포지션 보강 추천',
      description: '현재 보유함 기준으로 120 이상 UR/SSR 수가 부족한 함종부터 보강합니다.',
      cards: cardsForSection(getPositionFillCandidates(regularCandidates, characters), 24),
    },
    {
      id: 'submarine',
      title: '잠수함 추천',
      description: '잠수함은 엔드 콘텐츠 성격이 강해서 기존 추천과 분리해 맨 마지막에 따로 모아둡니다.',
      cards: cardsForSection(submarineCandidates, 32),
    },
  ]
}

function getCandidatesForMode(mode, characterByName, growthRecommendationData, obtainabilityByName) {
  const source = MODE_SOURCE[mode] || MODE_SOURCE.main
  const seen = new Map()

  for (const recommendation of growthRecommendationData.recommendations || []) {
    if (recommendation.source !== source) continue
    const character = characterByName.get(recommendation.name)
    const obtainability = obtainabilityByName.get(recommendation.name)
    const candidate = buildCandidate(recommendation, character, obtainability)
    if (!isEligibleCandidate(candidate)) continue

    const previous = seen.get(candidate.name)
    if (!previous || compareCandidates(candidate, previous) < 0) {
      seen.set(candidate.name, candidate)
    }
  }

  return [...seen.values()].sort(compareCandidates)
}

function buildCandidate(recommendation, character, obtainability) {
  const status = normalizeAcquisitionStatus(character?.acquired)
  const difficulty = obtainability?.difficulty || { key: 'unknown', label: '미확인' }
  const shipType = character?.shipType || recommendation.shipType || '-'
  const roleSummary = normalizeSummary(recommendation.roleNote)

  return {
    ...recommendation,
    character,
    obtainability,
    difficulty,
    status,
    acquired: isAcquiredStatus(status),
    lane: getLane(shipType),
    tags: [shipType, getGroupTag(recommendation.sheetGroup)].filter(Boolean),
    summary: roleSummary || '원본 추천표 등급 기준 후보',
  }
}

function isEligibleCandidate(candidate) {
  return isGrowthRecommendationEligible({
    acquired: candidate.acquired,
    level120: isLevel120Status(candidate.status),
    obtainability: candidate.obtainability,
  })
}

function compareCandidates(a, b) {
  return tierScore(a.tier) - tierScore(b.tier) ||
    ownershipScore(a) - ownershipScore(b) ||
    difficultyScore(a) - difficultyScore(b) ||
    Number(a.row || 999) - Number(b.row || 999) ||
    Number(a.column || 999) - Number(b.column || 999) ||
    a.name.localeCompare(b.name, 'ko')
}

function cardsForSection(cards, limit) {
  return cards.slice(0, limit)
}

function tierScore(tier) {
  const index = TIER_ORDER.indexOf(tier)
  return index === -1 ? TIER_ORDER.length : index
}

function ownershipScore(candidate) {
  if (!candidate.acquired) return 4
  if (candidate.status === '100') return 0
  if (candidate.status === '풀돌') return 1
  if (candidate.status === '획득') return 2
  return 3
}

function difficultyScore(candidate) {
  return obtainabilityRank(candidate.obtainability)
}

function getLane(shipType) {
  if (SUBMARINE_TYPES.has(shipType)) return shipType
  return MAIN_FORCE_TYPES.has(shipType) ? '후열' : '전열'
}

function getGroupTag(sheetGroup) {
  if (!sheetGroup) return ''
  return String(sheetGroup).replace(/\s+/g, ' ').split(' ')[0]
}

function normalizeSummary(value) {
  return getFactionDisplayText(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' / ')
}

function isSpecialCandidate(candidate) {
  const text = `${candidate.sheetGroup || ''} ${candidate.roleNote || ''}`
  return /힐|버프|디버프|보조|서포터|지원|실드|대공/.test(text)
}

function isSubmarineCandidate(candidate) {
  const shipType = candidate.character?.shipType || candidate.shipType
  const group = String(candidate.sheetGroup || '')
  return SUBMARINE_TYPES.has(shipType) || group.includes('잠수')
}

function getPositionFillCandidates(candidates, characters) {
  const ownedHighLevelCounts = new Map(POSITION_TYPES.map(type => [type, 0]))

  for (const character of characters) {
    if (!['UR', 'SSR'].includes(getEffectiveRarity(character))) continue
    if (!isLevel120Status(character.acquired)) continue
    if (!ownedHighLevelCounts.has(character.shipType)) continue
    ownedHighLevelCounts.set(character.shipType, ownedHighLevelCounts.get(character.shipType) + 1)
  }

  const weakestTypes = [...ownedHighLevelCounts.entries()]
    .sort((a, b) => a[1] - b[1] || POSITION_TYPES.indexOf(a[0]) - POSITION_TYPES.indexOf(b[0]))
    .slice(0, 3)
    .map(([type]) => type)

  return candidates
    .filter(candidate => weakestTypes.includes(candidate.character?.shipType || candidate.shipType))
    .sort((a, b) => weakestTypes.indexOf(a.character?.shipType || a.shipType) - weakestTypes.indexOf(b.character?.shipType || b.shipType) || compareCandidates(a, b))
}

export default function GrowthRecommendationPage({ characters }) {
  const [mode, setMode] = useState('main')
  const [recommendationData, setRecommendationData] = useState(null)
  const [obtainabilityMap, setObtainabilityMap] = useState(null)
  const [dataError, setDataError] = useState('')
  const [openCard, setOpenCard] = useState(null)
  const currentMode = MODES.find(item => item.id === mode) || MODES[0]
  const currentSource = recommendationData?.sources?.find(source => source.key === MODE_SOURCE[mode])
  const unratedRecentShips = recommendationData?.review?.unratedRecentShips || []

  useEffect(() => {
    let ignore = false

    async function loadRecommendationData() {
      try {
        const [recommendationResponse, obtainabilityResponse] = await Promise.all([
          fetch(growthRecommendationsUrl),
          fetch(shipObtainabilityUrl),
        ])

        if (!recommendationResponse.ok) throw new Error(`growthRecommendations.json ${recommendationResponse.status}`)
        if (!obtainabilityResponse.ok) throw new Error(`shipObtainability.json ${obtainabilityResponse.status}`)

        const [recommendations, obtainability] = await Promise.all([
          recommendationResponse.json(),
          obtainabilityResponse.json(),
        ])

        if (ignore) return
        setRecommendationData(recommendations)
        setObtainabilityMap(new Map((obtainability.ships || []).map(ship => [ship.name, ship])))
        setDataError('')
      } catch (error) {
        if (ignore) return
        setDataError(error instanceof Error ? error.message : '알 수 없는 오류')
      }
    }

    loadRecommendationData()

    return () => {
      ignore = true
    }
  }, [])

  const characterByName = useMemo(() => (
    new Map(characters.map(character => [character.name, character]))
  ), [characters])
  const recommendationSections = useMemo(() => (
    recommendationData && obtainabilityMap
      ? buildRecommendationSections(mode, characters, recommendationData, obtainabilityMap)
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

      {dataError && (
        <section className="rounded border border-rose-900/60 bg-rose-950/30 px-4 py-5 text-sm text-rose-200">
          육성 추천 데이터를 불러오지 못했습니다. ({dataError})
        </section>
      )}

      {!dataError && (!recommendationData || !obtainabilityMap) && (
        <section className="rounded border border-neutral-700 bg-[#1a1a1a] px-4 py-5 text-sm text-gray-400">
          육성 추천 데이터를 불러오는 중입니다.
        </section>
      )}

      {!dataError && recommendationData && obtainabilityMap && (
        <div className="space-y-4">
        {recommendationSections.map(section => (
          <section key={section.id} className="rounded border border-neutral-700 bg-[#1a1a1a]">
            <div className="border-b border-neutral-700 bg-[#242424] px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-base font-bold text-gray-100">{section.title}</h3>
                <span className="text-xs text-gray-500">{section.description}</span>
              </div>
            </div>

            {section.cards.length > 0 ? (
              section.groupByLane ? (
                <LaneGroupedCards
                  section={section}
                  characterByName={characterByName}
                  onOpenCard={setOpenCard}
                />
              ) : (
              <div className="flex flex-wrap gap-2 p-3">
                {section.cards.map(card => (
                  <RecommendationCard
                    key={`${section.id}-${card.name}`}
                    card={card}
                    character={characterByName.get(card.name)}
                    onOpen={setOpenCard}
                  />
                ))}
              </div>
              )
            ) : (
              <EmptyRecommendationSection />
            )}
          </section>
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
  const cardArtUrl = getCardArtUrl(character)
  const status = card.status || normalizeAcquisitionStatus(character?.acquired)
  const showDifficultyBadge = status === '미획득'

  return (
    <button
      type="button"
      className={`group relative h-[214px] w-[172px] max-w-full flex-none overflow-hidden rounded-md border-2 bg-[#272727] text-left shadow-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-200 ${rarityStyle.card}`}
      onClick={() => onOpen?.({ card, character })}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#3a3a3a_0%,#202020_52%,#111_100%)]" />
      {cardArtUrl ? (
        <img
          src={cardArtUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#202020] text-3xl font-black text-gray-700">
          {card.name.slice(0, 2)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/90" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute right-2 top-2 flex flex-col items-end gap-1 text-[11px] font-black">
        <Badge tone={rarityTone(rarity)}>{rarity}</Badge>
        <Badge tone="dark">{faction}</Badge>
        <Badge tone="dark">{shipType}</Badge>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-84px)] flex-wrap gap-1 text-[10px] font-black">
        <Badge tone="dark">{card.tier}</Badge>
        {showDifficultyBadge && (
          <Badge tone={availabilityTone(card.obtainability)}>{obtainabilityLabel(card.obtainability)}</Badge>
        )}
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
  if (faction === '유니온' || faction === '노스유니온') return getFactionDisplayName(faction)
  return FACTION_LABELS[faction] || faction
}

function getCardDetails(card) {
  const reason = normalizeSummary(card.roleNote)
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
  const cardArtUrl = getCardArtUrl(character)
  const details = getCardDetails(card)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div className="w-full max-w-md rounded-lg border border-neutral-600 bg-[#242424] p-4 text-gray-100 shadow-2xl shadow-black/70">
        <div className="flex items-start gap-4">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded border border-neutral-600 bg-[#181818]">
            {cardArtUrl ? (
              <img src={cardArtUrl} alt="" className="h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-gray-700">
                {card.name.slice(0, 2)}
              </div>
            )}
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

        <div className="mt-4 space-y-4 text-sm leading-6">
          <section>
            <h5 className="mb-1 text-xs font-bold text-gray-400">추천 사유</h5>
            <p className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-100">
              {details.reason}
            </p>
          </section>

          <section>
            <h5 className="mb-1 text-xs font-bold text-gray-400">입수 방법</h5>
            {details.sourceSections.length > 0 ? (
              <div className="space-y-2">
                {details.sourceSections.map(section => (
                  <div key={section.label} className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-200">
                    <div className="mb-1 text-[11px] font-bold text-gray-400">{section.label}</div>
                    <ul className="space-y-1">
                      {section.sources.map(source => <li key={source} className="flex gap-2"><span className="text-gray-500">•</span><span>{source}</span></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-500">
                확인된 입수처 정보가 없습니다.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function getCardArtUrl(character) {
  const fileName = character?.iconUrl?.split('/').pop()
  if (!fileName) return ''
  return `${import.meta.env.BASE_URL}ship-card-art/${fileName.replace(/\.(png|webp)$/i, '.png')}`
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

function Badge({ children, tone = 'gray' }) {
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
    <span className={`rounded-full px-1.5 py-0.5 ${tones[tone] || tones.gray}`}>
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
