import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { syncLocalIconAsset } from './lib/local-icon-assets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LOCAL_DATA = path.join(ROOT, '참고용', 'AzurLane')
const CHARS_PATH = path.join(ROOT, 'src', 'data', 'characters.json')
const OUT_DIR = path.join(ROOT, 'public', 'ship-icons')
const REPORT_PATH = path.join(ROOT, 'scripts', 'icon-missing-report.json')

// ship.json에 동명이인이 있어 이름 조회가 틀릴 수 있는 PR 함선을 id로 직접 고정
const SPECIAL_PR_SHIP_IDS = new Map([
  ['P001', 20001], // HMS Neptune (id:20001) — 콜라보 Neptune(id:10001)과 이름 충돌
])

const SPECIAL_SKINS = new Map([
  ['Z031', 10300010],
  ['Z032', 10300020],
  ['Z033', 10300030],
  ['Z034', 10300040],
  ['Z035', 10300050],
  ['Z036', 10300060],
])

const PR_NAMES = [
  'Neptune',
  'Monarch',
  'Ibuki',
  'Izumo',
  'Roon',
  'Saint Louis',
  'Seattle',
  'Georgia',
  'Kitakaze',
  'Azuma',
  'Friedrich der Große',
  'Gascogne',
  'Cheshire',
  'Drake',
  'Mainz',
  'Odin',
  'Champagne',
  'Anchorage',
  'Hakuryuu',
  'Ägir',
  'August von Parseval',
  'Marco Polo',
  'Plymouth',
  'Prinz Rupprecht',
  'Harbin',
  'Chkalov',
  'Brest',
  'Kearsarge',
  'Shimanto',
  'Felix Schultz',
  'Hindenburg',
  'Flandre',
  'Halford',
  'Daisen',
  'Napoli',
  'Admiral Nakhimov',
  'Bayard',
  'Kansas',
  'Mecklenburg',
  'Vittorio Cuniberti',
  'Dmitri Donskoi',
  'Gouden Leeuw',
]

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function makeZShipId(id) {
  const n = Number(String(id).slice(1))
  if (n >= 990 && n <= 995) return 10000 + n
  if (n >= 1 && n <= 8) return 10000 + n
  if (n >= 41 && n <= 44) return 10000 + n
  if (n >= 51 && n <= 69) return 10000 + n
  if (n >= 71 && n <= 96) return 10000 + n
  if (n >= 101 && n <= 122) return 10000 + n
  if (n >= 131 && n <= 156) return 10000 + n
  return null
}

function resolveShip(char, shipsById, shipsByName) {
  if (typeof char.id === 'number') return shipsById.get(char.id)

  const id = String(char.id)
  if (SPECIAL_SKINS.has(id)) return { gid: null, skinId: SPECIAL_SKINS.get(id) }
  if (id.startsWith('M')) return shipsById.get(30000 + Number(id.slice(1)))
  if (id.startsWith('Z')) return shipsById.get(makeZShipId(id))
  if (id.startsWith('P')) {
    if (SPECIAL_PR_SHIP_IDS.has(id)) return shipsById.get(SPECIAL_PR_SHIP_IDS.get(id))
    return shipsByName.get(PR_NAMES[Number(id.slice(1)) - 1])
  }

  return null
}

function copyIcon(gid) {
  return copyIconBySkinId(`${gid}0`)
}

function copyIconBySkinId(skinId) {
  return syncLocalIconAsset({
    sourceSkinDir: path.join(LOCAL_DATA, 'images', 'skin'),
    outputDir: OUT_DIR,
    skinId,
  })
}

const characters = readJson(CHARS_PATH)
const ships = Object.values(readJson(path.join(LOCAL_DATA, 'ship.json')))
const shipsById = new Map(ships.map(ship => [ship.id, ship]))
const shipsByName = new Map(ships.map(ship => [ship.name, ship]))

const missing = []
let resolved = 0

const updated = characters.map(char => {
  const existingIconUrl = char.gid ? copyIcon(char.gid) : null
  if (existingIconUrl) {
    resolved++
    return { ...char, iconUrl: existingIconUrl }
  }

  const ship = resolveShip(char, shipsById, shipsByName)
  if (!ship?.gid && !ship?.skinId) {
    missing.push({ id: char.id, name: char.name, reason: 'ship-not-found' })
    return char
  }

  const iconUrl = ship.skinId ? copyIconBySkinId(String(ship.skinId)) : copyIcon(ship.gid)
  if (!iconUrl) {
    missing.push({ id: char.id, name: char.name, gid: ship.gid, skinId: ship.skinId, reason: 'icon-file-not-found' })
    return { ...char, gid: ship.gid ?? char.gid }
  }

  resolved++
  return { ...char, gid: char.gid ?? ship.gid ?? ship.skinId, iconUrl }
})

fs.writeFileSync(CHARS_PATH, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8')
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(missing, null, 2)}\n`, 'utf-8')

console.log(`아이콘 동기화 완료: ${resolved}/${characters.length}`)
console.log(`누락: ${missing.length}`)
if (missing.length > 0) {
  console.log(`누락 리포트: ${REPORT_PATH}`)
}
