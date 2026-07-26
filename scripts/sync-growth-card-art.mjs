import fs from 'node:fs'
import path from 'node:path'
import {
  ADDITIONAL_STATS,
  ADDITIONAL_STAT_SHIP_TYPES,
} from '../src/utils/additionalStatRecommendations.js'
import { normalizeStatShipTypeValue } from '../src/utils/shipClassifications.js'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHARACTERS_PATH = path.join(ROOT, 'src', 'data', 'characters.json')
const GROWTH_RECOMMENDATIONS_PATH = path.join(ROOT, 'src', 'data', 'growthRecommendations.json')
const RESEARCH_RECOMMENDATIONS_PATH = path.join(ROOT, 'src', 'data', 'researchRecommendations.json')
const OUT_DIR = path.join(ROOT, 'public', 'ship-card-art')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function extractRecommendationNames(characters) {
  const growthData = readJson(GROWTH_RECOMMENDATIONS_PATH)
  const researchData = fs.existsSync(RESEARCH_RECOMMENDATIONS_PATH) ? readJson(RESEARCH_RECOMMENDATIONS_PATH) : { ships: [] }
  const additionalStats = new Set(ADDITIONAL_STATS)
  const additionalShipTypes = new Set(ADDITIONAL_STAT_SHIP_TYPES)
  const additionalStatNames = characters
    .filter(character => ['statAcquired', 'stat120'].some(phase => {
      const bonus = character[phase]
      return additionalStats.has(bonus?.stat)
        && bonus?.shipTypes?.some(shipType => additionalShipTypes.has(normalizeStatShipTypeValue(shipType)))
    }))
    .map(character => character.name)

  return [...new Set([
    ...(growthData.recommendations || []).map(item => item.name),
    ...(researchData.ships || []).map(item => item.name),
    ...additionalStatNames,
  ].filter(Boolean))]
}

function getSkinId(character) {
  const iconUrl = character?.iconUrl || ''
  const fileName = iconUrl.split('/').pop() || ''
  return fileName.replace(/\.(png|webp)$/i, '')
}

const referenceDir = path.join(ROOT, '참고용')
if (!fs.existsSync(path.join(referenceDir, 'AzurLane', 'images', 'skin'))) {
  throw new Error('참고용 AzurLane skin 폴더를 찾지 못했습니다.')
}

const characters = readJson(CHARACTERS_PATH)
const characterByName = new Map(characters.map(character => [character.name, character]))
const sourceSkinDir = path.join(referenceDir, 'AzurLane', 'images', 'skin')
const names = extractRecommendationNames(characters)
const missing = []
const desiredFiles = new Set()
let copied = 0
let preserved = 0

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const name of names) {
  const character = characterByName.get(name)
  const skinId = getSkinId(character)

  if (!skinId) {
    missing.push({ name, reason: 'character-or-skin-id-not-found' })
    continue
  }

  const source = path.join(sourceSkinDir, skinId, 'shipyard.png')
  const target = path.join(OUT_DIR, `${skinId}.png`)
  desiredFiles.add(`${skinId}.png`)

  if (fs.existsSync(target)) {
    preserved++
    continue
  }

  if (!fs.existsSync(source)) {
    missing.push({ name, skinId, reason: 'shipyard-not-found' })
    continue
  }

  const temporary = `${target}.tmp-${process.pid}`
  try {
    fs.copyFileSync(source, temporary)
    fs.renameSync(temporary, target)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
  copied++
}

const removed = fs.readdirSync(OUT_DIR, { withFileTypes: true })
  .filter(entry => entry.isFile() && /^\d+\.png$/i.test(entry.name) && !desiredFiles.has(entry.name))
  .map(entry => {
    fs.rmSync(path.join(OUT_DIR, entry.name))
    return entry.name
  })

console.log(`recommendation card art: ${copied} copied, ${preserved} preserved, ${removed.length} stale removed, ${missing.length} unavailable`)
if (missing.length > 0) {
  console.log('missing:')
  for (const item of missing) console.log(JSON.stringify(item))
}
