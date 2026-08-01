import fs from 'fs'
import path from 'path'
import process from 'node:process'
import { fileURLToPath } from 'url'
import { normalizeFactionValue } from '../src/utils/factions.js'
import { normalizeShipTypeValue } from '../src/utils/shipClassifications.js'
import { normalizeStatName } from '../src/utils/statLabels.js'
import { SHIP_TYPE_BY_ID } from './lib/fleet-tech-sources.mjs'
import {
  buildExistingCharacterIndexes,
  normalizeCharacterSourceId,
  normalizeCharacterSourceName,
  selectExistingCharacter,
} from './lib/character-source-identity.mjs'
import { parseCsvRecords } from './lib/csv-records.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ICON_DIR = path.join(__dirname, '../public/ship-icons')

function getLocalIconUrl(skinId) {
  const extension = ['png', 'webp'].find(candidate => (
    fs.existsSync(path.join(ICON_DIR, `${skinId}.${candidate}`))
  ))
  return extension ? `/azurlane-tracker/ship-icons/${skinId}.${extension}` : ''
}

const CSV_PATH = path.join(__dirname, '../참고용/벽람 함순이도감 v2.1.8_배포용의 사본 - [ 메인시트.csv')
const OUT_PATH = path.join(__dirname, '../src/data/characters.json')
const OVERRIDES_PATH = path.join(__dirname, '../src/data/characterOverrides.json')
const ALTOY_PATH = path.join(__dirname, '../참고용/ALtoy/data/ship_info_data.json')

const raw = fs.readFileSync(CSV_PATH, 'utf-8')
const existingCharacters = fs.existsSync(OUT_PATH)
  ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'))
  : []
const existingIndexes = buildExistingCharacterIndexes(existingCharacters)
const altoyCharacters = fs.existsSync(ALTOY_PATH)
  ? JSON.parse(fs.readFileSync(ALTOY_PATH, 'utf-8'))
  : []
const altoyByGid = new Map(altoyCharacters.map(character => [String(character.gid), character]))
const altoyNameGroups = new Map()
for (const character of altoyCharacters) {
  const nameKey = normalizeCharacterSourceName(character.name)
  const group = altoyNameGroups.get(nameKey) || []
  group.push(character)
  altoyNameGroups.set(nameKey, group)
}

// 데이터 행: 계산용(col0)이 숫자이고, ID(col1)가 숫자 또는 알파벳+숫자인 행 (M/P/Z 포함)
const dataRows = parseCsvRecords(raw).filter(cols =>
  /^\d+$/.test(String(cols[0] || '').trim())
  && /^[A-Za-z0-9]+$/.test(String(cols[1] || '').trim()))

const characters = dataRows.map(cols => {
  // cols 인덱스 (헤더 기준):
  // 0: 계산용, 1: ID, 2: 사진, 3: 이름, 4: 레어도, 5: 함종, 6: 진영
  // 7: 개장가능, 8: 개장여부, 9: 즐겨찾기
  // 10: 획득/육성여부, 11: 스킬작여부, 12: 호감작여부, 13: 자유코멘트
  // 14: 획득기술점수
  // 15: 입수_적용함종1, 16: 입수_적용함종2, 17: 입수_적용함종3, 18: 입수_능력치, 19: 입수_수치
  // 20: 120_적용함종1, 21: 120_적용함종2, 22: 120_적용함종3, 23: 120_능력치, 24: 120_수치

  const rawId = cols[1].trim()
  const id = /^\d+$/.test(rawId) ? parseInt(rawId) : rawId
  const name = cols[3].trim()
  if (!name) return null
  const existing = selectExistingCharacter(existingIndexes, { id, name })
  const nameMatches = altoyNameGroups.get(normalizeCharacterSourceName(name)) || []
  const altoy = altoyByGid.get(String(existing.gid)) || (nameMatches.length === 1 ? nameMatches[0] : null)

  const base = {
    // Spreadsheet row IDs can be reordered; keep the app's stable identity when the name matches.
    id: existing.id ?? id,
    name,
    rarity: cols[4].trim(),
    shipType: normalizeShipTypeValue(SHIP_TYPE_BY_ID[altoy?.type] || cols[5]),
    faction: normalizeFactionValue(cols[6]),
    canRemodel: cols[7].trim() === 'O',
    skillPoints: parseInt(cols[14]) || 0,
    statAcquired: {
      shipTypes: [cols[15], cols[16], cols[17]].map(s => s.trim()).filter(Boolean),
      stat: normalizeStatName(cols[18]),
      value: parseInt(cols[19]) || 0,
    },
    stat120: {
      shipTypes: [cols[20], cols[21], cols[22]].map(s => s.trim()).filter(Boolean),
      stat: normalizeStatName(cols[23]),
      value: parseInt(cols[24]) || 0,
    },
  }

  return {
    ...existing,
    ...base,
    ...(altoy ? {
      gid: altoy.gid,
      iconUrl: getLocalIconUrl(altoy.skin_id) || existing.iconUrl,
    } : {}),
    techPoints: existing.techPoints || {
      acquired: 0,
      maxLB: 0,
      lv120: 0,
    },
    // Fleet tech detail fields are refreshed separately from CN/KR/sheet sources.
    // Preserve their established app labels and ordering when this roster CSV is regenerated.
    statAcquired: existing.statAcquired || base.statAcquired,
    stat120: existing.stat120 || base.stat120,
  }
}).filter(Boolean)

const overrides = fs.existsSync(OVERRIDES_PATH)
  ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8'))
  : { characters: [] }
const characterIndexById = new Map(characters.map((character, index) => [normalizeCharacterSourceId(character.id), index]))
const additions = []

for (const override of overrides.characters || []) {
  const gidIndex = override.gid == null
    ? -1
    : characters.findIndex(character => String(character.gid) === String(override.gid))
  const index = gidIndex >= 0
    ? gidIndex
    : characterIndexById.get(normalizeCharacterSourceId(override.id))
  if (index === undefined) additions.push(override)
  else characters[index] = { ...characters[index], ...override }
}

if (additions.length > 0) {
  const insertAfterIndex = characters.findIndex(character => normalizeCharacterSourceId(character.id) === normalizeCharacterSourceId(overrides.insertAfterId))
  characters.splice(insertAfterIndex >= 0 ? insertAfterIndex + 1 : characters.length, 0, ...additions)
}

for (const override of overrides.appendCharacters || []) {
  const index = characters.findIndex(character => normalizeCharacterSourceId(character.id) === normalizeCharacterSourceId(override.id))
  if (index === -1) characters.push(override)
  else characters[index] = { ...characters[index], ...override }
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
writeJsonAtomic(OUT_PATH, characters)
console.log(`변환 완료: ${characters.length}명 → ${OUT_PATH}`)

function writeJsonAtomic(destination, value) {
  const temporary = `${destination}.tmp-${process.pid}`
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    fs.renameSync(temporary, destination)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
}
