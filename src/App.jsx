import { useState, useMemo } from 'react'
import characters from './data/characters.json'
import { useLocalStorage } from './hooks/useLocalStorage'
import FilterPanel from './components/FilterPanel'
import CharacterTable from './components/CharacterTable'
import StatsBar from './components/StatsBar'
import BackupPanel from './components/BackupPanel'
import { normalizeAcquisitionStatus } from './utils/acquisitionStatus.js'
import { getShipClassification } from './utils/shipClassifications.js'

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
}

function isCollabCharacter(c) {
  return String(c.id).startsWith('Z')
}

export default function App() {
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
      if (filters.shipType !== '전체' && getShipClassification(c.shipType) !== filters.shipType) return false
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
      return true
    })
  }, [enriched, filters])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400">벽람항로 함순이 도감</h1>
          <BackupPanel userData={userData} setUserData={setUserData} compact />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <StatsBar characters={enriched} filtered={filtered} />
        <FilterPanel filters={filters} setFilters={setFilters} characters={enriched} />
        <CharacterTable characters={filtered} updateUser={updateUser} />
      </div>
    </div>
  )
}
