import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  officialRecordToCharacterTech,
  parseFleetTechLua,
  selectFleetTechRecord,
} from './lib/fleet-tech-sources.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REFERENCE_ROOT = path.join(__dirname, '../참고용')
const TECH_CSV = path.join(REFERENCE_ROOT, '벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv')
const CN_TECH_LUA = path.join(REFERENCE_ROOT, 'AzurLaneLuaScripts/CN/sharecfg/fleet_tech_ship_template.lua')
const KR_TECH_JSON = path.join(REFERENCE_ROOT, 'AzurLaneData/KR/ShareCfg/fleet_tech_ship_template.json')
const CHARS_PATH = path.join(__dirname, '../src/data/characters.json')

const STAT_NAMES = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const NAME_ALIASES = { 잉그러햄: '잉그레이엄' }

const cnTech = fs.existsSync(CN_TECH_LUA)
  ? parseFleetTechLua(fs.readFileSync(CN_TECH_LUA, 'utf8'))
  : {}
const krTech = fs.existsSync(KR_TECH_JSON)
  ? JSON.parse(fs.readFileSync(KR_TECH_JSON, 'utf8'))
  : {}
const sheetRecords = parseTechSheet(fs.readFileSync(TECH_CSV, 'utf8'))
const characters = JSON.parse(fs.readFileSync(CHARS_PATH, 'utf8'))
const counts = { 'cn-lua': 0, 'kr-json': 0, 'tech-sheet': 0, existing: 0 }

const updated = characters.map(character => {
  const sheet = sheetRecords.byName.get(character.name)
    || sheetRecords.byId.get(normalizeId(character.id))
  const selected = selectFleetTechRecord({
    cn: cnTech[String(character.gid)],
    kr: krTech[String(character.gid)],
    sheet,
  })
  counts[selected.source]++

  if (!selected.record) return character
  if (selected.source === 'tech-sheet') {
    return {
      ...character,
      techPoints: selected.record.techPoints,
      statAcquired: selected.record.statAcquired,
      stat120: selected.record.stat120,
    }
  }

  return { ...character, ...officialRecordToCharacterTech(selected.record, character) }
})

fs.writeFileSync(CHARS_PATH, `${JSON.stringify(updated, null, 2)}\n`, 'utf8')
console.log(`기술 데이터 반영 완료: CN Lua ${counts['cn-lua']}척, KR JSON ${counts['kr-json']}척, 기술 시트 ${counts['tech-sheet']}척, 기존값 유지 ${counts.existing}척`)

function parseTechSheet(raw) {
  const byName = new Map()
  const byId = new Map()
  const duplicateNames = new Set()
  const duplicateIds = new Set()

  for (const line of parseCSVRecords(raw).map(value => value.trimEnd()).filter(value => /^[A-Za-z]?\d{3,}/.test(value))) {
    const cols = parseCSVLine(line)
    const id = normalizeId(cols[0])
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
    const name = NAME_ALIASES[record.name] || record.name

    if (name) {
      if (byName.has(name)) duplicateNames.add(name)
      else byName.set(name, record)
    }
    if (byId.has(id)) duplicateIds.add(id)
    else byId.set(id, record)
  }

  for (const name of duplicateNames) byName.delete(name)
  for (const id of duplicateIds) byId.delete(id)
  return { byName, byId }
}

function parseCSVLine(line) {
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

function parseCSVRecords(text) {
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
  for (let i = 0; i < STAT_NAMES.length; i++) {
    const value = Number.parseInt(columns[startIndex + i])
    if (value > 0) return { stat: STAT_NAMES[i], value }
  }
  return { stat: '', value: 0 }
}

function normalizeId(rawId) {
  const id = String(rawId || '').trim()
  return /^\d+$/.test(id) ? String(Number.parseInt(id)) : id
}
