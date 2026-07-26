import fs from 'node:fs'
import characters from '../src/data/characters.json' with { type: 'json' }
import { isAcquiredStatus, isLevel120Status } from '../src/utils/acquisitionStatus.js'
import { MAJOR_TECH_FACTIONS, calcMajorFactionTechPoints } from '../src/utils/fleetTech.js'
import { calcFleetTechLevelStats } from '../src/utils/fleetTechLevelStats.js'
import { normalizeStatShipTypeValue } from '../src/utils/shipClassifications.js'
import { normalizeStatName } from '../src/utils/statLabels.js'

const USER_DATA_PATH = process.argv[2] || '참고용/검산용.json'

const STAT_NAMES = ['내구', '화력', '뇌격', '대공', '항공', '장전', '명중', '회피', '대잠']
const IN_GAME = {
  구축: { 내구: 243, 화력: 50, 뇌격: 31, 대공: 15, 장전: 9, 명중: 3, 회피: 30, 대잠: 14 },
  경순: { 내구: 93, 화력: 62, 뇌격: 33, 대공: 28, 장전: 21, 명중: 19, 회피: 5, 대잠: 12 },
  중순: { 내구: 123, 화력: 54, 뇌격: 38, 대공: 5, 장전: 15, 명중: 5, 회피: 4 },
  순전: { 내구: 231, 화력: 99, 대공: 20, 장전: 17, 명중: 29, 회피: 17 },
  전함: { 내구: 231, 화력: 94, 대공: 20, 장전: 17, 명중: 29, 회피: 1 },
  경항모: { 내구: 87, 대공: 4, 항공: 78, 장전: 35, 명중: 14, 대잠: 48 },
  항모: { 내구: 83, 대공: 4, 항공: 65, 장전: 35, 명중: 14, 대잠: 4 },
  잠수: { 내구: 65, 화력: 2, 뇌격: 26, 명중: 25, 회피: 31 },
  항전: { 내구: 221, 화력: 94, 대공: 17, 항공: 9, 장전: 17, 명중: 26, 회피: 1 },
  공작: { 내구: 48, 대공: 15 },
  모니터: { 내구: 111, 화력: 57, 뇌격: 15, 대공: 5, 장전: 15, 명중: 10, 회피: 4 },
  잠항모: { 내구: 65, 화력: 2, 뇌격: 26, 항공: 9, 명중: 25, 회피: 31 },
  대형순: { 내구: 111, 화력: 60, 뇌격: 25, 대공: 5, 장전: 18, 명중: 4, 회피: 4 },
  운송: { 내구: 47, 대공: 15 },
  범선: { 내구: 8, 화력: 10, 명중: 2 },
}

const backup = JSON.parse(fs.readFileSync(USER_DATA_PATH, 'utf8'))
const userData = backup.userData || backup
const enriched = characters.map(character => ({
  ...character,
  ...(userData[character.id] || {}),
}))
const csvStats = {}
const contributors = {}

for (const character of enriched) {
  if (isAcquiredStatus(character.acquired)) {
    for (const shipType of normalizeTargetSet(character.statAcquired?.shipTypes || [])) {
      addStat(csvStats, contributors, shipType, character.statAcquired, `${character.id} ${character.name} 획득`)
    }
  }

  if (isLevel120Status(character.acquired)) {
    for (const shipType of normalizeTargetSet(character.stat120?.shipTypes || [])) {
      addStat(csvStats, contributors, shipType, character.stat120, `${character.id} ${character.name} 120`)
    }
  }
}

const levelStats = calcFleetTechLevelStats(calcMajorFactionTechPoints(enriched))
const levelStatContributors = calcFleetTechLevelContributors(calcMajorFactionTechPoints(enriched))

for (const [shipType, expectedStats] of Object.entries(IN_GAME)) {
  const mismatches = []
  for (const stat of STAT_NAMES) {
    const csv = csvStats[shipType]?.[stat] || 0
    const level = levelStats[shipType]?.[stat] || 0
    const total = csv + level
    const expected = expectedStats[stat] || 0
    if (total !== expected) {
      mismatches.push({ stat, csv, level, total, expected, diff: total - expected })
    }
  }

  if (!mismatches.length) {
    console.log(`${shipType}: OK`)
    continue
  }

  console.log(`\n${shipType}: DIFF`)
  for (const mismatch of mismatches) {
    console.log(`  ${mismatch.stat}: CSV ${mismatch.csv}, LV ${mismatch.level}, 합계 ${mismatch.total}, 인게임 ${mismatch.expected}, 차이 ${formatDiff(mismatch.diff)}`)
    const list = contributors[shipType]?.[mismatch.stat] || []
    if (list.length) console.log(`    기여: ${list.join(' | ')}`)
    const levelList = levelStatContributors[shipType]?.[mismatch.stat] || []
    if (levelList.length) console.log(`    레벨 보너스: ${levelList.join(' | ')}`)
  }
}

function addStat(target, sourceLog, shipType, statData, label) {
  if (!shipType || !statData.stat || !statData.value) return
  const stat = normalizeStatName(statData.stat)
  if (!target[shipType]) target[shipType] = {}
  target[shipType][stat] = (target[shipType][stat] || 0) + statData.value

  if (!sourceLog[shipType]) sourceLog[shipType] = {}
  if (!sourceLog[shipType][stat]) sourceLog[shipType][stat] = []
  sourceLog[shipType][stat].push(`${label} +${statData.value}`)
}

function normalizeTargetSet(shipTypes) {
  return new Set(shipTypes.map(normalizeStatShipTypeValue).filter(Boolean))
}

function formatDiff(value) {
  return value > 0 ? `+${value}` : String(value)
}

function calcFleetTechLevelContributors(majorFactionTechPoints) {
  const result = {}
  const bonuses = getFleetTechLevelBonuses()

  for (const faction of MAJOR_TECH_FACTIONS) {
    const levels = bonuses[faction.code] || []
    const points = majorFactionTechPoints[faction.value] || 0
    const currentLevel = levels.reduce((current, level) => (
      points >= level.pt && (!current || level.level > current.level) ? level : current
    ), null)

    const appliedBonuses = new Set()
    for (const bonus of currentLevel?.bonuses || []) {
      const shipType = normalizeStatShipTypeValue(bonus.shipType)
      const stat = normalizeStatName(bonus.stat)
      const bonusKey = `${shipType}:${stat}`
      if (appliedBonuses.has(bonusKey)) continue
      appliedBonuses.add(bonusKey)
      if (!result[shipType]) result[shipType] = {}
      if (!result[shipType][stat]) result[shipType][stat] = []
      result[shipType][stat].push(`${faction.label} Lv.${currentLevel.level} +${bonus.value}`)
    }
  }

  return result
}

function getFleetTechLevelBonuses() {
  return JSON.parse(fs.readFileSync('src/data/fleetTechLevelBonuses.json', 'utf8'))
}
