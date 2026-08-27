import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  LEGACY_REFERENCE_PATHS,
  MANAGED_REFERENCE_PATHS,
  cleanupLegacyReferenceData,
  installStagedReferenceData,
  rollbackReferenceTransactions,
  validateManagedReferencePath,
} from './reference-data-sync.mjs'

assert.deepEqual(MANAGED_REFERENCE_PATHS, [
  'AzurLaneData',
  'ALtoy/data',
  'AzurLaneLuaScripts',
  'AzurLane/ship.json',
  'AzurLane/skin.json',
  'AzurLane/skin_list.json',
  'AzurLane/ship_skin.json',
  'AzurLane/ship_skin_list.json',
  'AzurLane/version.json',
  '벽람 함순이도감 v2.1.8_배포용의 사본.xlsx',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - [ 메인시트.csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - [ 인식각성 추천표(메인해역).csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 인식각성 추천표(대작전).csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 맨땅뉴비 추천 함순이표.csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 1~9기 연구함 경험치작 정리.csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 1~9기 연구함 물자강화 장비 추가시점.csv',
  '벽람항로(일) - アズールレーン.xlsx',
  '벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv',
])

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-reference-sync-test-'))
const referenceRoot = path.join(testRoot, '참고용')
const stagedRoot = path.join(testRoot, 'staged')

try {
  write(path.join(referenceRoot, 'AzurLaneData/old.json'), 'old')
  write(path.join(referenceRoot, 'ALtoy/data/old.json'), 'old')
  write(path.join(referenceRoot, 'AzurLaneLuaScripts/old.lua'), 'old')
  write(path.join(referenceRoot, 'AzurLane/ship.json'), 'old')
  write(path.join(referenceRoot, 'AzurLane/skin.json'), 'old')
  write(path.join(referenceRoot, 'AzurLane/skin_list.json'), 'old')
  write(path.join(referenceRoot, 'AzurLane/ship_skin.json'), 'old')
  write(path.join(referenceRoot, 'AzurLane/ship_skin_list.json'), 'old')
  write(path.join(referenceRoot, 'AzurLane/version.json'), 'old')
  write(path.join(referenceRoot, 'AzurLane/images/keep.png'), 'keep')
  write(path.join(referenceRoot, '수동자료.xlsx'), 'keep')
  write(path.join(referenceRoot, '검산용.json'), 'keep')
  for (const relativePath of LEGACY_REFERENCE_PATHS) {
    write(path.join(referenceRoot, relativePath), 'legacy')
  }

  write(path.join(stagedRoot, 'AzurLaneData/new.json'), 'new')
  write(path.join(stagedRoot, 'ALtoy/data/new.json'), 'new')
  write(path.join(stagedRoot, 'AzurLaneLuaScripts/new.lua'), 'new')
  write(path.join(stagedRoot, 'AzurLane/ship.json'), 'new')
  for (const relativePath of MANAGED_REFERENCE_PATHS.slice(4)) {
    write(path.join(stagedRoot, relativePath), 'new')
  }

  installStagedReferenceData({ referenceRoot, stagedRoot })
  const removed = cleanupLegacyReferenceData(referenceRoot)

  assert.equal(fs.existsSync(path.join(referenceRoot, 'AzurLaneData/old.json')), false)
  assert.equal(fs.readFileSync(path.join(referenceRoot, 'AzurLaneData/new.json'), 'utf8'), 'new')
  assert.equal(fs.existsSync(path.join(referenceRoot, 'ALtoy/data/old.json')), false)
  assert.equal(fs.readFileSync(path.join(referenceRoot, 'ALtoy/data/new.json'), 'utf8'), 'new')
  assert.equal(fs.readFileSync(path.join(referenceRoot, 'AzurLane/images/keep.png'), 'utf8'), 'keep')
  assert.equal(fs.readFileSync(path.join(referenceRoot, '수동자료.xlsx'), 'utf8'), 'keep')
  assert.equal(fs.readFileSync(path.join(referenceRoot, '검산용.json'), 'utf8'), 'keep')
  assert.deepEqual(removed, LEGACY_REFERENCE_PATHS)
  for (const relativePath of LEGACY_REFERENCE_PATHS) {
    assert.equal(fs.existsSync(path.join(referenceRoot, relativePath)), false)
  }
} finally {
  fs.rmSync(testRoot, { recursive: true, force: true })
}

assert.throws(
  () => validateManagedReferencePath(referenceRoot, 'AzurLane/images'),
  /관리 대상/,
)
assert.throws(
  () => validateManagedReferencePath(referenceRoot, '../outside'),
  /관리 대상/,
)

const rollbackRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-reference-rollback-test-'))
try {
  const rollbackReferenceRoot = path.join(rollbackRoot, '참고용')
  const target = path.join(rollbackReferenceRoot, 'AzurLaneData')
  const backup = path.join(rollbackRoot, '.reference-sync-backup-test', 'AzurLaneData')
  write(path.join(target, 'new.json'), 'new')
  write(path.join(backup, 'old.json'), 'old')

  const restoreError = new Error('simulated restore failure')
  const fsApi = {
    ...fs,
    renameSync(source, destination) {
      if (source === backup && destination === target) throw restoreError
      return fs.renameSync(source, destination)
    },
  }
  const errors = rollbackReferenceTransactions([
    { target, backup, hadOriginal: true, installed: true },
  ], rollbackReferenceRoot, fsApi)

  assert.deepEqual(errors, [restoreError])
  assert.equal(fs.existsSync(target), false)
  assert.equal(fs.readFileSync(path.join(backup, 'old.json'), 'utf8'), 'old')
} finally {
  fs.rmSync(rollbackRoot, { recursive: true, force: true })
}

console.log('reference data sync tests passed')

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}
