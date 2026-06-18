import { useMemo, useState } from 'react'

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

const RECOMMENDATION_SECTIONS = [
  {
    id: 'top',
    title: '최우선 추천',
    description: '성능, 범용성, 장기 활용도를 기준으로 가장 먼저 확인할 카드입니다.',
    cards: [
      ship('윌리엄 D 포터', 'SS', '선봉', ['구축', '만능'], '만능 육각형', ['입수 시 바로 육성 후보', '대공/대잠/보조를 넓게 커버']),
      ship('라피Ⅱ', 'SS', '선봉', ['구축', '대공'], '탱 / 대잠 / 대공', ['고난도 해역 대응력이 좋음', '구축풀이 부족하면 우선 확인']),
      ship('Z52', 'SS', '선봉', ['구축', '딜탱'], '딜탱 / 보조 / 힐', ['철혈 구축 핵심 후보', '공방 균형이 좋은 상위권']),
      ship('괌', 'SS', '선봉', ['대순', '탱커'], '최상급 대공 / 탱킹', ['대공 요구 해역에서 강함', '대형순 탱커가 부족하면 우선']),
      ship('하우덴 리우', 'SS', '선봉', ['중순', '육각형'], '탱 / 딜 / 보조 / 힐', ['여러 역할을 동시에 수행', '고난도 선봉 보강 후보']),
      ship('시만토', 'SS', '선봉', ['경순', '유틸'], '균형잡힌 공방 / 짤힐', ['경순 슬롯의 안정성 보강', '대공과 보조를 함께 봄']),
    ],
  },
  {
    id: 'main-force',
    title: '후열 / 지원 추천',
    description: '힐러, 항모, 전함처럼 함대의 방향을 잡아주는 함선입니다.',
    cards: [
      ship('유니콘', 'SS', '후열', ['경항모', '힐러'], '초반부터 오래 쓰는 메인 힐러', ['입수 난이도 대비 효율이 좋음', '뉴비 기준 최우선 확인']),
      ship('즈이호', 'SS', '후열', ['경항모', '힐러'], '신세대 힐러', ['힐러 풀이 부족하면 우선', '장기전 안정성 보강']),
      ship('아퀼라', 'SS', '후열', ['항모', '힐러'], '딜러 / 서브 힐러', ['보스전 안정성에 기여', '힐러와 딜러 역할을 겸함']),
      ship('클라우디아 발렌츠', 'S', '후열', ['항모', '딜러'], '쫄팟 딜러 / 기믹 실드', ['메인해역 후열 딜러 후보', '특정 상황에서 가치가 큼']),
      ship('렉싱턴Ⅱ', 'S', '후열', ['항모', '딜러'], '높은 제공권 / 생존력', ['항모 전력이 부족할 때 확인', '해역 진행용 후보']),
      ship('비스마르크 Zwei', 'S', '후열', ['전함', '딜러'], '철혈 전함 핵심 딜러', ['철혈 편성 중심축', '보스전 화력 후보']),
    ],
  },
  {
    id: 'role-fill',
    title: '포지션 보강 추천',
    description: '당장 빈 포지션을 메우거나 특정 기믹에 대응하기 좋은 함선입니다.',
    cards: [
      ship('샌디에이고', 'S+', '선봉', ['경순', '대공'], '상위 대공 성능', ['대공 요구 해역에서 강함', '개장 후 가치 상승']),
      ship('플리머스', 'S', '선봉', ['경순', '딜러'], '경순 딜러 / 전함 딜버프', ['딜과 보조를 함께 제공', '후열 전함 화력 보조']),
      ship('엘드릿지', 'S', '선봉', ['구축', '탱커'], '전열 탱 보조', ['개장 필요', '구축 탱커 후보']),
      ship('브레스트', 'S', '선봉', ['대순', '탱커'], '쫄팟/보스팟 탱커', ['단단한 선봉이 필요할 때', '고난도 안정성 보강']),
      ship('나폴리', 'S', '선봉', ['중순', '탱커'], '실드 무시 딜러 / 탱커', ['보스전 탱커 후보', '중순 포지션 보강']),
      ship('잔 다르크', 'S', '선봉', ['경순', '보조'], '탱커 보조', ['전열 안정성 보강', '보조 풀이 부족할 때 확인']),
    ],
  },
  {
    id: 'next',
    title: '차순위 후보',
    description: '핵심 카드가 준비된 뒤 천천히 보강할 후보입니다.',
    cards: [
      ship('펠릭스 슐츠', 'A+', '선봉', ['구축', '탱커'], '탱커 2황', ['구축 탱커가 필요할 때', '선봉 생존력 보강']),
      ship('핑하이', 'A+', '선봉', ['경순', '탱커'], '확고한 탱킹능력', ['낮은 딜 기여도 감안', '탱킹 목적일 때 선택']),
      ship('닝하이', 'A+', '선봉', ['경순', '탱커'], '태생 보딱 중 탱킹 1황', ['접근성 좋은 탱킹 후보', '초중반 보강용']),
      ship('얏센', 'A+', '선봉', ['경순', '탱커'], '태생 보딱 중 탱킹 1황', ['동황팟 계열 후보', '접근성 좋은 탱킹 카드']),
      ship('힌덴부르크', 'A+', '선봉', ['중순', '딜러'], '전열 딜러 1황', ['화력 보강 목적', '고투자 후보']),
      ship('운젠', 'A+', '선봉', ['중순', '딜러'], '전열 딜러 2황', ['중앵 전열 딜러', '고점 딜러 후보']),
    ],
  },
]

function ship(name, tier, lane, tags, summary, notes) {
  return { name, tier, lane, tags, summary, notes }
}

export default function GrowthRecommendationPage({ characters }) {
  const [mode, setMode] = useState('main')
  const currentMode = MODES.find(item => item.id === mode) || MODES[0]

  const characterByName = useMemo(() => (
    new Map(characters.map(character => [character.name, character]))
  ), [characters])

  return (
    <section className="space-y-4">
      <div className="rounded border border-gray-800 bg-gray-900 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-300">육성 추천 초안</div>
            <h2 className="mt-1 text-xl font-bold text-gray-100">{currentMode.label} 카드 추천</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{currentMode.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MODES.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${mode === item.id ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-700 bg-gray-950 text-gray-400 hover:text-gray-100'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {RECOMMENDATION_SECTIONS.map(section => (
          <section key={section.id} className="rounded border border-gray-800 bg-gray-950">
            <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-base font-bold text-gray-100">{section.title}</h3>
                <span className="text-xs text-gray-500">{section.description}</span>
              </div>
            </div>

            {section.cards.length > 0 ? (
              <div className="grid gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                {section.cards.map(card => (
                  <RecommendationCard
                    key={`${section.id}-${card.name}`}
                    card={card}
                    character={characterByName.get(card.name)}
                  />
                ))}
              </div>
            ) : (
              <EmptyRecommendationSection />
            )}
          </section>
        ))}
      </div>
    </section>
  )
}

function RecommendationCard({ card, character }) {
  const rarity = character?.rarity || card.tier
  const faction = character?.faction || '-'
  const shipType = character?.shipType || card.tags[0]
  const rarityStyle = rarityCardStyle(rarity)

  return (
    <article className={`relative flex min-h-[198px] flex-col overflow-hidden rounded-md border-2 bg-[#272727] p-2.5 shadow-lg ${rarityStyle.card}`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${rarityStyle.bar}`} />
      <div className="flex flex-col items-center text-center">
        <div className={`h-12 w-12 overflow-hidden rounded-full border-2 bg-gray-800 ${rarityStyle.portrait}`}>
          {character?.iconUrl ? (
            <img src={character.iconUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">
              {card.name.slice(0, 2)}
            </div>
          )}
        </div>
        <h4 className="mt-1.5 max-w-full truncate text-sm font-bold text-gray-100">{card.name}</h4>
        <div className="mt-1.5 flex flex-wrap justify-center gap-1 text-[10px] font-semibold">
          <Badge tone={rarityTone(rarity)}>{rarity}</Badge>
          <Badge>{faction}</Badge>
          <Badge>{shipType}</Badge>
          <Badge tone="blue">{card.lane}</Badge>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-[11px] font-bold text-gray-100">추천 역할</div>
        <div className="mt-0.5 truncate text-xs leading-5 text-gray-300">{card.summary}</div>
      </div>

      <div className="mt-2">
        <div className="text-[11px] font-bold text-gray-100">추천 이유</div>
        <ul className="mt-0.5 space-y-0.5 text-[11px] leading-4 text-gray-300">
          {card.notes.slice(0, 2).map(note => <li key={note} className="truncate">- {note}</li>)}
        </ul>
      </div>
    </article>
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

function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-700 text-gray-100',
    blue: 'bg-blue-600 text-white',
    rainbow: 'bg-fuchsia-600 text-white',
    gold: 'bg-yellow-500 text-gray-950',
    purple: 'bg-purple-500 text-white',
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

function rarityCardStyle(rarity) {
  if (rarity === 'UR') {
    return {
      card: 'border-fuchsia-400 shadow-fuchsia-950/30',
      bar: 'bg-gradient-to-r from-fuchsia-400 via-yellow-300 to-sky-400',
      portrait: 'border-fuchsia-300',
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
      card: 'border-purple-400 shadow-purple-950/20',
      bar: 'bg-purple-400',
      portrait: 'border-purple-300',
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
