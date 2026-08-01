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

const affectionCharacters = [
  { id: 'OLD', name: '구 저장값', shipType: '구축', affection: '호감작 중' },
  { id: 'NEW', name: '새 저장값', shipType: '구축', affection: '호감 61+' },
  { id: 'OATH', name: '서약함', shipType: '구축', affection: '서약 200' },
]
assert.deepEqual(
  filterCharacters(affectionCharacters, { ...DEFAULT_CHARACTER_FILTERS, affection: '호감 61+' }).map(c => c.id),
  ['OLD', 'NEW'],
  '구 호감작 중 값도 새 호감 61+ 필터에 포함해야 합니다.',
)

const cruiserCharacters = [
  { id: 'CA', name: '중순양함', shipType: '중순' },
  { id: 'CB', name: '대형순양함', shipType: '대순' },
  { id: 'CL-HEAVY', name: '초순양함', shipType: '초순' },
]
assert.deepEqual(
  filterCharacters(cruiserCharacters, { ...DEFAULT_CHARACTER_FILTERS, shipType: '중순' }).map(c => c.id),
  ['CA', 'CB', 'CL-HEAVY'],
  '내 함순이 정보의 중순 필터는 중순·대순·초순을 모두 포함해야 합니다.',
)

const codedFactionCharacters = [
  { id: 'MOT001', name: '템페스타 코드 함선', faction: 'MOT', shipType: '범선' },
  { id: 'LDP001', name: '페드레리아 코드 함선', faction: 'LDP', shipType: '전함' },
]
assert.deepEqual(
  filterCharacters(codedFactionCharacters, { ...DEFAULT_CHARACTER_FILTERS, faction: '템페스타' }).map(c => c.id),
  ['MOT001'],
)
assert.deepEqual(
  filterCharacters(codedFactionCharacters, { ...DEFAULT_CHARACTER_FILTERS, faction: '페드레리아' }).map(c => c.id),
  ['LDP001'],
)

console.log('character filter tests passed')
