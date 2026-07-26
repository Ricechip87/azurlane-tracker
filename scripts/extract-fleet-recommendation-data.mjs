import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildEquipmentDirectStats,
  buildShipCombatData,
  buildStageRequirements,
} from './lib/fleet-recommendation-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const referenceRoot = path.join(root, '참고용')
const dataRoot = path.join(root, 'src', 'data')

const characters = readJson(path.join(dataRoot, 'characters.json'))
const altoyShips = readJson(path.join(referenceRoot, 'ALtoy', 'data', 'ship_info_data.json'))
const equipmentStatistics = readJson(path.join(
  referenceRoot,
  'AzurLaneData',
  'KR',
  'sharecfgdata',
  'equip_data_statistics.json',
))
const spWeaponStatistics = readJson(path.join(
  referenceRoot,
  'AzurLaneData',
  'KR',
  'sharecfgdata',
  'spweapon_data_statistics.json',
))
const chapters = readJson(path.join(
  referenceRoot,
  'AzurLaneData',
  'KR',
  'sharecfgdata',
  'chapter_template.json',
))

const combat = buildShipCombatData(characters, altoyShips, spWeaponStatistics)
if (combat.missing.length) {
  throw new Error(`편성 추천 함선 원천 누락: ${combat.missing.map(item => `${item.name}(${item.gid})`).join(', ')}`)
}

writeJson('shipCombatData.json', {
  meta: {
    source: 'ALtoy ship_info_data.json',
    formula: 'floor((base + growth * (level - 1) / 1000 + enhance + retrofit) * affinity) + direct equipment stats',
    shipCount: Object.keys(combat.ships).length,
  },
  ships: combat.ships,
})
writeJson('equipmentDirectStats.json', {
  meta: {
    source: 'AzurLaneData KR equip_data_statistics.json',
    enhancement: 10,
    policy: '직접 능력치만 포함. 확률·조건부·공격·회복·보호막 효과 제외.',
    availability: '첫 버전은 장비 수량 및 복각 상태를 자동 판정하지 않음.',
  },
  equipment: buildEquipmentDirectStats(equipmentStatistics),
})
writeJson('stageRequirements.json', {
  meta: {
    source: 'AzurLaneData KR chapter_template.json',
    safetyMargin: 0.1,
    policy: '원천의 수치 요구와 추천 휴리스틱을 구분해 표시.',
  },
  stages: buildStageRequirements(chapters),
})

console.log(`편성 추천 데이터 생성 완료: 함선 ${Object.keys(combat.ships).length}척`)

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(dataRoot, name), `${JSON.stringify(value, null, 2)}\n`)
}
