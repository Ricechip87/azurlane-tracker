import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildFactionTechLevels,
  officialRecordToCharacterTech,
  parseFleetTechLua,
  parseFleetTechSheet,
  selectFleetTechSheetRecord,
} from './lib/fleet-tech-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = process.env.AUDIT_SOURCE_ROOT
  ? path.resolve(process.env.AUDIT_SOURCE_ROOT)
  : path.join(root, '참고용')
const regions = ['CN', 'EN', 'JP', 'KR', 'TW']
const sheetPath = path.join(sourceRoot, '벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv')
const cnLuaPath = process.env.CN_TECH_LUA_PATH
  ? path.resolve(process.env.CN_TECH_LUA_PATH)
  : path.join(sourceRoot, 'AzurLaneLuaScripts/CN/sharecfg/fleet_tech_ship_template.lua')
const appCharactersPath = path.join(root, 'src/data/characters.json')
const appLevelsPath = path.join(root, 'src/data/fleetTechLevelBonuses.json')
const nameAliases = { 잉그러햄: '잉그레이엄' }

const characters = readJson(appCharactersPath)
const appLevels = readJson(appLevelsPath)
const cnLua = parseFleetTechLua(fs.readFileSync(cnLuaPath, 'utf8'))
const sheet = parseFleetTechSheet(fs.readFileSync(sheetPath, 'utf8'), { nameAliases })
const regional = Object.fromEntries(regions.map(region => {
  const shareCfg = path.join(sourceRoot, `AzurLaneData/${region}/ShareCfg`)
  return [region, {
    ships: parseFleetTechLua(fs.readFileSync(
      path.join(sourceRoot, `AzurLaneLuaScripts/${region}/sharecfg/fleet_tech_ship_template.lua`),
      'utf8',
    )),
    levels: buildFactionTechLevels(
      readJson(path.join(shareCfg, 'fleet_tech_group.json')),
      readJson(path.join(shareCfg, 'fleet_tech_template.json')),
    ),
  }]
}))

const shipMismatches = []
const shipsWithoutSource = []
const shipsWithoutTechData = []
const sourceCounts = { 'cn-lua': 0, 'kr-lua': 0, 'jp-sheet': 0 }

for (const ship of characters) {
  const gid = String(ship.gid)
  const cnRecord = cnLua[gid]
  const krRecord = regional.KR.ships[gid]
  const sheetRecord = selectFleetTechSheetRecord(sheet, ship)
  let expected
  let source

  if (cnRecord) {
    expected = officialRecordToCharacterTech(cnRecord, ship)
    source = 'cn-lua'
  } else if (krRecord) {
    expected = officialRecordToCharacterTech(krRecord, ship)
    source = 'kr-lua'
  } else if (sheetRecord) {
    expected = pickShipTech(sheetRecord)
    source = 'jp-sheet'
  } else {
    const summary = { id: ship.id, gid: ship.gid, name: ship.name }
    if (hasTechData(ship)) shipsWithoutSource.push(summary)
    else shipsWithoutTechData.push(summary)
    continue
  }

  sourceCounts[source]++
  const actual = pickShipTech(ship)
  if (stable(actual) !== stable(expected)) {
    shipMismatches.push({ id: ship.id, gid: ship.gid, name: ship.name, source, expected, actual })
  }
}

const levelMismatches = regions.flatMap(region => (
  stable(regional[region].levels) === stable(appLevels)
    ? []
    : [{ region, expected: regional[region].levels, actual: appLevels }]
))

const regionalShipMismatches = Object.fromEntries(regions.map(region => [region, compareOfficialShipRecords(cnLua, regional[region].ships)]))
const report = {
  generatedAt: `${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })} KST`,
  policy: {
    displayedRoster: 'KR/ALtoy 교차 검증 범위',
    shipTechPriority: ['CN Lua', 'KR Lua', 'JP 기술점수 시트'],
    factionLevelAssumption: '보유 기술점수가 임계치에 도달하면 해당 레벨 연구도 완료한 것으로 간주',
    sourceMode: process.env.AUDIT_SOURCE_ROOT ? 'explicit-reference-root' : 'latest-synced-reference',
  },
  sources: {
    cnLua: relative(cnLuaPath),
    jpSheet: relative(sheetPath),
    regionalLua: regions.map(region => process.env.AUDIT_SOURCE_ROOT
      ? `live/AzurLaneLuaScripts/${region}/sharecfg/fleet_tech_ship_template.lua`
      : `참고용/AzurLaneLuaScripts/${region}/sharecfg/fleet_tech_ship_template.lua`),
  },
  ships: {
    appCount: characters.length,
    cnOfficialCount: Object.keys(cnLua).length,
    sourceCounts,
    mismatchCount: shipMismatches.length,
    mismatches: shipMismatches,
    withoutSourceCount: shipsWithoutSource.length,
    withoutSource: shipsWithoutSource,
    officialNonTechCount: shipsWithoutTechData.length,
    regionalVsCnMismatchCounts: Object.fromEntries(regions.map(region => [region, regionalShipMismatches[region].length])),
    regionalVsCnMismatches: regionalShipMismatches,
  },
  factionLevels: {
    appFactionCount: Object.keys(appLevels).length,
    levelsPerFaction: Object.fromEntries(Object.entries(appLevels).map(([code, levels]) => [code, levels.length])),
    mismatchCount: levelMismatches.length,
    mismatches: levelMismatches,
  },
}

const outputDir = path.join(root, 'reports/fleet-tech')
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(path.join(outputDir, 'audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(outputDir, 'audit.md'), buildMarkdown(report), 'utf8')

console.log(`함선 기술 데이터: ${characters.length}척, 불일치 ${shipMismatches.length}척, 원천 없음 ${shipsWithoutSource.length}척`)
console.log(`공식 함대기술 비대상(0/0/0): ${shipsWithoutTechData.length}척`)
console.log(`진영 레벨 데이터: ${regions.length}개 서버 비교, 불일치 ${levelMismatches.length}개 서버`)
console.log(`지역별 함선 기술 데이터 CN 불일치: ${Object.entries(report.ships.regionalVsCnMismatchCounts).map(([region, count]) => `${region} ${count}`).join(', ')}`)

if (shipMismatches.length || shipsWithoutSource.length || levelMismatches.length
  || Object.values(regionalShipMismatches).some(items => items.length)) {
  process.exitCode = 1
}

function compareOfficialShipRecords(cnRecords, regionalRecords) {
  const fields = [
    'pt_get', 'pt_upgrage', 'pt_level',
    'add_get_shiptype', 'add_get_attr', 'add_get_value',
    'add_level_shiptype', 'add_level_attr', 'add_level_value',
  ]
  return Object.keys(regionalRecords).flatMap(gid => {
    if (!cnRecords[gid]) return []
    const cn = pick(cnRecords[gid], fields)
    const local = pick(regionalRecords[gid], fields)
    return stable(cn) === stable(local) ? [] : [{ gid: Number(gid), cn, regional: local }]
  })
}

function pickShipTech(record) {
  return {
    techPoints: record.techPoints,
    statAcquired: record.statAcquired,
    stat120: record.stat120,
  }
}

function hasTechData(record) {
  const points = record.techPoints || {}
  const acquired = record.statAcquired || {}
  const level120 = record.stat120 || {}
  return Boolean(points.acquired || points.maxLB || points.lv120 || acquired.value || level120.value)
}

function pick(record, fields) {
  return Object.fromEntries(fields.map(field => [field, record[field]]))
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function relative(file) {
  if (process.env.AUDIT_SOURCE_ROOT) {
    return `live/${path.relative(sourceRoot, file).replaceAll('\\', '/')}`
  }
  return path.relative(root, file).replaceAll('\\', '/')
}

function buildMarkdown(value) {
  const regionalCounts = Object.entries(value.ships.regionalVsCnMismatchCounts)
    .map(([region, count]) => `- ${region}: ${count}건`)
    .join('\n')
  return `# 함대 기술 데이터 교차 검증\n\n` +
    `- 생성 시각: ${value.generatedAt}\n` +
    `- 앱 함선: ${value.ships.appCount}척\n` +
    `- 함선별 기술점수/스탯 불일치: ${value.ships.mismatchCount}건\n` +
    `- 원천을 찾지 못한 앱 함선: ${value.ships.withoutSourceCount}건\n` +
    `- 공식 함대기술 비대상(0/0/0): ${value.ships.officialNonTechCount}척\n` +
    `- 진영 레벨 임계치/효과 불일치: ${value.factionLevels.mismatchCount}개 서버\n\n` +
    `## 지역별 함선 데이터와 CN 비교\n\n${regionalCounts}\n\n` +
    `## 적용 규칙\n\n` +
    `- 함선 기술 데이터 우선순위: ${value.policy.shipTechPriority.join(' → ')}\n` +
    `- 진영 레벨: ${value.policy.factionLevelAssumption}\n`
}
