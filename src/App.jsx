import { useMemo, useState } from 'react'
import characters from './data/characters.json'
import { useLocalStorage } from './hooks/useLocalStorage'
import FilterPanel from './components/FilterPanel'
import CharacterTable from './components/CharacterTable'
import StatsBar from './components/StatsBar'
import BackupPanel from './components/BackupPanel'
import RecommendationPage from './components/RecommendationPage'
import { normalizeAcquisitionStatus } from './utils/acquisitionStatus.js'
import { matchesShipClassification } from './utils/shipClassifications.js'
import heroImage from './assets/hero.png'

const INITIAL_FILTERS = {
  search: '',
  rarity: '전체',
  shipType: '전체',
  faction: '전체',
  acquired: '전체',
  skilled: '전체',
  affection: '전체',
  remodel: '전체',
  favoritesOnly: false,
  researchOnly: false,
}

const MENU_GROUPS = [
  {
    label: '함순이 DB/육성/편성',
    items: [
      { id: 'ship-db', title: '함순이 DB', description: '인게임 함순이 DB 출력' },
      { id: 'my-roster', title: '내 함순이 정보', description: '현재 내 정보를 입력하는 곳' },
      {
        id: 'growth-recommend',
        title: '육성/편성 추천',
        description: '기술점수, 추가 스탯, 120 육성, 개발함, 해역/대작전 편성 추천',
      },
    ],
  },
  {
    label: '인게임 콘텐츠',
    items: [
      { id: 'skin-gallery', title: '스킨 일러', description: '함순이들 스킨 일러스트 모음' },
      { id: 'loading-gallery', title: '로딩 일러', description: '인게임 로딩 일러스트 모음' },
    ],
  },
]

const PAGE_TITLES = Object.fromEntries(
  MENU_GROUPS.flatMap(group => group.items.map(item => [item.id, item.title]))
)

function isCollabCharacter(c) {
  return String(c.id).startsWith('Z')
}

export default function App() {
  const [activePage, setActivePage] = useState('home')
  const [userData, setUserData] = useLocalStorage('azurlane-userdata', {})
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const updateUser = (id, field, value) => {
    setUserData(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }))
  }

  const enriched = useMemo(() =>
    characters.map(c => ({ ...c, ...(userData[c.id] || {}) })),
    [userData]
  )

  const filtered = useMemo(() => {
    return enriched.filter(c => {
      if (filters.search && !c.name.includes(filters.search)) return false
      if (filters.rarity !== '전체' && c.rarity !== filters.rarity) return false
      if (!matchesShipClassification(c.shipType, filters.shipType)) return false
      if (filters.faction !== '전체') {
        const matchesFaction = filters.faction === '기타'
          ? c.faction === '기타' || isCollabCharacter(c)
          : c.faction === filters.faction
        if (!matchesFaction) return false
      }
      if (filters.acquired !== '전체' && normalizeAcquisitionStatus(c.acquired) !== filters.acquired) return false
      if (filters.skilled !== '전체' && (c.skilled || '스작 안함') !== filters.skilled) return false
      if (filters.affection !== '전체' && (c.affection || '호감작 안함') !== filters.affection) return false
      if (filters.remodel !== '전체') {
        const val = c.remodeled === 'O' ? '개장' : c.remodeled === 'X' ? '미개장' : (c.remodeled || '없음')
        if (val !== filters.remodel) return false
      }
      if (filters.favoritesOnly && !c.favorite) return false
      if (filters.researchOnly && !String(c.id).startsWith('P')) return false
      return true
    })
  }, [enriched, filters])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopMenu activePage={activePage} onSelect={setActivePage} />

      {activePage === 'home' && <HomePage />}
      {activePage === 'my-roster' && (
        <MyRosterPage
          characters={enriched}
          filteredCharacters={filtered}
          filters={filters}
          setFilters={setFilters}
          updateUser={updateUser}
          userData={userData}
          setUserData={setUserData}
        />
      )}
      {activePage === 'growth-recommend' && (
        <RecommendationPage characters={enriched} />
      )}
      {activePage !== 'home' && activePage !== 'my-roster' && activePage !== 'growth-recommend' && (
        <UnderConstructionPage title={PAGE_TITLES[activePage] || '공사중'} />
      )}
    </div>
  )
}

function TopMenu({ activePage, onSelect }) {
  const [openMenu, setOpenMenu] = useState(null)

  const selectPage = pageId => {
    onSelect(pageId)
    setOpenMenu(null)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3">
        <button
          type="button"
          onClick={() => selectPage('home')}
          className={`flex h-10 w-10 items-center justify-center rounded border text-lg transition-colors ${activePage === 'home' ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700 hover:text-gray-100'}`}
          aria-label="홈"
        >
          ⌂
        </button>
        <div className="mr-auto">
          <div className="text-sm font-bold text-blue-300">AzurLane Tracker</div>
          <div className="text-[11px] text-gray-500">벽람항로 개인용 장난감</div>
        </div>

        <nav className="flex flex-wrap justify-end gap-2">
          {MENU_GROUPS.map(group => (
            <MenuDropdown
              key={group.label}
              group={group}
              activePage={activePage}
              isOpen={openMenu === group.label}
              onOpen={() => setOpenMenu(group.label)}
              onClose={() => setOpenMenu(null)}
              onSelect={selectPage}
            />
          ))}
        </nav>
      </div>
    </header>
  )
}

function MenuDropdown({ group, activePage, isOpen, onOpen, onClose, onSelect }) {
  const isActive = group.items.some(item => item.id === activePage)

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose()
      }}
    >
      <button
        type="button"
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-expanded={isOpen}
        className={`h-10 rounded border px-4 text-sm font-semibold transition-colors ${isActive ? 'border-blue-500 bg-blue-600/20 text-blue-100' : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-gray-700'}`}
      >
        {group.label} ▾
      </button>
      <div className={`${isOpen ? 'visible translate-y-1 opacity-100' : 'invisible translate-y-2 opacity-0'} absolute right-0 top-full z-40 w-[360px] rounded border border-gray-800 bg-gray-950 p-3 shadow-2xl shadow-black/40 transition-all`}>
        <div className="mb-2 px-2 text-xs text-gray-500">{group.label}</div>
        <div className="space-y-1">
          {group.items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded px-3 py-3 text-left transition-colors ${activePage === item.id ? 'bg-blue-600/20 text-blue-100' : 'text-gray-200 hover:bg-gray-900'}`}
            >
              <div className="text-sm font-bold">{item.title}</div>
              <div className="mt-1 text-xs leading-5 text-gray-500">{item.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <main className="mx-auto max-w-[1500px] p-6">
      <section className="relative min-h-[420px] overflow-hidden rounded border border-gray-800 bg-gray-900">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-gray-950/20" />
        <div className="relative flex min-h-[420px] max-w-3xl flex-col justify-center px-8 py-10">
          <div className="mb-4 w-fit rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white">PRIVATE TOOL</div>
          <h1 className="text-4xl font-black text-white">AzurLane Tracker</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-200">
            내 보유함 기반 성장, 기술점수, 추가 스탯, 편성 추천을 정리하기 위한 벽람항로 개인 도구.
          </p>
        </div>
      </section>
    </main>
  )
}

function MyRosterPage({ characters, filteredCharacters, filters, setFilters, updateUser, userData, setUserData }) {
  return (
    <>
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400">내 함순이 정보</h1>
          <BackupPanel userData={userData} setUserData={setUserData} compact />
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <StatsBar characters={characters} />
          <RosterHeroPanel />
        </div>
        <FilterPanel filters={filters} setFilters={setFilters} characters={characters} />
        <CharacterTable characters={filteredCharacters} updateUser={updateUser} />
      </main>
    </>
  )
}

function RosterHeroPanel() {
  return (
    <section className="min-h-[206px] flex-1 min-w-[420px] overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <div className="grid h-full min-h-[206px] grid-cols-[280px_1fr]">
        <div className="flex items-center justify-center border-r border-gray-800 bg-gray-950/60">
          <div className="h-[150px] w-[220px] rounded border border-dashed border-gray-700 bg-gray-900/80" />
        </div>
        <div className="flex flex-col justify-center px-6 py-5">
          <div className="text-xs font-semibold text-blue-300">이미지 / 문구 영역</div>
          <div className="mt-3 text-2xl font-bold text-gray-200">내 함순이 정보</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            이 영역에는 나중에 원하는 이미지와 안내 문구를 배치할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  )
}

function UnderConstructionPage({ title }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[1500px] items-center justify-center p-6">
      <section className="flex aspect-[16/9] w-full max-w-4xl items-center justify-center rounded border border-blue-400/30 bg-sky-500 text-center shadow-2xl shadow-blue-950/40">
        <div>
          <div className="text-sm font-semibold text-blue-100">{title}</div>
          <div className="mt-4 text-3xl font-bold text-white">공사중</div>
        </div>
      </section>
    </main>
  )
}
