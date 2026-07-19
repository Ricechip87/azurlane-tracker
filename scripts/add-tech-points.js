import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  officialRecordToCharacterTech,
  parseFleetTechSheet,
  parseFleetTechLua,
  selectFleetTechRecord,
} from './lib/fleet-tech-sources.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REFERENCE_ROOT = path.join(__dirname, '../참고용')
const TECH_CSV = path.join(REFERENCE_ROOT, '벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv')
const CN_TECH_LUA = path.join(REFERENCE_ROOT, 'AzurLaneLuaScripts/CN/sharecfg/fleet_tech_ship_template.lua')
const KR_TECH_JSON = path.join(REFERENCE_ROOT, 'AzurLaneData/KR/ShareCfg/fleet_tech_ship_template.json')
const CHARS_PATH = path.join(__dirname, '../src/data/characters.json')

const NAME_ALIASES = { 잉그러햄: '잉그레이엄' }

const cnTech = fs.existsSync(CN_TECH_LUA)
  ? parseFleetTechLua(fs.readFileSync(CN_TECH_LUA, 'utf8'))
  : {}
const krTech = fs.existsSync(KR_TECH_JSON)
  ? JSON.parse(fs.readFileSync(KR_TECH_JSON, 'utf8'))
  : {}
const sheetRecords = parseFleetTechSheet(fs.readFileSync(TECH_CSV, 'utf8'), { nameAliases: NAME_ALIASES })
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

function normalizeId(rawId) {
  const id = String(rawId || '').trim()
  return /^\d+$/.test(id) ? String(Number.parseInt(id)) : id
}
