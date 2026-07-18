import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHARACTERS_PATH = path.join(ROOT, 'src', 'data', 'characters.json')
const GROWTH_RECOMMENDATIONS_PATH = path.join(ROOT, 'src', 'data', 'growthRecommendations.json')
const RESEARCH_RECOMMENDATIONS_PATH = path.join(ROOT, 'src', 'data', 'researchRecommendations.json')
const OUT_DIR = path.join(ROOT, 'public', 'ship-card-art')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function findReferenceDir() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(ROOT, entry.name))
    .find(candidate => fs.existsSync(path.join(candidate, 'AzurLane', 'images', 'skin')))
}

function extractRecommendationNames() {
  const growthData = readJson(GROWTH_RECOMMENDATIONS_PATH)
  const researchData = fs.existsSync(RESEARCH_RECOMMENDATIONS_PATH) ? readJson(RESEARCH_RECOMMENDATIONS_PATH) : { ships: [] }
  return [...new Set([
    ...(growthData.recommendations || []).map(item => item.name),
    ...(researchData.ships || []).map(item => item.name),
  ].filter(Boolean))]
}

function getSkinId(character) {
  const iconUrl = character?.iconUrl || ''
  const fileName = iconUrl.split('/').pop() || ''
  return fileName.replace(/\.(png|webp)$/i, '')
}

const referenceDir = findReferenceDir()
if (!referenceDir) throw new Error('참고용 AzurLane skin 폴더를 찾지 못했습니다.')

const characters = readJson(CHARACTERS_PATH)
const characterByName = new Map(characters.map(character => [character.name, character]))
const sourceSkinDir = path.join(referenceDir, 'AzurLane', 'images', 'skin')
const names = extractRecommendationNames()
const missing = []
let copied = 0

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

  if (!fs.existsSync(source)) {
    missing.push({ name, skinId, reason: 'shipyard-not-found' })
    continue
  }

  fs.copyFileSync(source, target)
  copied++
}

console.log(`recommendation card art copied: ${copied}/${names.length}`)
if (missing.length > 0) {
  console.log('missing:')
  for (const item of missing) console.log(JSON.stringify(item))
}
