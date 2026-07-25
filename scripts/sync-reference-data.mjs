import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  MANAGED_REFERENCE_PATHS,
  cleanupLegacyReferenceData,
  installStagedReferenceData,
} from './lib/reference-data-sync.mjs'
import { acquireReferenceSyncWorkspace } from './lib/reference-sync-workspace.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const referenceRoot = path.join(root, '참고용')
const workspace = acquireReferenceSyncWorkspace({ root })
const temporaryRoot = workspace.temporaryRoot
const stagedRoot = path.join(temporaryRoot, 'staged')
const records = []

const guideSheetId = '162NmcpaC-BmmBN-elnPuY8aV1zwR2LVzwNWX3MeBKXo'
const techSheetId = '1R5u6fgr3e6XvfqQ3_GMuroeNfe2ShiY65akzzwDnwTs'
const googleExport = (sheetId, query) => `https://docs.google.com/spreadsheets/d/${sheetId}/export?${query}`
const googleCsvByName = (sheetId, sheetName) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`

const downloads = [
  {
    id: 'altoy-lite',
    url: 'https://jforplay.github.io/altoy/data/ship_info_lite.json',
    relativePath: 'ALtoy/data/ship_info_lite.json',
    type: 'json',
  },
  {
    id: 'altoy-full',
    url: 'https://jforplay.github.io/altoy/data/ship_info_data.json',
    relativePath: 'ALtoy/data/ship_info_data.json',
    type: 'json',
  },
  {
    id: 'fernando-ships',
    url: 'https://raw.githubusercontent.com/Fernando2603/AzurLane/main/ship.json',
    relativePath: 'AzurLane/ship.json',
    type: 'json',
  },
  ...['CN', 'EN', 'JP', 'KR', 'TW'].map(region => ({
    id: `${region.toLowerCase()}-fleet-tech-lua`,
    url: `https://raw.githubusercontent.com/AzurLaneTools/AzurLaneLuaScripts/main/${region}/sharecfg/fleet_tech_ship_template.lua`,
    relativePath: `AzurLaneLuaScripts/${region}/sharecfg/fleet_tech_ship_template.lua`,
    type: 'lua',
    expectedText: 'fleet_tech_ship_template',
  })),
  {
    id: 'kr-ship-data-group-lua',
    url: 'https://raw.githubusercontent.com/AzurLaneTools/AzurLaneLuaScripts/main/KR/sharecfg/ship_data_group.lua',
    relativePath: 'AzurLaneLuaScripts/KR/sharecfg/ship_data_group.lua',
    type: 'lua',
    expectedText: 'ship_data_group',
  },
  {
    id: 'kr-blueprint-lua',
    url: 'https://raw.githubusercontent.com/AzurLaneTools/AzurLaneLuaScripts/main/KR/sharecfg/ship_data_blueprint.lua',
    relativePath: 'AzurLaneLuaScripts/KR/sharecfg/ship_data_blueprint.lua',
    type: 'lua',
    expectedText: 'ship_data_blueprint',
  },
  {
    id: 'kr-research-task-lua',
    url: 'https://raw.githubusercontent.com/AzurLaneTools/AzurLaneLuaScripts/main/KR/sharecfgdata/task_data_template.lua',
    relativePath: 'AzurLaneLuaScripts/KR/sharecfgdata/task_data_template.lua',
    type: 'lua',
    expectedText: 'task_data_template',
  },
  {
    id: 'growth-guide-workbook',
    url: googleExport(guideSheetId, 'format=xlsx'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본.xlsx',
    type: 'xlsx',
  },
  {
    id: 'growth-main-sheet',
    url: googleExport(guideSheetId, 'format=csv&gid=438662354'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본 - [ 메인시트.csv',
    type: 'csv',
  },
  {
    id: 'growth-main-sea',
    url: googleExport(guideSheetId, 'format=csv&gid=1100559522'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본 - [ 인식각성 추천표(메인해역).csv',
    type: 'csv',
  },
  {
    id: 'growth-operation-siren',
    url: googleCsvByName(guideSheetId, '인식각성 추천표(대작전)'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본 - 인식각성 추천표(대작전).csv',
    type: 'csv',
  },
  {
    id: 'growth-new-player',
    url: googleCsvByName(guideSheetId, '맨땅뉴비 추천 함순이표'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본 - 맨땅뉴비 추천 함순이표.csv',
    type: 'csv',
  },
  {
    id: 'research-exp',
    url: googleExport(guideSheetId, 'format=csv&gid=838613390'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본 - 1~9기 연구함 경험치작 정리.csv',
    type: 'csv',
  },
  {
    id: 'research-strengthening',
    url: googleExport(guideSheetId, 'format=csv&gid=1660629242'),
    relativePath: '벽람 함순이도감 v2.1.8_배포용의 사본 - 1~9기 연구함 물자강화 장비 추가시점.csv',
    type: 'csv',
  },
  {
    id: 'fleet-tech-workbook',
    url: googleExport(techSheetId, 'format=xlsx'),
    relativePath: '벽람항로(일) - アズールレーン.xlsx',
    type: 'xlsx',
  },
  {
    id: 'fleet-tech-ship-score',
    url: googleExport(techSheetId, 'format=csv&gid=1194876348'),
    relativePath: '벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv',
    type: 'csv',
  },
]

try {
  fs.mkdirSync(stagedRoot, { recursive: true })
  const clone = await cloneAzurLaneData()
  records.push(clone)

  await mapLimit(downloads, 5, async source => {
    records.push(await downloadSource(source))
  })

  validateStagedData()
  installStagedReferenceData({ referenceRoot, stagedRoot })
  const removedLegacyPaths = cleanupLegacyReferenceData(referenceRoot)
  writeReport({ removedLegacyPaths })

  console.log(`참고용 원천 갱신 완료: ${MANAGED_REFERENCE_PATHS.length}개 관리 경로`)
  console.log(`구형 중간 자료 정리: ${removedLegacyPaths.length}개`)
} finally {
  workspace.release()
}

async function cloneAzurLaneData() {
  const destination = path.join(stagedRoot, 'AzurLaneData')
  const url = 'https://github.com/AzurLaneTools/AzurLaneData.git'
  await run('git', ['clone', '--depth', '1', '--single-branch', url, destination])
  const commit = readGitHead(destination)
  fs.rmSync(path.join(destination, '.git'), { recursive: true, force: true })
  return {
    id: 'azurlane-data',
    url,
    relativePath: 'AzurLaneData',
    commit,
  }
}

function readGitHead(repository) {
  const gitDirectory = path.join(repository, '.git')
  const head = fs.readFileSync(path.join(gitDirectory, 'HEAD'), 'utf8').trim()
  if (!head.startsWith('ref: ')) return head
  const reference = head.slice(5)
  const looseReference = path.join(gitDirectory, reference)
  if (fs.existsSync(looseReference)) return fs.readFileSync(looseReference, 'utf8').trim()

  const packedRefs = fs.readFileSync(path.join(gitDirectory, 'packed-refs'), 'utf8')
  const match = packedRefs.split(/\r?\n/).find(line => line.endsWith(` ${reference}`))
  if (!match) throw new Error(`AzurLaneData 커밋을 확인할 수 없습니다: ${reference}`)
  return match.split(' ')[0]
}

async function downloadSource(source) {
  const destination = path.join(stagedRoot, source.relativePath)
  const response = await fetch(source.url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
    headers: {
      'cache-control': 'no-cache',
      'user-agent': 'azurlane-tracker-reference-sync',
    },
  })
  if (!response.ok) {
    throw new Error(`${source.id}: HTTP ${response.status} (${source.url})`)
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  validateDownloadedBytes(source, bytes)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, bytes)
  console.log(`받음: ${source.id} (${bytes.byteLength.toLocaleString()} bytes)`)
  return {
    id: source.id,
    url: source.url,
    relativePath: source.relativePath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  }
}

function validateDownloadedBytes(source, bytes) {
  if (bytes.byteLength < 16) throw new Error(`${source.id}: 내려받은 파일이 비어 있거나 너무 작습니다.`)
  if (source.type === 'xlsx') {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new Error(`${source.id}: XLSX ZIP 헤더가 아닙니다.`)
    }
    return
  }

  const text = new TextDecoder().decode(bytes)
  if (/^\s*<!doctype html|^\s*<html/i.test(text)) {
    throw new Error(`${source.id}: 데이터 대신 HTML 응답을 받았습니다.`)
  }
  if (source.type === 'json') JSON.parse(text)
  if (source.type === 'csv' && !text.includes(',')) {
    throw new Error(`${source.id}: CSV 열 구분자가 없습니다.`)
  }
  if (source.type === 'lua' && source.expectedText && !text.includes(source.expectedText)) {
    throw new Error(`${source.id}: 함선 기술 Lua 형식이 아닙니다.`)
  }
}

function validateStagedData() {
  for (const relativePath of MANAGED_REFERENCE_PATHS) {
    const source = path.join(stagedRoot, relativePath)
    if (!fs.existsSync(source)) throw new Error(`필수 원천 누락: ${relativePath}`)
  }

  const full = readJson('ALtoy/data/ship_info_data.json')
  const lite = readJson('ALtoy/data/ship_info_lite.json')
  if (!Array.isArray(full) || !Array.isArray(lite) || full.length < 800 || full.length !== lite.length) {
    throw new Error(`ALtoy 함선 수 검증 실패: full ${full.length}, lite ${lite.length}`)
  }

  const fernando = readJson('AzurLane/ship.json')
  if (!Array.isArray(fernando) || fernando.length < 700) {
    throw new Error(`Fernando 함선 목록 검증 실패: ${fernando.length}`)
  }

  for (const region of ['CN', 'EN', 'JP', 'KR', 'TW']) {
    for (const filename of [
      'fleet_tech_group.json',
      'fleet_tech_ship_template.json',
      'fleet_tech_template.json',
      'ship_data_group.json',
    ]) {
      readJson(`AzurLaneData/${region}/ShareCfg/${filename}`)
    }
  }

  const nestedGit = findNestedGitDirectories(path.join(stagedRoot, 'AzurLaneData'))
  if (nestedGit.length) throw new Error(`중첩 Git 메타데이터가 남아 있습니다: ${nestedGit.join(', ')}`)
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(stagedRoot, relativePath), 'utf8'))
}

function findNestedGitDirectories(directory) {
  const found = []
  const stack = [directory]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const child = path.join(current, entry.name)
      if (entry.name === '.git') found.push(child)
      else stack.push(child)
    }
  }
  return found
}

function writeReport({ removedLegacyPaths }) {
  const report = {
    generatedAt: new Date().toISOString(),
    policy: {
      data: '원격 원천을 임시 경로에서 전부 검증한 뒤 자동 관리 경로만 교체',
      images: '별도 이미지 동기화에서 기존 파일을 보존하고 누락 파일만 추가',
      preserved: ['참고용/AzurLane/images', '참고용/검산용.json', '자동 관리 목록 밖의 사용자 자료'],
    },
    installedPaths: MANAGED_REFERENCE_PATHS,
    removedLegacyPaths,
    sources: records.sort((a, b) => a.id.localeCompare(b.id)),
  }
  const output = path.join(root, 'reports/data-sources/reference-sync.json')
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

async function run(command, args, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    })
    let stdout = ''
    if (options.capture) child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`${command} ${args.join(' ')} 실패 (종료 코드 ${code})`))
    })
  })
}

async function mapLimit(items, limit, worker) {
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await worker(item)
    }
  }))
}
