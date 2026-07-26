const STAT_DISPLAY_NAMES = {
  뇌격: '뇌장',
  화력: '포격',
  회피: '기동',
}

const STAT_NAME_ALIASES = {
  뇌장: '뇌격',
  포격: '화력',
  기동: '회피',
  '뇌격 (뇌장)': '뇌격',
  '화력 (포격)': '화력',
  '회피 (기동)': '회피',
}

export function normalizeStatName(stat) {
  const value = String(stat || '').trim()
  return STAT_NAME_ALIASES[value] || value
}

export function getStatDisplayName(stat) {
  const normalized = normalizeStatName(stat)
  return STAT_DISPLAY_NAMES[normalized] || normalized
}
