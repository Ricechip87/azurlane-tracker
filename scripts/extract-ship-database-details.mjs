import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const altoyShips = readJson('참고용/ALtoy/data/ship_info_data.json')
const altoySkillPath = '참고용/ALtoy/data/sim/skill_data_template.json'
const skillTemplates = readJson(
  fs.existsSync(path.join(root, altoySkillPath))
    ? altoySkillPath
    : '참고용/AzurLaneData/KR/ShareCfg/skill_data_template.json',
)
const nameCodes = readJson('참고용/AzurLaneData/KR/ShareCfg/name_code.json')
const metaStrengthen = readJson('참고용/AzurLaneData/KR/ShareCfg/ship_strengthen_meta.json')
const outputPath = path.join(root, 'src/data/shipDatabaseDetails.json')
const KNOWN_EMPTY_SKILL_REFERENCES = new Set([
  6550, // 리슐리외 한계돌파 내부 트리거
  800160, // 후소(META) 인게임 검증 스킬은 아래 override로 보완
  802100, // 강구트(META)의 표시되지 않는 내부 참조
])
const VERIFIED_SKILL_OVERRIDES = {
  970501: [
    {
      name: '청산·후소',
      effect: '전투 개시 시, 자신의 대공이 5.0%/15.0%, 장전이 1.0%/10.0% 상승한다. 「잿더미의 저주」 상태가 해제된 적은 특수 연소 피해를 1회 추가로 받는다(위력은 자신의 포격에 비례). 아군이 「잿더미의 저주」 상태인 적을 격파할 때마다 전투 종료 시까지 자신의 포격이 4% 상승한다(최대 3회 중첩). 3회 중첩 시 전투 종료까지 자신이 주는 피해가 5% 상승한다.',
      retrofit: false,
    },
  ],
}
const VISIBLE_STAT_KEYS = new Set([
  'health',
  'firepower',
  'torpedo',
  'antiair',
  'aviation',
  'reload',
  'accuracy',
  'evasion',
  'speed',
  'luck',
  'asw',
])
const SHIP_TYPE_BY_ID = {
  1: '구축',
  2: '경순',
  3: '중순',
  4: '순전',
  5: '전함',
  6: '경항모',
  7: '항모',
  8: '잠수',
  10: '항전',
  12: '공작',
  13: '모니터',
  17: '잠항모',
  18: '대형순',
  19: '운송',
  20: '구축',
  21: '구축',
  22: '범선',
  23: '범선',
  24: '범선',
}

const ships = Object.fromEntries(altoyShips.map(ship => {
  const skillData = extractSkills(ship)
  return [
    String(ship.gid),
    {
    id: ship.id,
    sid: ship.sid,
    className: ship.class_name || '',
    armor: ship.armor || 0,
    skills: skillData.skills,
    missingSkillCount: skillData.missingSkillCount,
    retrofit: extractRetrofit(ship),
    },
  ]
}))

fs.writeFileSync(outputPath, `${JSON.stringify({
  meta: {
    shipCount: altoyShips.length,
    sources: [
      'ALtoy ship_info_data.json',
      fs.existsSync(path.join(root, altoySkillPath))
        ? 'ALtoy skill_data_template.json'
        : 'AzurLaneData KR skill_data_template.json',
      'AzurLaneData KR name_code.json',
      'AzurLaneData KR ship_strengthen_meta.json',
      'KR in-game verified skill overrides',
    ],
    equipmentExcluded: true,
    giftDataExcluded: true,
  },
  ships,
}, null, 2)}\n`)

console.log(`ship database details written: ${Object.keys(ships).length} ships`)

function extractSkills(ship) {
  const metaSkillIds = metaStrengthen[String(ship.gid)]?.buff_list_task
  const entries = Array.isArray(metaSkillIds)
    ? metaSkillIds.map(id => ship.skill?.[String(id)] || { id })
    : getFinalSkillEntries(ship.skill)
  const retrofitSkillId = Number(ship.retrofit?.skill_id || 0)
  if (retrofitSkillId && !entries.some(entry => (
    Number(entry.id) === retrofitSkillId
    || Number(entry.parent) === retrofitSkillId
  ))) {
    entries.push({ id: retrofitSkillId, requirement: 'Retrofit' })
  }

  let missingSkillCount = 0
  const skills = entries
    .map(entry => {
      const template = skillTemplates[String(entry.id)]
      if (!template?.name || !template?.desc) {
        if (!KNOWN_EMPTY_SKILL_REFERENCES.has(Number(entry.id))) missingSkillCount += 1
        return null
      }
      return {
        name: resolveNameCodes(template.name).trim(),
        effect: resolveSkillDescription(template),
        retrofit: entry.requirement === 'Retrofit' || Number(entry.id) === retrofitSkillId,
      }
    })
    .filter(Boolean)
    .concat(VERIFIED_SKILL_OVERRIDES[ship.gid] || [])
  return { skills, missingSkillCount }
}

function getFinalSkillEntries(skillMap = {}) {
  const roots = Object.values(skillMap).filter(entry => entry?.downgrade == null)
  const finalEntries = roots.map(rootEntry => {
    let entry = rootEntry
    const visited = new Set()
    while (entry?.upgrade != null && !visited.has(Number(entry.id))) {
      visited.add(Number(entry.id))
      entry = skillMap[String(entry.upgrade)] || entry
      if (Number(entry.id) === Number(rootEntry.id)) break
    }
    return entry
  })
  return [...new Map(finalEntries.map(entry => [Number(entry.id), entry])).values()]
}

function extractRetrofit(ship) {
  if (!ship.retrofit) return null
  const bonus = Object.fromEntries(
    Object.entries(ship.retrofit.bonus || {})
      .filter(([key, value]) => VISIBLE_STAT_KEYS.has(key) && Number(value) !== 0),
  )
  return {
    bonus,
    nodeShape: ship.retrofit.hexagon || [],
    shipType: SHIP_TYPE_BY_ID[ship.retrofit.type] || '',
  }
}

function resolveSkillDescription(template) {
  const valueRanges = Array.from({ length: 12 }, (_, index) => (
    getTemplateValueRange(template, index)
  ))
  return resolveNameCodes(String(template.desc || ''))
    .replace(/\$(\d+)/g, (_, number) => valueRanges[Number(number) - 1] || `$${number}`)
    .replace(/\$\d+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTemplateValueRange(template, index) {
  const direct = template.desc_get_add?.[index]
  if (Array.isArray(direct) && direct.length) return joinRange(direct)

  const levels = template.desc_add?.[index]
  if (!Array.isArray(levels) || !levels.length) return ''
  const values = levels
    .map(level => Array.isArray(level) ? level[0] : level)
    .filter(value => value != null && value !== '')
  return joinRange(values)
}

function joinRange(values) {
  const first = String(values[0] ?? '')
  const last = String(values.at(-1) ?? '')
  return !last || first === last ? first : `${first}/${last}`
}

function resolveNameCodes(value) {
  return String(value || '').replace(/\{namecode:(\d+)\}/g, (_, id) => (
    nameCodes[id]?.name || nameCodes[id]?.code || `{namecode:${id}}`
  ))
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}
