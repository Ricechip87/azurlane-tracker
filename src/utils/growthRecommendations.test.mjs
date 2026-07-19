import assert from 'node:assert/strict'
import { buildGrowthRecommendationSections } from './growthRecommendations.js'

const characters = [
  { id: '1', name: '우선함', rarity: 'SSR', shipType: '경순', faction: 'HMS', acquired: '획득' },
  { id: '2', name: '차순위함', rarity: 'SSR', shipType: '전함', faction: 'HMS', acquired: '획득' },
]
const recommendationData = {
  recommendations: [
    { source: 'main', name: '차순위함', tier: 'S', row: 2, column: 1, roleNote: '지원' },
    { source: 'main', name: '우선함', tier: 'SS', row: 1, column: 1, roleNote: '힐러' },
  ],
}
const obtainabilityByName = new Map(characters.map(character => [
  character.name,
  { difficulty: { key: 'easy', label: '쉬움' }, availability: 'permanent' },
]))

const sections = buildGrowthRecommendationSections('main', characters, recommendationData, obtainabilityByName)
assert.equal(sections.find(section => section.id === 'top').cards[0].name, '우선함')
assert.equal(sections.find(section => section.id === 'next').cards[0].name, '차순위함')
assert.equal(sections.find(section => section.id === 'special').cards[0].name, '우선함')
assert.equal(sections.find(section => section.id === 'main-force').cards[0].name, '차순위함')

console.log('growth recommendation logic tests passed')
