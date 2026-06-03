export const SHIP_CLASSIFICATION_OPTIONS = [
  '전체',
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

export function normalizeShipTypeValue(shipType) {
  const value = String(shipType || '').trim()
  return SHIP_TYPE_ALIASES.get(value) || value
}

export function getShipClassification(shipType) {
  const normalized = normalizeShipTypeValue(shipType)
  return CLASSIFICATION_BY_SHIP_TYPE.get(normalized) || normalized
}
