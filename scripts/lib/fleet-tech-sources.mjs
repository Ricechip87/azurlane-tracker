const SCALAR_FIELDS = [
  'id',
  'pt_get',
  'pt_upgrage',
  'pt_level',
  'add_get_attr',
  'add_get_value',
  'add_level_attr',
  'add_level_value',
]

const ARRAY_FIELDS = ['add_get_shiptype', 'add_level_shiptype']

const STAT_BY_ID = {
  1: '내구', 2: '화력', 3: '뇌격', 4: '대공', 5: '항공',
  6: '장전', 8: '명중', 9: '회피', 12: '대잠',
}

const SHIP_TYPE_BY_ID = {
  1: '구축', 2: '경순', 3: '중순', 4: '순전', 5: '전함',
  6: '경항모', 7: '항모', 8: '잠수', 10: '항전', 12: '공작',
  13: '모니터', 17: '잠항모', 18: '초순', 19: '운송',
  20: '구축', 21: '구축', 22: '범선', 23: '범선', 24: '범선',
}

export function parseFleetTechLua(text) {
  const records = {}
  const header = /(?:\[(\d+)\]|(?:pg\.base\.)?fleet_tech_ship_template\[(\d+)\])\s*=\s*\{/g

  for (const match of text.matchAll(header)) {
    const gid = match[1] || match[2]
    const openingBrace = match.index + match[0].lastIndexOf('{')
    const closingBrace = findClosingBrace(text, openingBrace)
    if (closingBrace < 0) continue

    const body = text.slice(openingBrace + 1, closingBrace)
    const record = {}

    for (const field of SCALAR_FIELDS) {
      const value = body.match(new RegExp(`(?:^|\\n)\\s*${field}\\s*=\\s*(-?\\d+)`, 'm'))
      if (value) record[field] = Number(value[1])
    }
    for (const field of ARRAY_FIELDS) {
      const value = body.match(new RegExp(`${field}\\s*=\\s*\\{([\\s\\S]*?)\\}`))
      record[field] = value ? [...value[1].matchAll(/-?\d+/g)].map(item => Number(item[0])) : []
    }

    record.id ??= Number(gid)
    records[gid] = record
  }

  return records
}

export function selectFleetTechRecord({ cn, kr, sheet }) {
  if (cn) return { record: cn, source: 'cn-lua' }
  if (kr) return { record: kr, source: 'kr-json' }
  if (sheet) return { record: sheet, source: 'tech-sheet' }
  return { record: null, source: 'existing' }
}

export function officialRecordToCharacterTech(record, fallback = {}) {
  return {
    techPoints: {
      acquired: record.pt_get ?? fallback.techPoints?.acquired ?? 0,
      maxLB: record.pt_upgrage ?? fallback.techPoints?.maxLB ?? 0,
      lv120: record.pt_level ?? fallback.techPoints?.lv120 ?? 0,
    },
    statAcquired: parseOfficialStat(
      record.add_get_shiptype,
      record.add_get_attr,
      record.add_get_value,
      fallback.statAcquired,
    ),
    stat120: parseOfficialStat(
      record.add_level_shiptype,
      record.add_level_attr,
      record.add_level_value,
      fallback.stat120,
    ),
  }
}

function findClosingBrace(text, openingBrace) {
  let depth = 0
  for (let i = openingBrace; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function parseOfficialStat(shipTypeIds, attrId, value, fallbackStat) {
  const stat = STAT_BY_ID[attrId] || ''
  const parsedValue = value || 0
  if (!stat || !parsedValue) return { shipTypes: [], stat: '', value: 0 }

  let shipTypes = [...new Set((shipTypeIds || []).map(id => SHIP_TYPE_BY_ID[id]).filter(Boolean))]
  const fallbackShipTypes = fallbackStat?.stat === stat && fallbackStat.value === parsedValue
    ? fallbackStat.shipTypes || []
    : []
  if (sameShipTypes(shipTypes, fallbackShipTypes)) shipTypes = [...fallbackShipTypes]
  if (stat === '대잠' && shipTypes.includes('경항모') && (fallbackShipTypes.includes('항모') || fallbackShipTypes.includes('정규항모'))) {
    shipTypes.push('항모')
  }
  return { shipTypes, stat, value: parsedValue }
}

function sameShipTypes(left, right) {
  const aliases = { 잠수함: '잠수', 잠수항모: '잠항모', 대형순: '초순', 정규항모: '항모' }
  const normalize = values => [...new Set(values.map(value => aliases[value] || value))].sort()
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right))
}
