import fs from 'node:fs'
import path from 'node:path'

const LOCK_NAME = '.reference-sync.lock'
const STAGE_PREFIX = '.reference-sync-stage-'
const BACKUP_PREFIX = '.reference-sync-backup-'

export function acquireReferenceSyncWorkspace({
  root,
  pid = process.pid,
  isPidRunning = defaultIsPidRunning,
}) {
  const resolvedRoot = path.resolve(root)
  const lockPath = path.join(resolvedRoot, LOCK_NAME)

  if (fs.existsSync(lockPath)) {
    const existingPid = Number.parseInt(fs.readFileSync(lockPath, 'utf8').trim(), 10)
    if (Number.isInteger(existingPid) && isPidRunning(existingPid)) {
      throw new Error(`참고용 원천 갱신이 이미 실행 중입니다 (PID ${existingPid}).`)
    }
    fs.rmSync(lockPath)
  }

  const lock = fs.openSync(lockPath, 'wx')
  let temporaryRoot
  try {
    fs.writeFileSync(lock, String(pid), 'utf8')

    const backups = listDirectories(resolvedRoot, BACKUP_PREFIX)
    if (backups.length) {
      throw new Error(`이전 실패의 복구용 백업이 남아 있습니다. 자동 삭제하지 않습니다: ${backups.join(', ')}`)
    }

    for (const staleStage of listDirectories(resolvedRoot, STAGE_PREFIX)) {
      removeExactChildDirectory(resolvedRoot, staleStage, STAGE_PREFIX)
    }
    temporaryRoot = fs.mkdtempSync(path.join(resolvedRoot, `${STAGE_PREFIX}${pid}-`))
  } catch (error) {
    fs.closeSync(lock)
    if (fs.existsSync(lockPath)) fs.rmSync(lockPath)
    throw error
  }

  let released = false
  return {
    temporaryRoot,
    release() {
      if (released) return
      released = true
      removeExactChildDirectory(resolvedRoot, temporaryRoot, STAGE_PREFIX)
      fs.closeSync(lock)
      if (fs.existsSync(lockPath) && fs.readFileSync(lockPath, 'utf8').trim() === String(pid)) {
        fs.rmSync(lockPath)
      }
    },
  }
}

function listDirectories(root, prefix) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith(prefix))
    .map(entry => path.join(root, entry.name))
}

function removeExactChildDirectory(root, target, prefix) {
  const resolvedRoot = path.resolve(root)
  const resolvedTarget = path.resolve(target)
  if (path.dirname(resolvedTarget) !== resolvedRoot || !path.basename(resolvedTarget).startsWith(prefix)) {
    throw new Error(`동기화 임시 경로 안전 검증 실패: ${resolvedTarget}`)
  }
  if (fs.existsSync(resolvedTarget)) fs.rmSync(resolvedTarget, { recursive: true, force: true })
}

function defaultIsPidRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}
