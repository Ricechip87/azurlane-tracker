const FACTION_DEFINITIONS = [
  { value: '유니온', code: 'USS', displayName: '이글 유니온' },
  { value: '로열', code: 'HMS' },
  { value: '중앵', code: 'IJN' },
  { value: '철혈', code: 'KMS' },
  { value: '동황', code: 'ROC' },
  { value: '사르데냐', code: 'RN' },
  { value: '노스유니온', code: 'SN', displayName: '노스 유니온' },
  { value: '아이리스', code: 'FFNF' },
  { value: '비시아', code: 'MNF' },
  { value: '튤리퍼', code: 'HNLMS' },
  { value: '페드레리아', code: 'LDP' },
  { value: 'META', code: 'META' },
  { value: '템페스타', code: 'MOT' },
  { value: '기타' },
]

const FACTION_METADATA = new Map(FACTION_DEFINITIONS.map(definition => [definition.value, definition]))

const FACTION_ALIASES = new Map([
  ...FACTION_DEFINITIONS
    .filter(definition => definition.code)
    .map(definition => [definition.code, definition.value]),
  ['Eagle Union', '유니온'],
  ['이글 유니온', '유니온'],
  ['Royal Navy', '로열'],
  ['로열 네이비', '로열'],
  ['Sakura Empire', '중앵'],
  ['사쿠라 엠파이어', '중앵'],
  ['Iron Blood', '철혈'],
  ['메탈 블러드', '철혈'],
  ['PRAN', '동황'],
  ['Dragon Empery', '동황'],
  ['이스트 글림', '동황'],
  ['Sardegna Empire', '사르데냐'],
  ['사르데냐 엠파이어', '사르데냐'],
  ['Northern Parliament', '노스유니온'],
  ['노스 유니온', '노스유니온'],
  ['북방연합', '노스유니온'],
  ['북련', '노스유니온'],
  ['Iris Libre', '아이리스'],
  ['아이리스 리브레', '아이리스'],
  ['Vichya Dominion', '비시아'],
  ['비시아 성좌', '비시아'],
  ['비시아 큐리아', '비시아'],
  ['Tulipa', '튤리퍼'],
  ['튤리퍼 왕국', '튤리퍼'],
  ['튤리파', '튤리퍼'],
  ['Tempesta', '템페스타'],
  ['Liga de Pedrería', '페드레리아'],
  ['Liga de Pedreria', '페드레리아'],
  ['屠龙联盟', '페드레리아'],
])

export const FACTION_ORDER = [
  { value: '전체', label: '모든 진영' },
  ...FACTION_DEFINITIONS.map(definition => ({
    value: definition.value,
    label: getFactionFilterLabel(definition),
  })),
]

export function normalizeFactionValue(value) {
  const faction = String(value || '').trim()
  return FACTION_ALIASES.get(faction) || faction
}

export function getFactionDisplayName(value) {
  const faction = normalizeFactionValue(value)
  return FACTION_METADATA.get(faction)?.displayName || faction
}

export function getFactionBadgeName(value) {
  const faction = normalizeFactionValue(value)
  return FACTION_METADATA.get(faction)?.code || faction
}

export function getFactionDisplayText(value) {
  return String(value || '')
    .replaceAll('Liga de Pedrería', '페드레리아')
    .replaceAll('Liga de Pedreria', '페드레리아')
    .replaceAll('屠龙联盟', '페드레리아')
    .replace(/\bLDP\b(?!\s+[A-Za-zÀ-ÿ])/g, '페드레리아')
    .replace(/\bMOT\b(?!\s+[A-Za-zÀ-ÿ])/g, '템페스타')
    .replaceAll('노스유니온', '노스 유니온')
    .replace(/(?<!이글 )(?<!노스 )유니온/g, '이글 유니온')
}

export function getFactionSortIndex(value) {
  const faction = normalizeFactionValue(value)
  const index = FACTION_DEFINITIONS.findIndex(definition => definition.value === faction)
  return index === -1 ? FACTION_DEFINITIONS.length : index
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

function getFactionFilterLabel(definition) {
  const displayName = definition.displayName || definition.value
  return definition.code && definition.code !== displayName
    ? `${displayName} (${definition.code})`
    : displayName
}
