import fs from 'node:fs'
import path from 'node:path'

export const MANAGED_REFERENCE_PATHS = [
  'AzurLaneData',
  'ALtoy/data',
  'AzurLaneLuaScripts',
  'AzurLane/ship.json',
  '벽람 함순이도감 v2.1.8_배포용의 사본.xlsx',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - [ 메인시트.csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - [ 인식각성 추천표(메인해역).csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 인식각성 추천표(대작전).csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 맨땅뉴비 추천 함순이표.csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 1~9기 연구함 경험치작 정리.csv',
  '벽람 함순이도감 v2.1.8_배포용의 사본 - 1~9기 연구함 물자강화 장비 추가시점.csv',
  '벽람항로(일) - アズールレーン.xlsx',
  '벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv',
]

export const LEGACY_REFERENCE_PATHS = [
  '벽람항로(일) - アズールレーン - 목록 체크용.csv',
  '전체 캐릭터 목록.xlsx',
  '기초 데이터 입력 끝.json',
]

const managedReferencePathSet = new Set(MANAGED_REFERENCE_PATHS)
const legacyReferencePathSet = new Set(LEGACY_REFERENCE_PATHS)

export function validateManagedReferencePath(referenceRoot, relativePath) {
  if (!managedReferencePathSet.has(relativePath)) {
    throw new Error(`자동 관리 대상이 아닌 참고용 경로입니다: ${relativePath}`)
  }

  const resolvedRoot = path.resolve(referenceRoot)
  const resolvedTarget = path.resolve(resolvedRoot, relativePath)
  if (!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`참고용 관리 대상 경계를 벗어났습니다: ${relativePath}`)
  }
  return resolvedTarget
}

export function installStagedReferenceData({ referenceRoot, stagedRoot }) {
  const resolvedStagedRoot = path.resolve(stagedRoot)
  const backupRoot = path.join(path.dirname(path.resolve(referenceRoot)), `.reference-sync-backup-${process.pid}`)
  const installed = []
  let canRemoveBackup = false

  for (const relativePath of MANAGED_REFERENCE_PATHS) {
    const staged = path.resolve(resolvedStagedRoot, relativePath)
    if (!staged.startsWith(`${resolvedStagedRoot}${path.sep}`) || !fs.existsSync(staged)) {
      throw new Error(`검증된 스테이징 원천이 없습니다: ${relativePath}`)
    }
  }

  try {
    for (const relativePath of MANAGED_REFERENCE_PATHS) {
      const target = validateManagedReferencePath(referenceRoot, relativePath)
      const staged = path.resolve(resolvedStagedRoot, relativePath)
      const backup = path.resolve(backupRoot, relativePath)
      const hadOriginal = fs.existsSync(target)

      if (hadOriginal) {
        fs.mkdirSync(path.dirname(backup), { recursive: true })
        fs.renameSync(target, backup)
      }

      const transaction = { target, backup, hadOriginal, installed: false }
      installed.push(transaction)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.renameSync(staged, target)
      transaction.installed = true
    }
    canRemoveBackup = true
  } catch (error) {
    const rollbackErrors = rollbackReferenceTransactions(installed, referenceRoot)
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `참고용 교체와 롤백이 모두 실패했습니다. 복구용 백업을 보존합니다: ${backupRoot}`,
      )
    }
    canRemoveBackup = true
    throw error
  } finally {
    if (canRemoveBackup && fs.existsSync(backupRoot)) {
      fs.rmSync(backupRoot, { recursive: true, force: true })
    }
  }
}

export function rollbackReferenceTransactions(installed, referenceRoot, fsApi = fs) {
  const errors = []
  for (const { target, backup, hadOriginal, installed: wasInstalled } of [...installed].reverse()) {
    if (wasInstalled) {
      try {
        removeManagedPath(target, referenceRoot, fsApi)
      } catch (error) {
        errors.push(error)
      }
    }
    if (hadOriginal && fsApi.existsSync(backup)) {
      try {
        fsApi.mkdirSync(path.dirname(target), { recursive: true })
        fsApi.renameSync(backup, target)
      } catch (error) {
        errors.push(error)
      }
    }
  }
  return errors
}

export function cleanupLegacyReferenceData(referenceRoot) {
  const removed = []
  for (const relativePath of LEGACY_REFERENCE_PATHS) {
    if (!legacyReferencePathSet.has(relativePath)) {
      throw new Error(`자동 정리 대상이 아닌 참고용 경로입니다: ${relativePath}`)
    }
    const target = resolveWithinReferenceRoot(referenceRoot, relativePath)
    if (!fs.existsSync(target)) continue
    if (fs.statSync(target).isDirectory()) {
      throw new Error(`구형 참고 자료 정리는 파일만 허용합니다: ${relativePath}`)
    }
    fs.rmSync(target)
    removed.push(relativePath)
  }
  return removed
}

function removeManagedPath(target, referenceRoot, fsApi = fs) {
  const resolvedTarget = resolveWithinReferenceRoot(referenceRoot, path.relative(referenceRoot, target))
  if (fsApi.existsSync(resolvedTarget)) fsApi.rmSync(resolvedTarget, { recursive: true, force: true })
}

function resolveWithinReferenceRoot(referenceRoot, relativePath) {
  const resolvedRoot = path.resolve(referenceRoot)
  const resolvedTarget = path.resolve(resolvedRoot, relativePath)
  if (!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`참고용 경계를 벗어난 삭제를 차단했습니다: ${resolvedTarget}`)
  }
  return resolvedTarget
}
