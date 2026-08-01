import { lazy, Suspense, useMemo, useState } from 'react'
import characterData from './data/characters.json'
import RecommendationPage from './components/RecommendationPage.jsx'
import BackToTopButton from './components/layout/BackToTopButton.jsx'
import TopMenu from './components/layout/TopMenu.jsx'
import {
  HomePage,
  MyRosterPage,
  UnderConstructionPage,
} from './components/pages/AppPages.jsx'
import { PAGE_TITLES } from './config/navigation.js'
import { useUserDataStorage } from './hooks/useUserDataStorage.js'
import { DEFAULT_CHARACTER_FILTERS, filterCharacters } from './utils/characterFilters.js'

const ShipDatabasePage = lazy(() => import('./components/ShipDatabasePage.jsx'))

export default function App() {
  const [activePage, setActivePage] = useState('home')
  const characters = characterData
  const [userData, setUserData, storageMessage] = useUserDataStorage('azurlane-userdata')
  const [filters, setFilters] = useState(DEFAULT_CHARACTER_FILTERS)

  const updateUser = (id, field, value) => {
    setUserData(previous => ({
      ...previous,
      [id]: { ...(previous[id] || {}), [field]: value },
    }))
  }

  const enriched = useMemo(
    () => characters.map(character => ({ ...character, ...(userData[character.id] || {}) })),
    [characters, userData]
  )
  const filtered = useMemo(() => filterCharacters(enriched, filters), [enriched, filters])

  return (
    <div className="min-h-screen bg-[#171717] text-gray-100">
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
          storageMessage={storageMessage}
        />
      )}
      {activePage === 'growth-recommend' && <RecommendationPage characters={enriched} />}
      {activePage === 'ship-db' && (
        <Suspense fallback={<ShipDatabaseLoading />}>
          <ShipDatabasePage characters={characters} />
        </Suspense>
      )}
      {!['home', 'my-roster', 'growth-recommend', 'ship-db'].includes(activePage) && (
        <UnderConstructionPage title={PAGE_TITLES[activePage] || '공사중'} />
      )}
      <BackToTopButton />
    </div>
  )
}

function ShipDatabaseLoading() {
  return (
    <main className="mx-auto max-w-[1500px] p-4">
      <div className="flex min-h-[360px] items-center justify-center border border-neutral-700 bg-[#242424] text-sm text-gray-500">
        함순이 DB 데이터를 불러오는 중입니다.
      </div>
    </main>
  )
}
