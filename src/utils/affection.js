export const AFFECTION_STAGES = Object.freeze([
  Object.freeze({ value: '기타', label: '기타 (0%)', multiplier: 1 }),
  Object.freeze({ value: '호감 61+', label: '호감 61+ (1%)', multiplier: 1.01 }),
  Object.freeze({ value: '기쁨 81+', label: '기쁨 81+ (3%)', multiplier: 1.03 }),
  Object.freeze({ value: '사랑 100', label: '사랑 100 (6%)', multiplier: 1.06 }),
  Object.freeze({ value: '서약 100+', label: '서약 100+ (9%)', multiplier: 1.09 }),
  Object.freeze({ value: '서약 200', label: '서약 200 (12%)', multiplier: 1.12 }),
])

export const AFFECTION_OPTIONS = Object.freeze(AFFECTION_STAGES.map(stage => stage.value))
export const AFFECTION_SELECT_OPTIONS = Object.freeze(AFFECTION_STAGES.map(stage => Object.freeze({
  value: stage.value,
  label: stage.label,
})))

const STAGE_BY_VALUE = new Map(AFFECTION_STAGES.map(stage => [stage.value, stage]))
const LEGACY_STATUS_MAP = new Map([
  ['호감작 안함', '기타'],
  ['호감작 중', '호감 61+'],
  ['서약 완료', '서약 100+'],
  ['호감도 Max', '서약 200'],
  ['호감도 MAX', '서약 200'],
])

for (const stage of AFFECTION_STAGES) LEGACY_STATUS_MAP.set(stage.label, stage.value)

export function normalizeAffectionStatus(status) {
  if (STAGE_BY_VALUE.has(status)) return status
  return LEGACY_STATUS_MAP.get(status) || '기타'
}

export function getAffectionMultiplier(status) {
  return STAGE_BY_VALUE.get(normalizeAffectionStatus(status))?.multiplier || 1
}

export function getAffectionOptionLabel(status) {
  return STAGE_BY_VALUE.get(normalizeAffectionStatus(status))?.label || AFFECTION_STAGES[0].label
}

export function isOathAffection(status) {
  const normalized = normalizeAffectionStatus(status)
  return normalized === '서약 100+' || normalized === '서약 200'
}
