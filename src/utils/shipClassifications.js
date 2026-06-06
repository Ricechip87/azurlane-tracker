export const SHIP_CLASSIFICATION_OPTIONS = [
  '전체',
  '전열',
  '후열',
  '구축',
  '경순',
  '중순',
  '전함',
  '항모',
  '공작',
  '잠수',
  '기타',
]

const SHIP_TYPE_ALIASES = new Map([
  ['공작', '공작함'],
])

const STAT_SHIP_TYPE_ALIASES = new Map([
  ['공작함', '공작'],
  ['정규항모', '항모'],
  ['초순', '대형순'],
  ['대순', '대형순'],
  ['잠수함', '잠수'],
  ['잠수항모', '잠항모'],
  ['잠순', '잠항모'],
  ['운송함', '운송'],
  ['보급', '운송'],
])

const CLASSIFICATION_BY_SHIP_TYPE = new Map([
  ['구축', '구축'],
  ['경순', '경순'],
  ['중순', '중순'],
  ['대순', '중순'],
  ['전함', '전함'],
  ['순전', '전함'],
  ['경항모', '항모'],
  ['항모', '항모'],
  ['공작함', '공작'],
  ['잠수', '잠수'],
  ['잠수항모', '잠수'],
  ['모니터', '기타'],
  ['운송함', '기타'],
  ['범선', '기타'],
  ['항전', '기타'],
])

const FRONTLINE_TYPES = new Set(['구축', '경순', '중순', '대형순', '운송'])
const BACKLINE_TYPES = new Set(['순전', '전함', '경항모', '항모', '항전', '공작', '모니터'])

export function normalizeShipTypeValue(shipType) {
  const value = String(shipType || '').trim()
  return SHIP_TYPE_ALIASES.get(value) || value
}

export function getShipClassification(shipType) {
  const normalized = normalizeShipTypeValue(shipType)
  return CLASSIFICATION_BY_SHIP_TYPE.get(normalized) || normalized
}

export function getShipPosition(shipType) {
  const normalized = normalizeStatShipTypeValue(normalizeShipTypeValue(shipType))
  if (FRONTLINE_TYPES.has(normalized)) return '전열'
  if (BACKLINE_TYPES.has(normalized)) return '후열'
  return '기타'
}

export function matchesShipClassification(shipType, classification) {
  if (classification === '전체') return true
  if (classification === '전열' || classification === '후열') {
    return getShipPosition(shipType) === classification
  }
  return getShipClassification(shipType) === classification
}

export function normalizeStatShipTypeValue(shipType) {
  const value = String(shipType || '').trim()
  return STAT_SHIP_TYPE_ALIASES.get(value) || value
}
