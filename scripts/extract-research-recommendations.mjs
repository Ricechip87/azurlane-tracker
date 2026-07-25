import fs from 'node:fs'
import path from 'node:path'
import { parseResearchBlueprintLua, parseResearchTasksLua } from './lib/research-lua-sources.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHARACTERS_PATH = path.join(ROOT, 'src', 'data', 'characters.json')
const OUTPUT_PATH = path.join(ROOT, 'src', 'data', 'researchRecommendations.json')

const FACTION_PATTERNS = [
  ['이글 유니온', '유니온'],
  ['유니온', '유니온'],
  ['로열 네이비', '로열'],
  ['사쿠라 엠파이어', '중앵'],
  ['메탈 블러드', '철혈'],
  ['이스트 글림', '동황'],
  ['사르데냐 엠파이어', '사르데냐'],
  ['사르데냐', '사르데냐'],
  ['노스 유니온', '노스유니온'],
  ['아이리스 리브레', '아이리스'],
  ['비시아 성좌', '비시아'],
  ['비시아 큐리아', '비시아'],
  ['튤리퍼', '튤리퍼'],
  ['Tempesta', '템페스타'],
  ['MOT', '템페스타'],
  ['템페스타', '템페스타'],
  ['LDP', '페드레리아'],
  ['Liga de Pedrería', '페드레리아'],
  ['Liga de Pedreria', '페드레리아'],
  ['屠龙联盟', '페드레리아'],
  ['페드레리아', '페드레리아'],
]

const FACTION_BY_NATIONALITY_ID = new Map([
  [1, '유니온'],
  [2, '로열'],
  [3, '중앵'],
  [4, '철혈'],
  [5, '동황'],
  [6, '사르데냐'],
  [7, '노스유니온'],
  [8, '아이리스'],
  [9, '비시아'],
  [10, '템페스타'],
  [11, '튤리퍼'],
  [12, '페드레리아'],
])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function findReferenceRoot() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(ROOT, entry.name))
    .find(candidate => fs.existsSync(path.join(candidate, 'AzurLaneLuaScripts', 'KR', 'sharecfg', 'ship_data_blueprint.lua')))
}

function stripMarkup(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseUnlockRequirements(unlockWord) {
  const text = stripMarkup(unlockWord)
  const rosterMatch = text.match(/등록\s*갯수\s*([\d,]+)\s*이상/)

  if (rosterMatch) {
    const faction = findFirstFaction(text)
    const lane = text.includes('선봉') ? '전열' : '후열'
    return [{ type: 'roster-count', faction, lane, value: parseNumber(rosterMatch[1]) }]
  }

  const requirements = []
  for (const { sourceName, faction, index } of findFactionMentions(text)) {
    const afterFaction = text.slice(index + sourceName.length)
    const valueMatch = afterFaction.match(/[\s\S]{0,45}?([\d][\d,]*)\s*(?:달성|도달|이상)/)
    if (!valueMatch) continue
    requirements.push({ index, type: 'tech-points', faction, value: parseNumber(valueMatch[1]) })
  }

  return requirements
    .sort((a, b) => a.index - b.index)
    .filter((requirement, index, items) => index === items.findIndex(item => (
      item.faction === requirement.faction && item.value === requirement.value
    )))
    .map(({ index: _index, ...requirement }) => requirement)
}

function findFactionMentions(text) {
  const matches = FACTION_PATTERNS
    .map(([sourceName, faction]) => ({ sourceName, faction, index: text.indexOf(sourceName) }))
    .filter(match => match.index >= 0)
    .sort((a, b) => a.index - b.index || b.sourceName.length - a.sourceName.length)
  const accepted = []

  for (const match of matches) {
    const end = match.index + match.sourceName.length
    const overlaps = accepted.some(item => match.index < item.end && end > item.index)
    if (!overlaps) accepted.push({ ...match, end })
  }

  return accepted
}

function findFirstFaction(text) {
  const match = FACTION_PATTERNS
    .map(([sourceName, faction]) => ({ index: text.indexOf(sourceName), faction }))
    .filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index)[0]
  if (!match) throw new Error(`개발함 진영을 해석하지 못했습니다: ${text}`)
  return match.faction
}

function parseNumber(value) {
  return Number(String(value).replaceAll(',', ''))
}

function parseXpPhase(task, phase) {
  const factions = [...new Set((task.target_id || [])
    .map(target => FACTION_BY_NATIONALITY_ID.get(Number(target?.[0])))
    .filter(Boolean))]
  const description = stripMarkup(task.desc)
  const lane = description.includes('선봉') ? '전열' : description.includes('주력') ? '후열' : ''

  return {
    phase,
    factions,
    lane,
    requiredXp: Number(task.target_num || 0),
    taskId: Number(task.id),
    description,
  }
}

const referenceRoot = findReferenceRoot()
if (!referenceRoot) throw new Error('참고용 AzurLaneData KR 원천을 찾지 못했습니다.')

const blueprintPath = path.join(referenceRoot, 'AzurLaneLuaScripts', 'KR', 'sharecfg', 'ship_data_blueprint.lua')
const taskPath = path.join(referenceRoot, 'AzurLaneLuaScripts', 'KR', 'sharecfgdata', 'task_data_template.lua')
const blueprints = parseResearchBlueprintLua(fs.readFileSync(blueprintPath, 'utf8'))
const wantedTaskIds = new Set(blueprints.flatMap(blueprint => (blueprint.unlock_task || []).map(([taskId]) => taskId)))
const tasks = parseResearchTasksLua(fs.readFileSync(taskPath, 'utf8'), wantedTaskIds)
const characters = readJson(CHARACTERS_PATH)
const characterByGid = new Map(characters.map(character => [Number(character.gid), character]))

const sourceShips = blueprints.map(blueprint => {
  const character = characterByGid.get(Number(blueprint.id))
  if (!character) throw new Error(`개발함 캐릭터를 찾지 못했습니다: gid ${blueprint.id}`)

  const xpTasks = (blueprint.unlock_task || [])
    .map(([taskId]) => tasks[String(taskId)])
    .filter(task => Number(task?.sub_type) === 1041)
  if (xpTasks.length !== 2) throw new Error(`${character.name}: 경험치 임무가 ${xpTasks.length}개입니다.`)

  return {
    id: character.id,
    gid: character.gid,
    name: character.name,
    generation: Number(blueprint.blueprint_version),
    planRarity: character.rarity === 'UR' ? 'DR' : 'PR',
    rarity: character.rarity,
    faction: character.faction,
    shipType: character.shipType,
    iconUrl: character.iconUrl,
    unlockText: stripMarkup(blueprint.unlock_word),
    unlockRequirements: parseUnlockRequirements(blueprint.unlock_word),
    xpPhases: xpTasks.map((task, index) => parseXpPhase(task, index + 1)),
    coinStrengthening: {
      available: Number(blueprint.is_pursuing) === 1,
      source: 'game-data',
    },
    sourceStatus: 'verified',
  }
})

const ships = sourceShips
  .sort((a, b) => a.generation - b.generation || String(a.id).localeCompare(String(b.id)))

const output = {
  source: {
    region: 'KR',
    blueprintFile: path.basename(blueprintPath),
    taskFile: path.basename(taskPath),
    maxGeneration: Math.max(...ships.map(ship => ship.generation)),
    nextGenerationPolicy: 'KR 정식 데이터 편입 후 반영',
    notes: [
      '1~9기는 KR 게임 데이터를 기준으로 생성합니다.',
      '최신 KR Lua의 개발함·임무 데이터를 직접 사용합니다.',
    ],
  },
  ships,
}

const temporaryOutput = `${OUTPUT_PATH}.tmp-${process.pid}`
try {
  fs.writeFileSync(temporaryOutput, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  fs.renameSync(temporaryOutput, OUTPUT_PATH)
} finally {
  if (fs.existsSync(temporaryOutput)) fs.rmSync(temporaryOutput)
}
console.log(`research recommendations generated: ${ships.length} ships, generation 1-${output.source.maxGeneration}`)
