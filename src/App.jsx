import { useMemo, useState } from 'react'
import characterData from './data/characters.json'
import RecommendationPage from './components/RecommendationPage.jsx'
import BackToTopButton from './components/layout/BackToTopButton.jsx'
import TopMenu from './components/layout/TopMenu.jsx'
import {
  DataLoadStatePage,
  HomePage,
  MyRosterPage,
  UnderConstructionPage,
} from './components/pages/AppPages.jsx'
import { PAGE_TITLES } from './config/navigation.js'
import { useUserDataStorage } from './hooks/useUserDataStorage.js'
import { DEFAULT_CHARACTER_FILTERS, filterCharacters } from './utils/characterFilters.js'

export default function App() {
  const [activePage, setActivePage] = useState('home')
  const characters = characterData
  const charactersLoaded = true
  const charactersError = ''
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
  const dataStatePage = <DataLoadStatePage error={charactersError} />

  return (
    <div className="min-h-screen bg-[#171717] text-gray-100">
      <TopMenu activePage={activePage} onSelect={setActivePage} />
      {activePage === 'home' && <HomePage />}
      {activePage === 'my-roster' && (charactersLoaded ? (
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
      ) : dataStatePage)}
      {activePage === 'growth-recommend' && (charactersLoaded
        ? <RecommendationPage characters={enriched} />
        : dataStatePage)}
      {!['home', 'my-roster', 'growth-recommend'].includes(activePage) && (
        <UnderConstructionPage title={PAGE_TITLES[activePage] || '공사중'} />
      )}
      <BackToTopButton />
    </div>
  )
}
