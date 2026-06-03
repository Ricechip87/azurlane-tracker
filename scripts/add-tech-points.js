import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TECH_CSV = path.join(__dirname, '../참고용/벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv')
const CHARS_PATH = path.join(__dirname, '../src/data/characters.json')

const STAT_NAMES = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']

const raw = fs.readFileSync(TECH_CSV, 'utf-8')
const lines = raw.split('\n').map(l => l.trimEnd())

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

function parseStat(cols, startIdx) {
  for (let i = 0; i < STAT_NAMES.length; i++) {
    const val = parseInt(cols[startIdx + i])
    if (val > 0) return { stat: STAT_NAMES[i], value: val }
  }
  return { stat: '', value: 0 }
}

// No. -> 기술 데이터 매핑
const techMap = new Map()
for (const line of dataLines) {
  const cols = parseCSVLine(line)
  const id = normalizeId(cols[0])
  if (!id) continue

  const shipTypesAcquired = [cols[9], cols[10], cols[11]].map(s => (s || '').trim()).filter(Boolean)
  const shipTypes120 = [cols[21], cols[22], cols[23]].map(s => (s || '').trim()).filter(Boolean)

  techMap.set(id, {
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
  })
}

const characters = JSON.parse(fs.readFileSync(CHARS_PATH, 'utf-8'))

let matched = 0
const updated = characters.map(c => {
  const tech = techMap.get(normalizeId(c.id))
  if (tech) {
    matched++
    return { ...c, ...tech }
  }
  return c
})

fs.writeFileSync(CHARS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
console.log(`완료: ${matched}/${characters.length}명 기술 데이터 반영, CSV ${techMap.size}행 확인`)
