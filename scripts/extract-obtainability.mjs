import fs from 'node:fs'
import path from 'node:path'
import characters from '../src/data/characters.json' with { type: 'json' }

const ROOT = path.resolve(import.meta.dirname, '..')
const OUTPUT_PATH = path.join(ROOT, 'src/data/shipObtainability.json')
const ALTOY_BASE_URL = 'https://jforplay.github.io/altoy'
const ALTOY_FILES = [
  'data/ship_info_lite.json',
  'data/ship_info_data.json',
]
const UNAVAILABLE_OBTAIN = '\uC785\uC218 \uBABB\uD568'
const MANUAL_UNAVAILABLE_GIDS = new Set([
  10300010,
  10300020,
  10300030,
  10300040,
  10300050,
  10300060,
])

const DIFFICULTY = {
  EASY: { rank: 1, key: 'easy', label: '쉬움' },
  NORMAL: { rank: 2, key: 'normal', label: '보통' },
  HARD: { rank: 3, key: 'hard', label: '어려움' },
  LIMITED: { rank: 4, key: 'limited', label: '한정/복각 대기' },
  EXCLUDED: { rank: 5, key: 'excluded', label: '추천 제외' },
  UNKNOWN: { rank: 9, key: 'unknown', label: '미확인' },
}

const easyPatterns = [
  /^함대 상점 교환$/,
  /^군수 상점 교환$/,
  /^훈장 상점 교환$/,
  /^상점의 대함대 보급에서 획득 가능$/,
  /^주간 임무$/,
  /^도감 업적 달성$/,
  /^출석 스탬프$/,
  /^작전 파일:/,
  /^히든 임무/,
  /^메인 스테이지 해역[1-4]-[1-4]$/,
]

const normalPatterns = [
  /^(소형함|중형함|대형함|특형함) 건조$/,
  /^대형함 건조[,·] 특형함 건조$/,
  /^대형함 건조·특형함 건조$/,
  /^중형함 건조、특형함 건조$/,
  /^훈장 상점 교환\(랜덤 갱신\)$/,
  /^훈장 교환\(랜덤 출현\)$/,
  /^훈장 지원\((랜덤 갱신|확률적 출현)\)$/,
  /^지원 신청\(랜덤 출현\)$/,
  /^특별 ?보급/,
  /^코어 (상점|교환 획득)$/,
  /^원형 상점 교환$/,
  /^연구 ?도크$/,
  /^메인 스테이지 해역(?:[5-9]|1[0-2])-[1-4]$/,
]

const hardPatterns = [
  /^상설 UR 함선 교환$/,
  /^UR Exchange$/,
  /META 연구실|META 연구실·|메타랩/,
  /^메인 스테이지 해역1[3-6]-[1-4]$/,
  /^추천 획득 해역 16-4$/,
]

const limitedPatterns = [
  /^(기간 한정|한정 건조|한정 이벤트|이벤트|이벤트：|이벤트:|이벤트 :)/,
]

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function findReferenceDir() {
  const candidates = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(ROOT, entry.name))

  return candidates.find(candidate =>
    fs.existsSync(path.join(candidate, 'AzurLaneData', 'KR', 'ShareCfg', 'ship_data_group.json')) &&
    fs.existsSync(path.join(candidate, 'AzurLane', 'ship.json'))
  )
}

function getDescriptionList(description) {
  if (!Array.isArray(description)) return []
  return description
    .map(item => Array.isArray(item) ? item[0] : item)
    .filter(Boolean)
    .map(item => String(item).trim())
    .filter(Boolean)
}

function normalizeList(values) {
  return [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))]
}

function buildKrGroupByGid(krGroup) {
  const byGid = new Map()
  for (const row of Object.values(krGroup)) {
    if (!row || typeof row !== 'object') continue
    const gid = Number(row.group_type)
    if (!Number.isFinite(gid)) continue
    byGid.set(gid, row)
  }
  return byGid
}

async function fetchAltoySnapshots(referenceDir) {
  const snapshotDir = path.join(referenceDir, 'ALtoy')
  const result = {}

  for (const file of ALTOY_FILES) {
    const snapshotPath = path.join(snapshotDir, file)
    try {
      const response = await fetch(`${ALTOY_BASE_URL}/${file}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      writeJson(snapshotPath, data)
      result[file] = { data, status: 'fetched', path: snapshotPath }
    } catch (error) {
      if (fs.existsSync(snapshotPath)) {
        result[file] = { data: readJson(snapshotPath), status: 'cached', path: snapshotPath, error: String(error.message || error) }
      } else {
        result[file] = { data: null, status: 'unavailable', path: snapshotPath, error: String(error.message || error) }
      }
    }
  }

  return result
}

function getBuildInfo(localShip, altoy) {
  return {
    light: Boolean(altoy?.light),
    heavy: Boolean(altoy?.heavy),
    special: Boolean(altoy?.special),
    limited: Boolean(altoy?.limited),
    timer: altoy?.timer || null,
    localObtainEn: normalizeList(localShip?.obtain || []),
  }
}

function getMapDrops(altoy) {
  if (!Array.isArray(altoy?.maps)) return []
  const drops = []

  altoy.maps.forEach((chapterMaps, chapterIndex) => {
    if (!Array.isArray(chapterMaps)) return
    chapterMaps.forEach(entry => {
      if (!entry || typeof entry !== 'object') return
      const chapter = chapterIndex + 1
      const map = Number(entry.map)
      if (!Number.isFinite(map)) return
      drops.push({
        stage: `${chapter}-${map}`,
        type: entry.type === 1 ? 'boss' : 'normal',
      })
    })
  })

  return drops
}

function matchAny(value, patterns) {
  return patterns.some(pattern => pattern.test(value))
}

function classifyObtainSource(source) {
  if (source === UNAVAILABLE_OBTAIN) return DIFFICULTY.EXCLUDED
  if (matchAny(source, easyPatterns)) return DIFFICULTY.EASY
  if (matchAny(source, normalPatterns)) return DIFFICULTY.NORMAL
  if (matchAny(source, hardPatterns)) return DIFFICULTY.HARD
  if (matchAny(source, limitedPatterns)) return DIFFICULTY.LIMITED
  return DIFFICULTY.UNKNOWN
}

function classifyDifficulty(obtain, build) {
  if (obtain.includes(UNAVAILABLE_OBTAIN)) {
    return {
      key: DIFFICULTY.EXCLUDED.key,
      label: DIFFICULTY.EXCLUDED.label,
      reasons: [UNAVAILABLE_OBTAIN],
    }
  }

  const sourceDifficulties = obtain.map(classifyObtainSource)
  let selected = sourceDifficulties.reduce(
    (current, next) => next.rank < current.rank ? next : current,
    DIFFICULTY.UNKNOWN,
  )
  const reasons = obtain.map((source, index) => `${source}: ${sourceDifficulties[index].label}`)

  if (selected === DIFFICULTY.UNKNOWN && build.limited) {
    selected = DIFFICULTY.LIMITED
    reasons.push('한정 건조 플래그')
  }

  if (obtain.length === 0 && (build.light || build.heavy || build.special)) {
    selected = DIFFICULTY.NORMAL
    reasons.push('건조 플래그만 확인됨')
  }

  return {
    key: selected.key,
    label: selected.label,
    reasons: normalizeList(reasons),
  }
}

function compareLists(local, altoy) {
  const localSet = new Set(local)
  const altoySet = new Set(altoy)
  const missingInAltoy = local.filter(item => !altoySet.has(item))
  const missingInLocal = altoy.filter(item => !localSet.has(item))

  if (local.length === 0 && altoy.length === 0) return 'empty'
  if (missingInAltoy.length === 0 && missingInLocal.length === 0) return 'matched'
  if (local.length === 0 && altoy.length > 0) return 'altoy-only'
  if (local.length > 0 && altoy.length === 0) return 'local-only'
  return 'different'
}

function buildRecord(character, sources) {
  const gid = Number(character.gid)
  const localShip = sources.localShipByGid.get(gid)
  const krGroup = sources.krGroupByGid.get(gid)
  const altoy = sources.altoyByGid.get(gid)

  const localKrObtain = getDescriptionList(krGroup?.description)
  const altoyObtain = normalizeList(altoy?.description || [])
  const obtain = localKrObtain.length > 0
    ? localKrObtain
    : altoyObtain.length > 0
      ? altoyObtain
      : MANUAL_UNAVAILABLE_GIDS.has(gid)
        ? [UNAVAILABLE_OBTAIN]
        : []
  const build = getBuildInfo(localShip, altoy)
  const mapDrops = getMapDrops(altoy)
  const difficulty = classifyDifficulty(obtain, build)
  const verification = {
    localKr: localKrObtain.length > 0,
    localResource: Boolean(localShip),
    altoy: Boolean(altoy),
    status: compareLists(localKrObtain, altoyObtain),
  }

  return {
    id: character.id,
    gid,
    name: character.name,
    rarity: character.rarity,
    faction: character.faction,
    shipType: character.shipType,
    obtain,
    obtainEn: build.localObtainEn,
    build: {
      light: build.light,
      heavy: build.heavy,
      special: build.special,
      limited: build.limited,
      timer: build.timer,
    },
    mapDrops,
    difficulty,
    verification,
  }
}

function summarize(records, altoySnapshots) {
  const summary = {
    generatedAt: new Date().toISOString(),
    total: records.length,
    withObtain: records.filter(record => record.obtain.length > 0).length,
    withoutObtain: records.filter(record => record.obtain.length === 0).length,
    verification: Object.fromEntries(
      [...new Set(records.map(record => record.verification.status))]
        .sort()
        .map(status => [status, records.filter(record => record.verification.status === status).length])
    ),
    difficulty: Object.fromEntries(
      [...new Set(records.map(record => record.difficulty.key))]
        .sort()
        .map(key => [key, records.filter(record => record.difficulty.key === key).length])
    ),
    altoySnapshots: Object.fromEntries(
      Object.entries(altoySnapshots).map(([file, snapshot]) => [file, {
        status: snapshot.status,
        path: path.relative(ROOT, snapshot.path).replaceAll(path.sep, '/'),
        error: snapshot.error || null,
      }])
    ),
  }

  return summary
}

const referenceDir = findReferenceDir()
if (!referenceDir) {
  throw new Error('참고용 원본 폴더를 찾지 못했습니다.')
}

const localShip = readJson(path.join(referenceDir, 'AzurLane', 'ship.json'))
const krGroup = readJson(path.join(referenceDir, 'AzurLaneData', 'KR', 'ShareCfg', 'ship_data_group.json'))
const altoySnapshots = await fetchAltoySnapshots(referenceDir)
const altoyFullData = Array.isArray(altoySnapshots['data/ship_info_data.json'].data)
  ? altoySnapshots['data/ship_info_data.json'].data
  : []

const sources = {
  localShipByGid: new Map(localShip.map(row => [Number(row.gid), row])),
  krGroupByGid: buildKrGroupByGid(krGroup),
  altoyByGid: new Map(altoyFullData.map(row => [Number(row.gid), row])),
}

const records = characters
  .map(character => buildRecord(character, sources))
  .sort((a, b) => a.gid - b.gid)

const output = {
  meta: {
    note: 'App-ready obtainability data generated from local reference files and cross-checked against ALtoy snapshots.',
    sources: {
      localKr: '참고용/AzurLaneData/KR/ShareCfg/ship_data_group.json',
      localResource: '참고용/AzurLane/ship.json',
      altoy: `${ALTOY_BASE_URL}/data/ship_info_data.json`,
    },
    ...summarize(records, altoySnapshots),
  },
  ships: records,
}

writeJson(OUTPUT_PATH, output)

console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}`)
console.log(JSON.stringify(output.meta, null, 2))
