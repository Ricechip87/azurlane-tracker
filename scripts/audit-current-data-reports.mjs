import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildFactionAudit,
  buildFactionAuditMarkdown,
  buildObtainabilityAudit,
  buildObtainabilityAuditMarkdown,
  formatKstTimestamp,
} from './lib/current-data-audit-reports.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = process.env.AUDIT_SOURCE_ROOT
  ? path.resolve(process.env.AUDIT_SOURCE_ROOT)
  : path.join(root, '참고용')
const paths = {
  characters: path.join(root, 'src/data/characters.json'),
  obtainability: path.join(root, 'src/data/shipObtainability.json'),
  growth: path.join(root, 'src/data/growthRecommendations.json'),
  research: path.join(root, 'src/data/researchRecommendations.json'),
  altoy: process.env.ALTOY_DATA_PATH
    ? path.resolve(process.env.ALTOY_DATA_PATH)
    : path.join(sourceRoot, 'ALtoy/data/ship_info_data.json'),
  cnStatistics: process.env.CN_STATISTICS_PATH
    ? path.resolve(process.env.CN_STATISTICS_PATH)
    : path.join(sourceRoot, 'AzurLaneData/CN/sharecfgdata/ship_data_statistics.json'),
}

const characters = readJson(paths.characters)
const obtainability = readJson(paths.obtainability)
const growth = readJson(paths.growth)
const research = readJson(paths.research)
const altoyShips = readJson(paths.altoy)
const cnStatistics = readJson(paths.cnStatistics)

const obtainabilityAudit = buildObtainabilityAudit(obtainability)
const factionAudit = buildFactionAudit({
  generatedAt: formatKstTimestamp(obtainability.meta.generatedAt),
  characters,
  altoyShips,
  cnStatistics,
  derivedDatasets: {
    growthRecommendations: growth.recommendations,
    shipObtainability: obtainability.ships,
    researchRecommendations: research.ships,
  },
  researchShips: research.ships,
})

writeTextAtomic(
  path.join(root, 'reports/data-sources/obtainability-audit.md'),
  buildObtainabilityAuditMarkdown(obtainabilityAudit),
)
writeTextAtomic(
  path.join(root, 'reports/data-sources/union-audit.md'),
  buildFactionAuditMarkdown(factionAudit),
)

const derivedIssueCount = Object.values(factionAudit.derived).reduce((sum, value) => (
  sum + value.missingCount + value.mismatchCount
), 0)
const factionIssueCount = factionAudit.missingSources.length + factionAudit.sourceMismatches.length

console.log(`입수 상태 보고서: ${obtainabilityAudit.total}척 / 메타데이터 불일치 ${obtainabilityAudit.metadataMismatches.length}건`)
console.log(`진영 보고서: 이글 유니온 ${factionAudit.factions.유니온.appCount}척 / 노스 유니온 ${factionAudit.factions.노스유니온.appCount}척`)
console.log(`진영 원천 문제 ${factionIssueCount}건 / 파생 데이터 문제 ${derivedIssueCount}건`)

if (obtainabilityAudit.metadataMismatches.length || factionIssueCount || derivedIssueCount) {
  process.exitCode = 1
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeTextAtomic(destination, contents) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  const temporary = `${destination}.tmp-${process.pid}`
  try {
    fs.writeFileSync(temporary, contents, 'utf8')
    fs.renameSync(temporary, destination)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
}
