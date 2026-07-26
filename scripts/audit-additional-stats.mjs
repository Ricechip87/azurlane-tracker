import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ADDITIONAL_STATS,
  ADDITIONAL_STAT_SHIP_TYPES,
  buildAdditionalStatCandidates,
  getAdditionalStatPriorities,
  getAvailableAdditionalShipTypes,
} from '../src/utils/additionalStatRecommendations.js'
import { normalizeStatShipTypeValue } from '../src/utils/shipClassifications.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const characters = JSON.parse(fs.readFileSync(path.join(root, 'src/data/characters.json'), 'utf8'))
const ignoredShipTypes = new Set(['공작', '운송', '범선'])
const configuredShipTypes = new Set(ADDITIONAL_STAT_SHIP_TYPES)
const configuredStats = new Set(ADDITIONAL_STATS)
const actualStatsByType = new Map()
const sourceCountsByType = new Map()
const invalidBonuses = []

for (const character of characters) {
  for (const phase of ['statAcquired', 'stat120']) {
    const bonus = character[phase]
    if (!bonus?.stat && !bonus?.value) continue
    if (!bonus?.stat || Number(bonus.value || 0) <= 0 || !bonus.shipTypes?.length) {
      invalidBonuses.push({ id: character.id, name: character.name, phase, bonus })
      continue
    }
    for (const rawShipType of new Set(bonus.shipTypes)) {
      const shipType = normalizeStatShipTypeValue(rawShipType)
      if (!actualStatsByType.has(shipType)) actualStatsByType.set(shipType, new Set())
      actualStatsByType.get(shipType).add(bonus.stat)
      if (!sourceCountsByType.has(shipType)) sourceCountsByType.set(shipType, { statAcquired: 0, stat120: 0 })
      sourceCountsByType.get(shipType)[phase]++
    }
  }
}

const matrix = Object.fromEntries(ADDITIONAL_STAT_SHIP_TYPES.map(shipType => {
  const priorities = getAdditionalStatPriorities(shipType)
  const actualStats = [...(actualStatsByType.get(shipType) || [])]
  return [shipType, {
    priorities,
    actualStats: actualStats.sort((a, b) => a.localeCompare(b, 'ko')),
    configuredWithoutCurrentSource: priorities.filter(stat => !actualStats.includes(stat)),
    sourceCounts: sourceCountsByType.get(shipType) || { statAcquired: 0, stat120: 0 },
    candidateCounts: Object.fromEntries(actualStats.map(stat => [
      stat,
      buildAdditionalStatCandidates(characters, shipType, stat).length,
    ])),
  }]
}))

const sourceOnlyShipTypes = [...actualStatsByType.keys()]
  .filter(shipType => !configuredShipTypes.has(shipType) && !ignoredShipTypes.has(shipType))
  .sort((a, b) => a.localeCompare(b, 'ko'))
const priorityStats = new Set(Object.values(matrix).flatMap(item => item.priorities))
const unlistedPriorityStats = [...priorityStats].filter(stat => !configuredStats.has(stat))
const unusedConfiguredStats = ADDITIONAL_STATS.filter(stat => !priorityStats.has(stat))
const statShipTypeMatrix = Object.fromEntries(ADDITIONAL_STATS.map(stat => [
  stat,
  getAvailableAdditionalShipTypes(stat),
]))
const broadCoverage = {
  모니터중순대형순공용: countBroadCoverage('모니터', '중순', '대형순'),
  경항모항모공용: countBroadCoverage('경항모', '항모'),
}
const report = {
  generatedAt: `${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })} KST`,
  policy: {
    configuredShipTypes: ADDITIONAL_STAT_SHIP_TYPES,
    configuredStats: ADDITIONAL_STATS,
    ignoredShipTypes: [...ignoredShipTypes],
    ranking: ['공용 적용', '보유 여부', '남은 단계', '입수 난이도', '대작전 등급', '증가량', '희귀도', '이름'],
  },
  matrix,
  broadCoverage,
  invalidBonusCount: invalidBonuses.length,
  invalidBonuses,
  unexpectedSourceShipTypes: sourceOnlyShipTypes,
  unlistedPriorityStats,
  unusedConfiguredStats,
  statShipTypeMatrix,
}

const outputDir = path.join(root, 'reports/additional-stats')
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(path.join(outputDir, 'audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(outputDir, 'audit.md'), buildMarkdown(report), 'utf8')

console.log(`추가 스탯 추천 함종: ${ADDITIONAL_STAT_SHIP_TYPES.length}종 / 제외 ${[...ignoredShipTypes].join(', ')}`)
console.log(`잘못된 보너스: ${invalidBonuses.length}건 / 미분류 원천 함종: ${sourceOnlyShipTypes.length}종`)
console.log(`스탯-함종 매핑 누락: 우선순위 미노출 ${unlistedPriorityStats.length}건 / 미사용 노출 스탯 ${unusedConfiguredStats.length}건`)
console.log(`공용 적용 원천: 모니터+중순+대형순 ${broadCoverage.모니터중순대형순공용}건, 경항모+항모 ${broadCoverage.경항모항모공용}건`)

if (
  invalidBonuses.length
  || sourceOnlyShipTypes.length
  || unlistedPriorityStats.length
  || unusedConfiguredStats.length
) process.exitCode = 1

function countBroadCoverage(...requiredShipTypes) {
  return characters.reduce((count, character) => count + ['statAcquired', 'stat120'].filter(phase => {
    const targets = new Set((character[phase]?.shipTypes || []).map(normalizeStatShipTypeValue))
    return requiredShipTypes.every(shipType => targets.has(shipType))
  }).length, 0)
}

function buildMarkdown(value) {
  const rows = Object.entries(value.matrix).map(([shipType, data]) => (
    `| ${shipType} | ${data.priorities.join(' > ')} | ${data.actualStats.join(', ')} | ${data.configuredWithoutCurrentSource.join(', ') || '-'} |`
  )).join('\n')
  const statRows = Object.entries(value.statShipTypeMatrix).map(([stat, shipTypes]) => (
    `| ${stat} | ${shipTypes.join(', ')} |`
  )).join('\n')
  return `# 추가 스탯작 추천 데이터 감사\n\n` +
    `- 생성 시각: ${value.generatedAt}\n` +
    `- 추천 함종: ${value.policy.configuredShipTypes.length}종\n` +
    `- 노출 스탯: ${value.policy.configuredStats.join(', ')}\n` +
    `- 제외 함종: ${value.policy.ignoredShipTypes.join(', ')}\n` +
    `- 잘못된 보너스: ${value.invalidBonusCount}건\n` +
    `- 미분류 원천 함종: ${value.unexpectedSourceShipTypes.length}종\n` +
    `- 우선순위 미노출 스탯: ${value.unlistedPriorityStats.length}건\n` +
    `- 미사용 노출 스탯: ${value.unusedConfiguredStats.length}건\n` +
    `- 모니터·중순·대형순 공용 원천: ${value.broadCoverage.모니터중순대형순공용}건\n` +
    `- 경항모·항모 공용 원천: ${value.broadCoverage.경항모항모공용}건\n\n` +
    `| 함종 | 지정 우선순위 | 현재 원천 스탯 | 지정했지만 현재 원천 없음 |\n` +
    `|---|---|---|---|\n${rows}\n\n` +
    `## 스탯별 선택 가능 함종\n\n` +
    `| 스탯 | 함종 |\n|---|---|\n${statRows}\n`
}
