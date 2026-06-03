import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TECH_CSV = path.join(__dirname, '../../벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv')
const CHARS_PATH = path.join(__dirname, '../src/data/characters.json')

const STAT_NAMES = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']

const raw = fs.readFileSync(TECH_CSV, 'utf-8')
const lines = raw.split('\n').map(l => l.trimEnd())

// No.가 숫자인 데이터 행만 추출
const dataLines = lines.filter(l => /^\d{3,}/.test(l))

function parseStat(cols, startIdx) {
  for (let i = 0; i < STAT_NAMES.length; i++) {
    const val = parseInt(cols[startIdx + i])
    if (val > 0) return { stat: STAT_NAMES[i], value: val }
  }
  return { stat: '', value: 0 }
}

// No. → 기술 데이터 매핑
const techMap = {}
for (const line of dataLines) {
  const cols = line.split(',')
  const id = parseInt(cols[0])
  if (!id) continue

  const shipTypes입수 = [cols[9], cols[10], cols[11]].map(s => (s || '').trim()).filter(Boolean)
  const shipTypes120 = [cols[21], cols[22], cols[23]].map(s => (s || '').trim()).filter(Boolean)

  techMap[id] = {
    techPoints: {
      acquired: parseInt(cols[5]) || 0,
      maxLB: parseInt(cols[6]) || 0,
      lv120: parseInt(cols[7]) || 0,
    },
    statAcquired: {
      shipTypes: shipTypes입수,
      ...parseStat(cols, 12),
    },
    stat120: {
      shipTypes: shipTypes120,
      ...parseStat(cols, 24),
    },
  }
}

const characters = JSON.parse(fs.readFileSync(CHARS_PATH, 'utf-8'))

let matched = 0
const updated = characters.map(c => {
  const tech = techMap[c.id]
  if (tech) {
    matched++
    return { ...c, ...tech }
  }
  // 기술 데이터 없는 캐릭터 (부린 등) - 기존 값 초기화
  return {
    ...c,
    techPoints: { acquired: 0, maxLB: 0, lv120: 0 },
    statAcquired: { shipTypes: [], stat: '', value: 0 },
    stat120: { shipTypes: [], stat: '', value: 0 },
  }
})

fs.writeFileSync(CHARS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
console.log(`완료: ${matched}/${characters.length}명 기술 데이터 반영`)
