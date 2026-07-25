import { normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { normalizeFactionValue } from './factions.js'
import { getEffectiveRarity } from './rarity.js'
import { matchesShipClassification } from './shipClassifications.js'

export const DEFAULT_CHARACTER_FILTERS = Object.freeze({
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
})

const isCollabCharacter = character => String(character.id).startsWith('Z')
const isResearchCharacter = character => String(character.id).startsWith('P')

function normalizeRemodelStatus(character) {
  if (character.remodeled === 'O') return '개장'
  if (character.remodeled === 'X') return '미개장'
  return character.remodeled || '없음'
}

export function matchesCharacterFilters(character, filters) {
  if (filters.search && !character.name.includes(filters.search)) return false
  if (filters.rarity !== '전체' && getEffectiveRarity(character) !== filters.rarity) return false
  if (!matchesShipClassification(character.shipType, filters.shipType)) return false

  if (filters.faction !== '전체') {
    const characterFaction = normalizeFactionValue(character.faction)
    const selectedFaction = normalizeFactionValue(filters.faction)
    const matchesFaction = filters.faction === '기타'
      ? characterFaction === '기타' || isCollabCharacter(character)
      : characterFaction === selectedFaction
    if (!matchesFaction) return false
  }

  if (filters.acquired !== '전체' && normalizeAcquisitionStatus(character.acquired) !== filters.acquired) return false
  if (filters.skilled !== '전체' && (character.skilled || '스작 안함') !== filters.skilled) return false
  if (filters.affection !== '전체' && (character.affection || '호감작 안함') !== filters.affection) return false
  if (filters.remodel !== '전체' && normalizeRemodelStatus(character) !== filters.remodel) return false
  if (filters.favoritesOnly && !character.favorite) return false
  if (filters.researchOnly && !isResearchCharacter(character)) return false
  return true
}

export function filterCharacters(characters, filters) {
  return characters.filter(character => matchesCharacterFilters(character, filters))
}
