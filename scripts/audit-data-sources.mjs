import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { officialRecordToCharacterTech, parseFleetTechLua } from './lib/fleet-tech-sources.mjs'
import { parseShipDataGroupGidsLua } from './lib/research-lua-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = process.env.AUDIT_SOURCE_ROOT
  ? path.resolve(process.env.AUDIT_SOURCE_ROOT)
  : path.join(root, '참고용')
const sourcePath = (...segments) => path.join(sourceRoot, ...segments)
const paths = {
  characters: 'src/data/characters.json',
  altoy: process.env.ALTOY_DATA_PATH || sourcePath('ALtoy', 'data', 'ship_info_data.json'),
  krShips: process.env.KR_SHIP_GROUP_PATH || sourcePath('AzurLaneLuaScripts', 'KR', 'sharecfg', 'ship_data_group.lua'),
  cnTech: process.env.CN_TECH_LUA_PATH || sourcePath('AzurLaneLuaScripts', 'CN', 'sharecfg', 'fleet_tech_ship_template.lua'),
  enTech: sourcePath('AzurLaneLuaScripts', 'EN', 'sharecfg', 'fleet_tech_ship_template.lua'),
  jpTech: sourcePath('AzurLaneLuaScripts', 'JP', 'sharecfg', 'fleet_tech_ship_template.lua'),
  krTech: sourcePath('AzurLaneLuaScripts', 'KR', 'sharecfg', 'fleet_tech_ship_template.lua'),
  twTech: sourcePath('AzurLaneLuaScripts', 'TW', 'sharecfg', 'fleet_tech_ship_template.lua'),
}

const resolveSourcePath = sourcePath => path.isAbsolute(sourcePath) ? sourcePath : path.join(root, sourcePath)
const readJson = sourcePath => JSON.parse(fs.readFileSync(resolveSourcePath(sourcePath), 'utf8'))
const characters = readJson(paths.characters)
const altoy = readJson(paths.altoy)
const krShipGids = new Set(parseShipDataGroupGidsLua(fs.readFileSync(resolveSourcePath(paths.krShips), 'utf8')).map(String))
const regionalTech = Object.fromEntries(['cnTech', 'enTech', 'jpTech', 'krTech', 'twTech'].map(name => [
  name,
  parseFleetTechLua(fs.readFileSync(resolveSourcePath(paths[name]), 'utf8')),
]))
const krTech = regionalTech.krTech
const cnTech = regionalTech.cnTech
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
  else if (!krShipGids.has(String(ship.gid))) displayOutOfScope.push({ id: ship.id, gid: ship.gid, name: ship.name })
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
const checkReferenceImages = process.env.SKIP_REFERENCE_IMAGE_AUDIT !== '1'
for (const ship of altoy) {
  if (checkReferenceImages) {
    const base = path.join(sourceRoot, 'AzurLane/images/skin', String(ship.skin_id))
    const missing = []
    if (!fs.existsSync(path.join(base, 'icon.png')) && !fs.existsSync(path.join(base, 'icon.webp'))) missing.push('icon.png')
    if (!fs.existsSync(path.join(base, 'shipyard.png')) && !fs.existsSync(path.join(base, 'shipyard.webp'))) missing.push('shipyard.png')
    if (!fs.existsSync(path.join(base, 'painting.png'))) missing.push('painting.png')
    if (missing.length) imageMissing.push({ gid: ship.gid, name: ship.name, skinId: ship.skin_id, missing })
  }
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
    sourceMode: process.env.AUDIT_SOURCE_ROOT ? 'explicit-reference-root' : 'latest-synced-reference',
  },
  sources: Object.fromEntries(Object.entries(paths).map(([name, relative]) => [name, {
    path: displaySourcePath(relative),
    sha256: sha256(resolveSourcePath(relative)),
  }])),
  display: {
    appCount: characters.length,
    altoyCount: altoy.length,
    krCount: krShipGids.size,
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
    regionalLuaCounts: Object.fromEntries(Object.entries(regionalTech).map(([name, records]) => [name, Object.keys(records).length])),
    regionalLuaVsCnMismatchCounts: Object.fromEntries(Object.entries(regionalTech).map(([name, records]) => [
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

console.log(`데이터 감사 완료: 앱 ${characters.length}척 / ALtoy ${altoy.length}척 / KR ${krShipGids.size}척`)
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

function displaySourcePath(sourcePath) {
  if (!path.isAbsolute(sourcePath)) return sourcePath
  const relativeToSource = path.relative(sourceRoot, sourcePath)
  if (!relativeToSource.startsWith('..') && !path.isAbsolute(relativeToSource)) {
    const label = process.env.AUDIT_SOURCE_ROOT ? 'explicit' : '참고용'
    return `${label}/${relativeToSource.replaceAll('\\', '/')}`
  }
  return `external/${path.basename(sourcePath)}`
}

function pick(record, fields) {
  return Object.fromEntries(fields.map(field => [field, record[field]]))
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}
