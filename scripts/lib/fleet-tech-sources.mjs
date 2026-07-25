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

export const STAT_BY_ID = {
  1: '내구', 2: '화력', 3: '뇌격', 4: '대공', 5: '항공',
  6: '장전', 8: '명중', 9: '회피', 12: '대잠',
}

export const SHIP_TYPE_BY_ID = {
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
  if (kr) return { record: kr, source: 'kr-lua' }
  if (sheet) return { record: sheet, source: 'tech-sheet' }
  return { record: null, source: 'existing' }
}

export function selectFleetTechSheetRecord(sheetRecords, character) {
  const byName = sheetRecords.byName.get(character.name)
  if (byName && sheetRecordAppliesToCharacter(byName, character)) return byName

  const byId = sheetRecords.byId.get(normalizeSheetId(character.id))
  if (byId
    && normalizeTechName(byId.name) === normalizeTechName(character.name)
    && sheetRecordAppliesToCharacter(byId, character)) {
    return byId
  }
  return undefined
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

const TECH_SHEET_STAT_NAMES = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']

export function parseFleetTechSheet(raw, options = {}) {
  const nameAliases = options.nameAliases || {}
  const byName = new Map()
  const byId = new Map()
  const duplicateNames = new Set()
  const duplicateIds = new Set()

  for (const line of parseCsvRecords(raw).map(value => value.trimEnd()).filter(value => /^[A-Za-z]?\d{3,}/.test(value))) {
    const cols = parseCsvLine(line)
    const id = normalizeSheetId(cols[0])
    if (!id) continue

    const record = {
      id,
      name: (cols[1] || '').trim(),
      techPoints: {
        acquired: Number.parseInt(cols[5]) || 0,
        maxLB: Number.parseInt(cols[6]) || 0,
        lv120: Number.parseInt(cols[7]) || 0,
      },
      statAcquired: {
        shipTypes: [cols[9], cols[10], cols[11]].map(value => (value || '').trim()).filter(Boolean),
        ...parseSheetStat(cols, 12),
      },
      stat120: {
        shipTypes: [cols[21], cols[22], cols[23]].map(value => (value || '').trim()).filter(Boolean),
        ...parseSheetStat(cols, 24),
      },
    }
    const name = nameAliases[record.name] || record.name

    if (name) {
      if (byName.has(name)) duplicateNames.add(name)
      else byName.set(name, record)
    }
    if (byId.has(id)) duplicateIds.add(id)
    else byId.set(id, record)
  }

  for (const name of duplicateNames) byName.delete(name)
  for (const id of duplicateIds) byId.delete(id)
  return { byName, byId, duplicateNames, duplicateIds }
}

export function buildFactionTechLevels(groupData, templateData) {
  const factionCodes = { 1: 'USS', 2: 'HMS', 3: 'IJN', 4: 'KMS' }
  return Object.fromEntries(Object.entries(factionCodes).map(([groupId, code]) => [
    code,
    (groupData[groupId]?.techs || []).map((techId, index) => {
      const source = templateData[String(techId)]
      return {
        level: index + 1,
        pt: source?.pt || 0,
        bonuses: (source?.add || []).flatMap(([shipTypeIds, statId, value]) => (
          shipTypeIds.map(shipTypeId => ({
            shipType: normalizeDisplayShipType(SHIP_TYPE_BY_ID[shipTypeId]),
            stat: STAT_BY_ID[statId],
            value,
          })).filter(bonus => bonus.shipType && bonus.stat)
        )),
      }
    }),
  ]))
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

function sheetRecordAppliesToCharacter(record, character) {
  const appliedTypes = [...new Set([
    ...(record.statAcquired?.shipTypes || []),
    ...(record.stat120?.shipTypes || []),
  ].map(normalizeDisplayShipType))]
  if (!appliedTypes.length) return true
  return appliedTypes.includes(normalizeDisplayShipType(character.shipType))
}

function normalizeTechName(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[·ㆍ\s()（）・]/g, '')
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const character = line[i]
    if (character === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++ }
      else quoted = !quoted
    } else if (character === ',' && !quoted) {
      result.push(current)
      current = ''
    } else current += character
  }
  result.push(current)
  return result
}

function parseCsvRecords(text) {
  const records = []
  let current = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const character = text[i]
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { current += '""'; i++ }
      else { quoted = !quoted; current += character }
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (current.trim()) records.push(current)
      current = ''
      if (character === '\r' && text[i + 1] === '\n') i++
    } else current += character
  }
  if (current.trim()) records.push(current)
  return records
}

function parseSheetStat(columns, startIndex) {
  for (let i = 0; i < TECH_SHEET_STAT_NAMES.length; i++) {
    const value = Number.parseInt(columns[startIndex + i])
    if (value > 0) return { stat: TECH_SHEET_STAT_NAMES[i], value }
  }
  return { stat: '', value: 0 }
}

function normalizeSheetId(rawId) {
  const id = String(rawId || '').trim()
  return /^\d+$/.test(id) ? String(Number.parseInt(id)) : id
}

function normalizeDisplayShipType(shipType) {
  const aliases = { 초순: '대형순' }
  return aliases[shipType] || shipType
}
