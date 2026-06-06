import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TECH_CSV = path.join(__dirname, '../참고용/벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv')
const OFFICIAL_TECH_JSON = path.join(__dirname, '../참고용/AzurLaneData/KR/ShareCfg/fleet_tech_ship_template.json')
const CHARS_PATH = path.join(__dirname, '../src/data/characters.json')

const STAT_NAMES = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const STAT_BY_ID = {
  1: '내구',
  2: '화력',
  3: '뇌격',
  4: '대공',
  5: '항공',
  6: '장전',
  8: '명중',
  9: '회피',
  12: '대잠',
}
const SHIP_TYPE_BY_ID = {
  1: '구축',
  2: '경순',
  3: '중순',
  4: '순전',
  5: '전함',
  6: '경항모',
  7: '항모',
  8: '잠수',
  10: '항전',
  12: '공작',
  13: '모니터',
  17: '잠항모',
  18: '대형순',
  19: '운송',
  20: '구축',
  21: '구축',
  22: '범선',
  23: '범선',
  24: '범선',
}
const NAME_ALIASES = {
  잉그러햄: '잉그레이엄',
}

const raw = fs.readFileSync(TECH_CSV, 'utf-8')
const officialTech = fs.existsSync(OFFICIAL_TECH_JSON)
  ? JSON.parse(fs.readFileSync(OFFICIAL_TECH_JSON, 'utf-8'))
  : {}
const lines = parseCSVRecords(raw).map(l => l.trimEnd())

// No.가 숫자이거나 M/P/Z처럼 문자 접두어를 가진 데이터 행만 추출
const dataLines = lines.filter(l => /^[A-Za-z]?\d{3,}/.test(l))

function normalizeId(rawId) {
  const id = String(rawId || '').trim()
  return /^\d+$/.test(id) ? String(parseInt(id)) : id
}

function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

function parseCSVRecords(text) {
  const records = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += ch + text[i + 1]; i++ }
      else {
        inQuote = !inQuote
        cur += ch
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (cur.trim()) records.push(cur)
      cur = ''
      if (ch === '\r' && text[i + 1] === '\n') i++
    } else {
      cur += ch
    }
  }

  if (cur.trim()) records.push(cur)
  return records
}

function parseStat(cols, startIdx) {
  for (let i = 0; i < STAT_NAMES.length; i++) {
    const val = parseInt(cols[startIdx + i])
    if (val > 0) return { stat: STAT_NAMES[i], value: val }
  }
  return { stat: '', value: 0 }
}

// 캐릭터 ID는 메인시트/characters.json을 기준으로 유지한다.
// 함선기술 CSV는 점수/스탯 출처로만 쓰며, 이름이 정확히 일치하고 유일하면
// 기술 CSV의 ID가 달라도 해당 캐릭터에 점수/스탯을 반영한다.
// 단, 기술 CSV에는 같은 No.나 같은 이름을 공유하는 행이 있어 단일 기준만
// 쓰면 일부 함선이 덮어써진다.
const techRecords = []
const techByName = new Map()
const techById = new Map()
const duplicateIds = new Set()
const duplicateNames = new Set()
for (const line of dataLines) {
  const cols = parseCSVLine(line)
  const id = normalizeId(cols[0])
  if (!id) continue

  const shipTypesAcquired = [cols[9], cols[10], cols[11]].map(s => (s || '').trim()).filter(Boolean)
  const shipTypes120 = [cols[21], cols[22], cols[23]].map(s => (s || '').trim()).filter(Boolean)

  const record = {
    id,
    name: (cols[1] || '').trim(),
    techPoints: {
      acquired: parseInt(cols[5]) || 0,
      maxLB: parseInt(cols[6]) || 0,
      lv120: parseInt(cols[7]) || 0,
    },
    statAcquired: {
      shipTypes: shipTypesAcquired,
      ...parseStat(cols, 12),
    },
    stat120: {
      shipTypes: shipTypes120,
      ...parseStat(cols, 24),
    },
  }
  const appName = NAME_ALIASES[record.name] || record.name

  techRecords.push(record)
  if (appName) {
    if (techByName.has(appName)) duplicateNames.add(appName)
    else techByName.set(appName, record)
  }
  if (techById.has(id)) duplicateIds.add(id)
  else techById.set(id, record)
}

const characters = JSON.parse(fs.readFileSync(CHARS_PATH, 'utf-8'))

let matched = 0
let officialMatched = 0
const updated = characters.map(c => {
  const tech = (!duplicateNames.has(c.name) && techByName.get(c.name))
    || (duplicateIds.has(normalizeId(c.id)) ? null : techById.get(normalizeId(c.id)))

  const official = officialTech[String(c.gid)]
  if (official) {
    officialMatched++
    const baseTechPoints = tech?.techPoints || c.techPoints || { acquired: 0, maxLB: 0, lv120: 0 }
    return {
      ...c,
      techPoints: {
        acquired: official.pt_get ?? baseTechPoints.acquired,
        maxLB: official.pt_upgrage ?? baseTechPoints.maxLB,
        lv120: official.pt_level ?? baseTechPoints.lv120,
      },
      statAcquired: parseOfficialStat(official.add_get_shiptype, official.add_get_attr, official.add_get_value, tech?.statAcquired),
      stat120: parseOfficialStat(official.add_level_shiptype, official.add_level_attr, official.add_level_value, tech?.stat120),
    }
  }

  if (tech) {
    matched++
    return {
      ...c,
      techPoints: tech.techPoints,
      statAcquired: tech.statAcquired,
      stat120: tech.stat120,
    }
  }
  return c
})

fs.writeFileSync(CHARS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
console.log(`완료: 공식 원본 ${officialMatched}명, CSV ${matched}명 기술 데이터 반영, CSV ${techRecords.length}행 확인`)

function parseOfficialStat(shipTypeIds, attrId, value, fallbackStat) {
  const stat = STAT_BY_ID[attrId] || ''
  const parsedValue = value || 0
  if (!stat || !parsedValue) return { shipTypes: [], stat: '', value: 0 }

  const shipTypes = [...new Set((shipTypeIds || []).map(id => SHIP_TYPE_BY_ID[id]).filter(Boolean))]
  const fallbackShipTypes = fallbackStat?.stat === stat && fallbackStat.value === parsedValue
    ? fallbackStat.shipTypes || []
    : []

  if (stat === '대잠' && shipTypes.includes('경항모') && (fallbackShipTypes.includes('항모') || fallbackShipTypes.includes('정규항모'))) {
    shipTypes.push('항모')
  }

  return {
    shipTypes,
    stat,
    value: parsedValue,
  }
}
