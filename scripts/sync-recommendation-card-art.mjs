import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  getRecommendationCardArtFileName,
} from '../src/utils/recommendationCardArt.js'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHARACTERS_PATH = path.join(ROOT, 'src', 'data', 'characters.json')
const OUT_DIR = path.join(ROOT, 'public', 'ship-card-art')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function getSkinId(character) {
  return getRecommendationCardArtFileName(character).replace(/\.png$/i, '')
}

const referenceDir = path.join(ROOT, '참고용')
if (!fs.existsSync(path.join(referenceDir, 'AzurLane', 'images', 'skin'))) {
  throw new Error('참고용 AzurLane skin 폴더를 찾지 못했습니다.')
}

const characters = readJson(CHARACTERS_PATH)
const sourceSkinDir = path.join(referenceDir, 'AzurLane', 'images', 'skin')
const missing = []
const desiredFiles = new Set()
let copied = 0
let preserved = 0
let ffmpegChecked = false

function assertFfmpegAvailable() {
  if (ffmpegChecked) return
  const result = spawnSync('ffmpeg', ['-hide_banner', '-version'], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error('ffmpeg with libwebp support is required to generate recommendation card art')
  }
  ffmpegChecked = true
}

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const character of characters) {
  const name = character.name
  const skinId = getSkinId(character)

  if (!skinId) {
    missing.push({ name, reason: 'character-or-skin-id-not-found' })
    continue
  }

  const sourceExtension = ['png', 'webp'].find(extension => (
    fs.existsSync(path.join(sourceSkinDir, skinId, `shipyard.${extension}`))
  ))
  if (!sourceExtension) {
    const existingExtension = ['png', 'webp'].find(extension => (
      fs.existsSync(path.join(OUT_DIR, `${skinId}.${extension}`))
    ))
    if (existingExtension) {
      desiredFiles.add(`${skinId}.${existingExtension}`)
      preserved++
      continue
    }
    missing.push({ name, skinId, reason: 'shipyard-and-public-fallback-not-found' })
    continue
  }
  const fileName = `${skinId}.webp`
  const source = path.join(sourceSkinDir, skinId, `shipyard.${sourceExtension}`)
  const target = path.join(OUT_DIR, fileName)
  desiredFiles.add(fileName)

  if (fs.existsSync(target)) {
    preserved++
    continue
  }

  const temporary = `${target}.tmp-${process.pid}.webp`
  try {
    if (sourceExtension === 'webp') {
      fs.copyFileSync(source, temporary)
    } else {
      assertFfmpegAvailable()
      const result = spawnSync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', source,
        '-c:v', 'libwebp', '-quality', '88', '-compression_level', '6',
        temporary,
      ], { encoding: 'utf8' })
      if (result.status !== 0) {
        throw new Error(`ffmpeg failed for ${name}: ${result.stderr || result.error?.message || 'unknown error'}`)
      }
    }
    fs.renameSync(temporary, target)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
  copied++
}

if (missing.length > 0) {
  console.log('missing:')
  for (const item of missing) console.log(JSON.stringify(item))
  throw new Error(`recommendation card art sync aborted: ${missing.length} ships have no source or public fallback`)
}

const removed = fs.readdirSync(OUT_DIR, { withFileTypes: true })
  .filter(entry => entry.isFile() && /^\d+\.(png|webp)$/i.test(entry.name) && !desiredFiles.has(entry.name))
  .map(entry => {
    fs.rmSync(path.join(OUT_DIR, entry.name))
    return entry.name
  })

console.log(`recommendation card art: ${copied} copied, ${preserved} preserved, ${removed.length} stale removed, ${missing.length} unavailable`)
