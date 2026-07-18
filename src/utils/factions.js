const FACTION_ALIASES = new Map([
  ['USS', '유니온'],
  ['Eagle Union', '유니온'],
  ['이글 유니온', '유니온'],
  ['HMS', '로열'],
  ['Royal Navy', '로열'],
  ['로열 네이비', '로열'],
  ['IJN', '중앵'],
  ['Sakura Empire', '중앵'],
  ['사쿠라 엠파이어', '중앵'],
  ['KMS', '철혈'],
  ['Iron Blood', '철혈'],
  ['메탈 블러드', '철혈'],
  ['ROC', '동황'],
  ['PRAN', '동황'],
  ['Dragon Empery', '동황'],
  ['이스트 글림', '동황'],
  ['RN', '사르데냐'],
  ['Sardegna Empire', '사르데냐'],
  ['사르데냐 엠파이어', '사르데냐'],
  ['SN', '노스유니온'],
  ['Northern Parliament', '노스유니온'],
  ['노스 유니온', '노스유니온'],
  ['북방연합', '노스유니온'],
  ['북련', '노스유니온'],
  ['FFNF', '아이리스'],
  ['Iris Libre', '아이리스'],
  ['아이리스 리브레', '아이리스'],
  ['MNF', '비시아'],
  ['Vichya Dominion', '비시아'],
  ['비시아 성좌', '비시아'],
  ['비시아 큐리아', '비시아'],
  ['HNLMS', '튤리퍼'],
  ['Tulipa', '튤리퍼'],
  ['튤리퍼 왕국', '튤리퍼'],
  ['튤리파', '튤리퍼'],
])

export const FACTION_ORDER = [
  { value: '전체', label: '모든 진영' },
  { value: '유니온', label: '이글 유니온 (USS)' },
  { value: '로열', label: '로열 (HMS)' },
  { value: '중앵', label: '중앵 (IJN)' },
  { value: '철혈', label: '철혈 (KMS)' },
  { value: '동황', label: '동황 (ROC)' },
  { value: '사르데냐', label: '사르데냐 (RN)' },
  { value: '노스유니온', label: '노스 유니온 (SN)' },
  { value: '아이리스', label: '아이리스 (FFNF)' },
  { value: '비시아', label: '비시아 (MNF)' },
  { value: '튤리퍼', label: '튤리퍼 (HNLMS)' },
  { value: 'META', label: 'META' },
  { value: '템페스타', label: '템페스타' },
  { value: '기타', label: '기타' },
]

export function normalizeFactionValue(value) {
  const faction = String(value || '').trim()
  return FACTION_ALIASES.get(faction) || faction
}

export function getFactionDisplayName(value) {
  const faction = normalizeFactionValue(value)
  if (faction === '유니온') return '이글 유니온'
  if (faction === '노스유니온') return '노스 유니온'
  return faction
}

export function getFactionDisplayText(value) {
  return String(value || '')
    .replaceAll('노스유니온', '노스 유니온')
    .replace(/(?<!이글 )(?<!노스 )유니온/g, '이글 유니온')
}

export function getFactionOptions(factions) {
  const factionValues = new Set([...factions].map(normalizeFactionValue).filter(Boolean))
  const orderedFactionValues = new Set(FACTION_ORDER.map(o => o.value))
  const extraFactions = [...factionValues]
    .filter(f => !orderedFactionValues.has(f))
    .map(f => ({ value: f, label: f }))

  return [
    ...FACTION_ORDER.filter(o => o.value === '전체'),
    { value: '__faction-primary-divider', label: '────────', disabled: true },
    ...FACTION_ORDER.filter(o => o.value !== '전체' && factionValues.has(o.value)),
    ...(extraFactions.length ? [{ value: '__faction-collab-divider', label: '────────', disabled: true }] : []),
    ...extraFactions,
  ]
}
