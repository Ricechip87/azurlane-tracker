import { normalizeFactionValue } from './factions.js'
import { matchesShipClassification } from './shipClassifications.js'

export const SHIP_DATABASE_STAT_KEYS = [
  'health',
  'firepower',
  'torpedo',
  'antiair',
  'aviation',
  'reload',
  'accuracy',
  'evasion',
  'speed',
  'luck',
  'asw',
]

export const SHIP_DATABASE_STAT_LABELS = {
  health: '내구',
  firepower: '포격',
  torpedo: '뇌장',
  antiair: '대공',
  aviation: '항공',
  reload: '장전',
  accuracy: '명중',
  evasion: '기동',
  speed: '속력',
  luck: '행운',
  asw: '대잠',
}

export const SHIP_DATABASE_STAGES = [
  { id: 'base', label: '기본', level: 1 },
  { id: 'lb70', label: '풀돌 · 70', level: 70 },
  { id: '100', label: '100', level: 100 },
  { id: '120', label: '120', level: 120 },
  { id: '125', label: '125', level: 125 },
]

export const DEFAULT_SHIP_DATABASE_FILTERS = {
  search: '',
  rarity: '전체',
  shipType: '전체',
  faction: '전체',
  remodelOnly: false,
}

const STAGE_BY_ID = new Map(SHIP_DATABASE_STAGES.map(stage => [stage.id, stage]))

export function filterShipDatabaseCharacters(characters = [], filters = DEFAULT_SHIP_DATABASE_FILTERS) {
  const query = String(filters.search || '').trim().toLocaleLowerCase('ko')
  return characters.filter(character => {
    if (query && !String(character.name || '').toLocaleLowerCase('ko').includes(query)) return false
    if (filters.rarity && filters.rarity !== '전체' && character.rarity !== filters.rarity) return false
    if (
      filters.shipType
      && filters.shipType !== '전체'
      && !matchesShipClassification(character.shipType, filters.shipType)
    ) return false
    if (
      filters.faction
      && filters.faction !== '전체'
      && normalizeFactionValue(character.faction) !== normalizeFactionValue(filters.faction)
    ) return false
    if (filters.remodelOnly && !character.canRemodel) return false
    return true
  })
}

export function sortShipDatabaseCharacters(characters = [], detailsByGid = {}) {
  return [...characters].sort((a, b) => (
    number(detailsByGid[String(a.gid)]?.id) - number(detailsByGid[String(b.gid)]?.id)
  ))
}

export function calculateShipDatabaseStats(source, stageId = '125') {
  const stage = STAGE_BY_ID.get(String(stageId)) || STAGE_BY_ID.get('125')
  const level = stage.level
  const completedDevelopment = !source?.research || level >= 100
  const maxLimitBreak = stage.id !== 'base' && completedDevelopment
  const fullEnhance = stage.id !== 'base' && completedDevelopment
  const retrofit = level >= 100 ? source?.retrofit : null
  const base = maxLimitBreak ? source?.maxBase : source?.base
  const result = {}

  for (const key of SHIP_DATABASE_STAT_KEYS) {
    result[key] = Math.floor(
      number(base?.[key])
      + number(source?.growth?.[key]) * (level - 1) / 1000
      + (fullEnhance ? number(source?.enhance?.[key]) : 0)
      + number(retrofit?.[key]),
    )
  }

  return result
}

export function getVisibleRetrofitBonuses(source) {
  return Object.fromEntries(
    Object.entries(source?.retrofit || {})
      .filter(([key, value]) => (
        SHIP_DATABASE_STAT_KEYS.includes(key)
        && number(value) !== 0
      )),
  )
}

export function getArmorLabel(armor) {
  if (Number(armor) === 1) return '경장갑'
  if (Number(armor) === 2) return '중형장갑'
  if (Number(armor) === 3) return '중장갑'
  return '미확인'
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
