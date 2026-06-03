import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeFactionValue } from '../src/utils/factions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CSV_PATH = path.join(__dirname, '../참고용/벽람 함순이도감 v2.1.8_배포용의 사본 - [ 메인시트.csv')
const OUT_PATH = path.join(__dirname, '../src/data/characters.json')

const raw = fs.readFileSync(CSV_PATH, 'utf-8')
const lines = raw.split('\n').map(l => l.trimEnd())
const existingCharacters = fs.existsSync(OUT_PATH)
  ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'))
  : []
const existingById = new Map(existingCharacters.map(c => [normalizeId(c.id), c]))

// 데이터 행: 계산용(col0)이 숫자이고, ID(col1)가 숫자 또는 알파벳+숫자인 행 (M/P/Z 포함)
const dataLines = lines.filter(line => /^\d+,[A-Za-z0-9]+,/.test(line))

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

function normalizeId(rawId) {
  const id = String(rawId || '').trim()
  return /^\d+$/.test(id) ? String(parseInt(id)) : id
}

const characters = dataLines.map(line => {
  const cols = parseCSVLine(line)
  // cols 인덱스 (헤더 기준):
  // 0: 계산용, 1: ID, 2: 사진, 3: 이름, 4: 레어도, 5: 함종, 6: 진영
  // 7: 개장가능, 8: 개장여부, 9: 즐겨찾기
  // 10: 획득/육성여부, 11: 스킬작여부, 12: 호감작여부, 13: 자유코멘트
  // 14: 획득기술점수
  // 15: 입수_적용함종1, 16: 입수_적용함종2, 17: 입수_적용함종3, 18: 입수_능력치, 19: 입수_수치
  // 20: 120_적용함종1, 21: 120_적용함종2, 22: 120_적용함종3, 23: 120_능력치, 24: 120_수치

  const rawId = cols[1].trim()
  const id = /^\d+$/.test(rawId) ? parseInt(rawId) : rawId
  const existing = existingById.get(normalizeId(id)) || {}
  const name = cols[3].trim()
  if (!name) return null

  const base = {
    id,
    name,
    rarity: cols[4].trim(),
    shipType: cols[5].trim(),
    faction: normalizeFactionValue(cols[6]),
    canRemodel: cols[7].trim() === 'O',
    skillPoints: parseInt(cols[14]) || 0,
    statAcquired: {
      shipTypes: [cols[15], cols[16], cols[17]].map(s => s.trim()).filter(Boolean),
      stat: cols[18].trim(),
      value: parseInt(cols[19]) || 0,
    },
    stat120: {
      shipTypes: [cols[20], cols[21], cols[22]].map(s => s.trim()).filter(Boolean),
      stat: cols[23].trim(),
      value: parseInt(cols[24]) || 0,
    },
  }

  return { ...existing, ...base }
}).filter(Boolean)

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(characters, null, 2), 'utf-8')
console.log(`변환 완료: ${characters.length}명 → ${OUT_PATH}`)
