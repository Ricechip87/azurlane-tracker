import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { officialRecordToCharacterTech, parseFleetTechLua } from './lib/fleet-tech-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const paths = {
  characters: 'src/data/characters.json',
  altoy: '참고용/ALtoy/data/ship_info_data.json',
  krShips: '참고용/AzurLaneData/KR/ShareCfg/ship_data_group.json',
  cnJsonTech: '참고용/AzurLaneData/CN/ShareCfg/fleet_tech_ship_template.json',
  enTech: '참고용/AzurLaneData/EN/ShareCfg/fleet_tech_ship_template.json',
  jpTech: '참고용/AzurLaneData/JP/ShareCfg/fleet_tech_ship_template.json',
  krTech: '참고용/AzurLaneData/KR/ShareCfg/fleet_tech_ship_template.json',
  twTech: '참고용/AzurLaneData/TW/ShareCfg/fleet_tech_ship_template.json',
  cnTech: '참고용/AzurLaneLuaScripts/CN/sharecfg/fleet_tech_ship_template.lua',
}

const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const characters = readJson(paths.characters)
const altoy = readJson(paths.altoy)
const krShips = readJson(paths.krShips)
const regionalTech = Object.fromEntries(['cnJsonTech', 'enTech', 'jpTech', 'krTech', 'twTech'].map(name => [name, readJson(paths[name])]))
const krTech = regionalTech.krTech
const cnTech = parseFleetTechLua(fs.readFileSync(path.join(root, paths.cnTech), 'utf8'))
const altoyByGid = new Map(altoy.map(ship => [String(ship.gid), ship]))
const altoyByName = new Map(altoy.map(ship => [normalizeName(ship.name), ship]))
const appGids = new Set(characters.map(ship => String(ship.gid)))

const displayOutOfScope = []
const identityFallbacks = []
const matchedAlttoy = new Map()
for (const ship of characters) {
  let source = altoyByGid.get(String(ship.gid))
  if (!source) {
    source = altoyByName.get(normalizeName(ship.name))
    if (source) identityFallbacks.push({ appId: ship.id, name: ship.name, appGid: ship.gid, altoyGid: source.gid, skinId: source.skin_id })
  }
  if (source) matchedAlttoy.set(String(source.gid), ship)
  else if (!krShips[String(ship.gid)]) displayOutOfScope.push({ id: ship.id, gid: ship.gid, name: ship.name })
}

const altoyMissingInApp = altoy
  .filter(ship => !matchedAlttoy.has(String(ship.gid)))
  .map(ship => ({ gid: ship.gid, name: ship.name, skinId: ship.skin_id }))

const cnCurrentMismatches = []
for (const ship of characters) {
  const source = cnTech[String(ship.gid)]
  if (!source) continue
  const expected = officialRecordToCharacterTech(source, ship)
  const actual = { techPoints: ship.techPoints, statAcquired: ship.statAcquired, stat120: ship.stat120 }
  if (stable(actual) !== stable(expected)) cnCurrentMismatches.push({ gid: ship.gid, name: ship.name, expected, actual })
}

const techFields = [
  'pt_get', 'pt_upgrage', 'pt_level',
  'add_get_shiptype', 'add_get_attr', 'add_get_value',
  'add_level_shiptype', 'add_level_attr', 'add_level_value',
]
const cnKrMismatches = Object.keys(cnTech)
  .filter(gid => krTech[gid])
  .filter(gid => stable(pick(cnTech[gid], techFields)) !== stable(pick(krTech[gid], techFields)))
  .map(gid => ({ gid: Number(gid), cn: pick(cnTech[gid], techFields), kr: pick(krTech[gid], techFields) }))

const imageMissing = []
const publicIconMissing = []
for (const ship of altoy) {
  const base = path.join(root, '참고용/AzurLane/images/skin', String(ship.skin_id))
  const missing = []
  if (!fs.existsSync(path.join(base, 'icon.png')) && !fs.existsSync(path.join(base, 'icon.webp'))) missing.push('icon.png')
  if (!fs.existsSync(path.join(base, 'shipyard.png')) && !fs.existsSync(path.join(base, 'shipyard.webp'))) missing.push('shipyard.png')
  if (!fs.existsSync(path.join(base, 'painting.png'))) missing.push('painting.png')
  if (missing.length) imageMissing.push({ gid: ship.gid, name: ship.name, skinId: ship.skin_id, missing })
  if (!fs.existsSync(path.join(root, 'public/ship-icons', `${ship.skin_id}.png`))
    && !fs.existsSync(path.join(root, 'public/ship-icons', `${ship.skin_id}.webp`))) {
    publicIconMissing.push({ gid: ship.gid, name: ship.name, skinId: ship.skin_id })
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  policy: {
    displayScope: 'ALtoy/KR service roster only; name fallback handles six Utawarerumono skin-ID identities',
    fleetTechPriority: ['CN Lua', 'KR JSON', 'JP-based maintained tech sheet', 'existing app value'],
    cnOnlyShipsDisplayed: false,
  },
  sources: Object.fromEntries(Object.entries(paths).map(([name, relative]) => [name, {
    path: relative,
    sha256: sha256(path.join(root, relative)),
  }])),
  display: {
    appCount: characters.length,
    altoyCount: altoy.length,
    krCount: Object.keys(krShips).length,
    outOfScope: displayOutOfScope,
    altoyMissingInApp,
    identityFallbacks,
  },
  fleetTech: {
    cnCount: Object.keys(cnTech).length,
    krCount: Object.keys(krTech).length,
    displayedWithCn: characters.filter(ship => cnTech[String(ship.gid)]).length,
    displayedWithoutCn: characters.filter(ship => !cnTech[String(ship.gid)]).length,
    cnOnlyExcludedGids: Object.keys(cnTech).filter(gid => !appGids.has(gid)).map(Number),
    cnKrMismatchCount: cnKrMismatches.length,
    cnKrMismatches,
    regionalJsonCounts: Object.fromEntries(Object.entries(regionalTech).map(([name, records]) => [name, Object.keys(records).length])),
    regionalJsonVsCnMismatchCounts: Object.fromEntries(Object.entries(regionalTech).map(([name, records]) => [
      name,
      Object.keys(records).filter(gid => cnTech[gid]
        && stable(pick(cnTech[gid], techFields)) !== stable(pick(records[gid], techFields))).length,
    ])),
    currentVsCnMismatches: cnCurrentMismatches,
  },
  images: {
    publicIconMissing,
    referenceMissingCount: imageMissing.length,
    referenceMissing: imageMissing,
  },
}

const output = path.join(root, 'reports/data-sources/latest.json')
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(`데이터 감사 완료: 앱 ${characters.length}척 / ALtoy ${altoy.length}척 / KR ${Object.keys(krShips).length}척`)
console.log(`CN 기술 ${report.fleetTech.displayedWithCn}척 반영, CN 미수록 ${report.fleetTech.displayedWithoutCn}척, CN 전용 ${report.fleetTech.cnOnlyExcludedGids.length}척 제외`)
console.log(`참고 이미지 누락 ${imageMissing.length}척, 공개 아이콘 누락 ${publicIconMissing.length}척`)

if (displayOutOfScope.length || altoyMissingInApp.length || cnCurrentMismatches.length || publicIconMissing.length) {
  process.exitCode = 1
}

function normalizeName(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[·ㆍ\s()（）・]/g, '')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function pick(record, fields) {
  return Object.fromEntries(fields.map(field => [field, record[field]]))
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}
