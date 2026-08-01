import fs from 'node:fs'
import path from 'node:path'
import characters from '../src/data/characters.json' with { type: 'json' }
import activeEvents from './data/kr-active-events.json' with { type: 'json' }
import { classifyObtainability } from './lib/obtainability-classifier.mjs'
import { normalizeConstructionSources } from './lib/construction-sources.mjs'
import { selectObtainSources } from './lib/obtainability-sources.mjs'
import { buildArenaShopGids, timelineFallbackSource } from './lib/permanent-shop-sources.mjs'
import { toKstDateKey } from '../src/utils/kstDate.js'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUTPUT_PATH = path.join(ROOT, 'src/data/shipObtainability.json')
const ALTOY_BASE_URL = 'https://jforplay.github.io/altoy'
const SHOP_PATTERN = /^(META ?상점|원형 상점|군수 상점|상점의 대함대|코어 상점|코어 교환|특별 ?보급|함대 상점|훈장 상점|훈장 교환)/
const OTHER_PERMANENT_PATTERN = /^(META ?상점|소형함 건조|중형함 건조|대형함 건조|특형함 건조|훈장|코어|군수 상점|원형 상점|함대 상점|연습 상점|지원 신청|특별 ?보급|상설 UR|UR Exchange|상점의 대함대|주간 임무|도감 업적|출석 스탬프|히든 임무|연구 ?도크)/

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')) }
function writeJson(filePath, data) { fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8') }
function normalizeList(values) { return [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))] }
function normalizeName(value) { return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s·ㆍ・.()（）]/g, '') }
function descriptionList(value) {
  if (!Array.isArray(value)) return []
  return normalizeList(value.map(item => Array.isArray(item) ? item[0] : item))
}

function findReferenceDir() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(ROOT, entry.name))
    .find(candidate => fs.existsSync(path.join(candidate, 'AzurLaneData', 'KR', 'ShareCfg', 'ship_data_group.json')) && fs.existsSync(path.join(candidate, 'AzurLane', 'ship.json')))
}

async function loadAltoyData(referenceDir) {
  const sourceRoot = process.env.ALTOY_SOURCE_ROOT
  if (sourceRoot) {
    const repoRoot = path.resolve(sourceRoot)
    return {
      lite: readJson(path.join(repoRoot, 'public/data/ship_info_lite.json')),
      full: readJson(path.join(repoRoot, 'public/data/ship_info_data.json')),
      maps: readJson(path.join(repoRoot, 'public/data/maps/map_data_full.json')),
      timeline: readJson(path.join(repoRoot, 'src/data/kr_event_timeline.json')),
      source: 'ALtoy source checkout (read-only)',
    }
  }

  const cachedRoot = path.join(referenceDir, 'ALtoy')
  const [lite, full, maps, timeline] = await Promise.all([
    fetchJson(`${ALTOY_BASE_URL}/data/ship_info_lite.json`, path.join(cachedRoot, 'data/ship_info_lite.json')),
    fetchJson(`${ALTOY_BASE_URL}/data/ship_info_data.json`, path.join(cachedRoot, 'data/ship_info_data.json')),
    fetchJson(`${ALTOY_BASE_URL}/data/maps/map_data_full.json`, path.join(cachedRoot, 'data/maps/map_data_full.json')),
    fetchJson('https://raw.githubusercontent.com/JforPlay/altoy/main/src/data/kr_event_timeline.json', path.join(cachedRoot, 'data/kr_event_timeline.json')),
  ])
  return { lite, full, maps, timeline, source: ALTOY_BASE_URL }
}

async function fetchJson(url, fallbackPath) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
    return response.json()
  } catch (error) {
    if (fallbackPath && fs.existsSync(fallbackPath)) return readJson(fallbackPath)
    throw error
  }
}

function buildKrGroupByGid(rows) {
  return new Map(Object.values(rows).filter(Boolean).map(row => [Number(row.group_type), row]))
}

function buildArchiveGids(mapData, liteData) {
  const idToGid = new Map(liteData.map(ship => [Number(ship.id), Number(ship.gid)]))
  const gids = new Set()
  for (const [key, chapter] of Object.entries(mapData || {})) {
    if (!key.startsWith('a_')) continue
    for (const drop of chapter.ship_drops_archive || []) {
      const gid = idToGid.get(Number(drop.id))
      if (gid) gids.add(gid)
    }
    const special = chapter.special_drop
    if (special?.type === 4) gids.add(idToGid.get(Number(special.id)) || Number(special.id))
  }
  return gids
}

function buildPermanentTimelineInfo(timeline) {
  const info = new Map()
  for (const row of timeline || []) {
    if (!String(row['복각여부'] || '').includes('상시편입')) continue
    for (const name of String(row['함순이'] || '').split(/[,，]/)) {
      const normalized = normalizeName(name)
      if (!normalized || normalized === '-') continue
      const reward = String(row['임무 보상'] || '')
      const source = reward.includes(`${name.trim()} 군수상점`) ? '군수 상점 교환' : null
      info.set(normalized, { source, date: String(row['날짜'] || '') })
    }
  }
  return info
}

function buildCoreMonthlyGids(monthShop, activityShop) {
  const gids = new Set()
  for (const month of Object.values(monthShop || {})) {
    for (const goodsId of month.core_shop_goods || []) {
      const goods = activityShop?.[goodsId]
      if (goods?.commodity_type !== 4) continue
      const skinId = Number(goods.commodity_id)
      if (Number.isFinite(skinId)) gids.add(Math.floor(skinId / 10))
    }
  }
  return gids
}

function currentEventFor(name, today = toKstDateKey()) {
  return (activeEvents.events || []).find(event => event.ships.includes(name) && event.startsAt <= today && today <= event.endsAt) || null
}

function mapDrops(lite) {
  const result = []
  for (const [chapterIndex, entries] of (lite?.maps || []).entries()) {
    for (const entry of entries || []) {
      if (Number.isFinite(Number(entry.map))) result.push({ stage: `${chapterIndex + 1}-${Number(entry.map)}`, type: entry.type === 1 ? 'boss' : 'normal' })
    }
  }
  return result
}

function compareLists(local, altoy) {
  const localSet = new Set(local), altoySet = new Set(altoy)
  if (!local.length && !altoy.length) return 'empty'
  if (local.every(item => altoySet.has(item)) && altoy.every(item => localSet.has(item))) return 'matched'
  if (!local.length) return 'altoy-only'
  if (!altoy.length) return 'local-only'
  return 'different'
}

function currentObtainSources({ rawObtain, altoyObtain, lite, drops, permanentSignals, timelineInfo, activeEvent }) {
  if (activeEvent) return [`현재 이벤트: ${activeEvent.name} (${activeEvent.endsAt}까지)`]
  if (!Object.values(permanentSignals).some(Boolean)) return rawObtain

  const sources = []
  for (const drop of drops) sources.push(`메인 스테이지 해역${drop.stage}`)
  if (permanentSignals.archive) sources.push('작전문서 드랍')
  if (permanentSignals.coreMonthly) sources.push('코어 월간 교환')
  if (permanentSignals.arenaShop) sources.push('연습 상점(랜덤 출현)')
  if (lite?.light) sources.push('소형함 상시 건조')
  if (lite?.heavy) sources.push('중형함 상시 건조')
  if (lite?.special) sources.push('특형함 상시 건조')
  sources.push(...altoyObtain.filter(source => SHOP_PATTERN.test(source) || OTHER_PERMANENT_PATTERN.test(source)))
  if (timelineInfo && sources.length === 0) sources.push(timelineFallbackSource(timelineInfo))
  return normalizeConstructionSources(normalizeList(sources.length ? sources : rawObtain))
}

const referenceDir = findReferenceDir()
if (!referenceDir) throw new Error('참고용 원본 폴더를 찾지 못했습니다.')

const localShips = readJson(path.join(referenceDir, 'AzurLane', 'ship.json'))
const krGroups = readJson(path.join(referenceDir, 'AzurLaneData', 'KR', 'ShareCfg', 'ship_data_group.json'))
const monthShop = readJson(path.join(referenceDir, 'AzurLaneData', 'KR', 'ShareCfg', 'month_shop_template.json'))
const activityShop = readJson(path.join(referenceDir, 'AzurLaneData', 'KR', 'ShareCfg', 'activity_shop_template.json'))
const arenaShop = readJson(path.join(referenceDir, 'AzurLaneData', 'KR', 'ShareCfg', 'arena_data_shop.json'))
const shopData = readJson(path.join(referenceDir, 'AzurLaneData', 'KR', 'sharecfgdata', 'shop_template.json'))
const altoy = await loadAltoyData(referenceDir)
const localByGid = new Map(localShips.map(ship => [Number(ship.gid), ship]))
const localByName = new Map(localShips.map(ship => [normalizeName(ship.name), ship]))
const krByGid = buildKrGroupByGid(krGroups)
const liteByGid = new Map(altoy.lite.map(ship => [Number(ship.gid), ship]))
const liteByName = new Map(altoy.lite.map(ship => [normalizeName(ship.name), ship]))
const fullByGid = new Map(altoy.full.map(ship => [Number(ship.gid), ship]))
const fullByName = new Map(altoy.full.map(ship => [normalizeName(ship.name), ship]))
const archiveGids = buildArchiveGids(altoy.maps, altoy.lite)
const permanentTimelineInfo = buildPermanentTimelineInfo(altoy.timeline)
const coreMonthlyGids = buildCoreMonthlyGids(monthShop, activityShop)
const arenaShopGids = buildArenaShopGids(arenaShop, shopData)

const ships = characters.map(character => {
  const gid = Number(character.gid)
  const nameKey = normalizeName(character.name)
  const local = localByGid.get(gid) || localByName.get(nameKey)
  const lite = liteByGid.get(gid) || liteByName.get(nameKey)
  const full = fullByGid.get(gid) || fullByName.get(nameKey)
  const localKrObtain = descriptionList(krByGid.get(gid)?.description)
  const altoyObtain = normalizeList(full?.description)
  const rawObtain = selectObtainSources({ gid, localKrObtain, altoyObtain })
  const drops = mapDrops(lite)
  const timelineInfo = permanentTimelineInfo.get(nameKey)
  const permanentSignals = {
    map: drops.length > 0,
    archive: archiveGids.has(Number(lite?.gid ?? full?.gid ?? gid)),
    coreMonthly: coreMonthlyGids.has(Number(lite?.gid ?? full?.gid ?? gid)),
    arenaShop: arenaShopGids.has(Number(lite?.gid ?? full?.gid ?? gid)),
    build: Boolean(lite?.light || lite?.heavy || lite?.special),
    shop: altoyObtain.some(source => SHOP_PATTERN.test(source)),
    other: altoyObtain.some(source => OTHER_PERMANENT_PATTERN.test(source)),
    timeline: Boolean(timelineInfo),
  }
  const activeEvent = currentEventFor(character.name)
  const obtain = currentObtainSources({ rawObtain, altoyObtain, lite, drops, permanentSignals, timelineInfo, activeEvent })
  const classification = classifyObtainability({
    name: character.name,
    faction: character.faction,
    obtain,
    permanentSources: normalizeConstructionSources(altoyObtain),
    mapDrops: drops,
    permanentSignals,
    activeEvent,
  })

  return {
    id: character.id, gid, name: character.name, rarity: character.rarity,
    faction: character.faction, shipType: character.shipType,
    obtain, historicalObtain: normalizeConstructionSources(rawObtain), obtainEn: normalizeList(local?.obtain),
    build: { light: Boolean(lite?.light), heavy: Boolean(lite?.heavy), special: Boolean(lite?.special), limited: Boolean(lite?.limited), timer: lite?.timer || null },
    mapDrops: drops, permanentSignals, ...classification,
    verification: { localKr: localKrObtain.length > 0, localResource: Boolean(local), altoy: Boolean(full), status: compareLists(localKrObtain, altoyObtain) },
  }
}).sort((a, b) => a.gid - b.gid)

const countBy = (items, selector) => Object.fromEntries([...new Set(items.map(selector))].sort().map(key => [key, items.filter(item => selector(item) === key).length]))
const output = {
  meta: {
    note: 'KR-visible ships cross-checked with ALtoy permanent-source data. CN-only availability states are not exposed.',
    generatedAt: new Date().toISOString(), total: ships.length,
    withObtain: ships.filter(ship => ship.obtain.length).length,
    withoutObtain: ships.filter(ship => !ship.obtain.length).length,
    availability: countBy(ships, ship => ship.availability.key),
    difficulty: countBy(ships, ship => ship.difficulty.key),
    acquisitionRoutes: countBy(ships.flatMap(ship => ship.acquisitionRoutes), route => route.key),
    source: altoy.source,
  },
  ships,
}

writeJson(OUTPUT_PATH, output)
console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}`)
console.log(JSON.stringify(output.meta, null, 2))
