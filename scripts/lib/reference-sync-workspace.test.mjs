import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { acquireReferenceSyncWorkspace } from './reference-sync-workspace.mjs'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-sync-workspace-test-'))
try {
  fs.writeFileSync(path.join(root, '.reference-sync.lock'), '999999')
  fs.mkdirSync(path.join(root, '.reference-sync-stage-stale'), { recursive: true })

  const workspace = acquireReferenceSyncWorkspace({
    root,
    pid: 12345,
    isPidRunning: () => false,
  })
  assert.equal(fs.existsSync(path.join(root, '.reference-sync-stage-stale')), false)
  assert.equal(fs.existsSync(workspace.temporaryRoot), true)
  workspace.release()
  assert.equal(fs.existsSync(workspace.temporaryRoot), false)
  assert.equal(fs.existsSync(path.join(root, '.reference-sync.lock')), false)

  fs.writeFileSync(path.join(root, '.reference-sync.lock'), '54321')
  assert.throws(
    () => acquireReferenceSyncWorkspace({ root, pid: 12345, isPidRunning: () => true }),
    /이미 실행 중/,
  )
  fs.rmSync(path.join(root, '.reference-sync.lock'))

  const backup = path.join(root, '.reference-sync-backup-54321')
  fs.mkdirSync(backup)
  assert.throws(
    () => acquireReferenceSyncWorkspace({ root, pid: 12345, isPidRunning: () => false }),
    /복구용 백업/,
  )
  assert.equal(fs.existsSync(backup), true)
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}

console.log('reference sync workspace tests passed')
