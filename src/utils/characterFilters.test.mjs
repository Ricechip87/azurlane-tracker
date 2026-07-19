import assert from 'node:assert/strict'
import { DEFAULT_CHARACTER_FILTERS, filterCharacters } from './characterFilters.js'

const characters = [
  { id: '001', name: '일반함', rarity: 'SSR', shipType: '경순', faction: '이글 유니온', acquired: '획득', remodeled: 'X', favorite: true },
  { id: 'P001', name: '개발함', rarity: 'SSR', shipType: '항모', faction: '로열 네이비', acquired: '미획득', remodeled: 'X' },
  { id: 'Z001', name: '콜라보함', rarity: 'SR', shipType: '구축', faction: '콜라보', acquired: '풀돌' },
]

assert.deepEqual(filterCharacters(characters, DEFAULT_CHARACTER_FILTERS), characters)
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, search: '개발' }).map(c => c.id), ['P001'])
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, rarity: 'SSR' }).map(c => c.id), ['001', 'P001'])
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, faction: '기타' }).map(c => c.id), ['Z001'])
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, acquired: '획득' }).map(c => c.id), ['001'])
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, remodel: '미개장' }).map(c => c.id), ['001', 'P001'])
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, favoritesOnly: true }).map(c => c.id), ['001'])
assert.deepEqual(filterCharacters(characters, { ...DEFAULT_CHARACTER_FILTERS, researchOnly: true }).map(c => c.id), ['P001'])

console.log('character filter tests passed')
