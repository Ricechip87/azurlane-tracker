import { readFileSync } from 'node:fs'
import characters from '../src/data/characters.json' with { type: 'json' }
import { MAJOR_TECH_FACTIONS, calcMajorFactionTechPoints } from '../src/utils/fleetTech.js'
import { calcTechPoints } from '../src/utils/techPoints.js'
import { normalizeAcquisitionStatus } from '../src/utils/acquisitionStatus.js'
import { normalizeFactionValue } from '../src/utils/factions.js'

const [, , backupPath, ...args] = process.argv

if (!backupPath) {
  console.error('Usage: node scripts/audit-tech-points.mjs <backup.json> [USS=5937 HMS=4332 IJN=5594 KMS=6133]')
  process.exit(1)
}

const expectedByCode = parseExpected(args)
const backup = JSON.parse(readFileSync(backupPath, 'utf-8'))
const userData = backup.userData || backup
const enriched = characters.map(character => ({
  ...character,
  ...(userData[character.id] || userData[String(character.id)] || {}),
}))

const totals = calcMajorFactionTechPoints(enriched)

console.log('획득 기술점수 합계')
for (const faction of MAJOR_TECH_FACTIONS) {
  const actual = totals[faction.value]
  const expected = expectedByCode[faction.code]
  const diff = typeof expected === 'number' ? actual - expected : null
  console.log(`- ${faction.label}: ${actual}${diff === null ? '' : ` / 인게임 ${expected} / 차이 ${formatDiff(diff)}`}`)
}

console.log('\n진영별 상태 기여')
for (const faction of MAJOR_TECH_FACTIONS) {
  const rows = enriched
    .filter(character => normalizeFactionValue(character.faction) === faction.value)
    .map(character => ({
      id: character.id,
      name: character.name,
      status: normalizeAcquisitionStatus(character.acquired),
      points: calcTechPoints(character),
      techPoints: character.techPoints || {},
    }))

  const byStatus = {}
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] || 0) + row.points
  }
  console.log(`- ${faction.label}: ${Object.entries(byStatus).map(([status, points]) => `${status}=${points}`).join(', ')}`)
}

if (Object.keys(expectedByCode).length > 0) {
  console.log('\n차이 후보: 점수 기여가 있는 캐릭터 상위 30명')
  for (const faction of MAJOR_TECH_FACTIONS) {
    const expected = expectedByCode[faction.code]
    if (typeof expected !== 'number' || totals[faction.value] === expected) continue

    console.log(`\n[${faction.label}] 웹 ${totals[faction.value]} / 인게임 ${expected} / 차이 ${formatDiff(totals[faction.value] - expected)}`)
    enriched
      .filter(character => normalizeFactionValue(character.faction) === faction.value)
      .map(character => ({
        id: character.id,
        name: character.name,
        status: normalizeAcquisitionStatus(character.acquired),
        points: calcTechPoints(character),
        techPoints: character.techPoints || {},
      }))
      .filter(row => row.points > 0)
      .sort((a, b) => b.points - a.points || String(a.id).localeCompare(String(b.id)))
      .slice(0, 30)
      .forEach(row => {
        const tp = row.techPoints
        console.log(`  ${row.id}\t${row.name}\t${row.status}\t${row.points}\t획득:${tp.acquired || 0} 풀돌:${tp.maxLB || 0} 120:${tp.lv120 || 0}`)
      })
  }
}

function parseExpected(values) {
  const codeToFaction = new Map(MAJOR_TECH_FACTIONS.map(faction => [faction.code, faction.value]))
  const expected = {}

  for (const value of values) {
    const [rawCode, rawPoints] = value.split('=')
    const code = String(rawCode || '').trim().toUpperCase()
    const points = Number(rawPoints)
    if (!codeToFaction.has(code) || !Number.isFinite(points)) continue
    expected[code] = points
  }

  return expected
}

function formatDiff(value) {
  if (value > 0) return `+${value}`
  return String(value)
}
