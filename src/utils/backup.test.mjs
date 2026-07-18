import assert from 'node:assert/strict'
import { createBackup, parseBackup, parseBackupWithMetadata } from './backup.js'

const userData = {
  1: { acquired: '획득', favorite: true, comment: 'priority' },
  2: { skilled: '스작 완료' },
}

const backup = createBackup(userData, new Date('2026-06-04T00:00:00.000Z'))

assert.equal(backup.app, 'azurlane-tracker')
assert.equal(backup.schemaVersion, 2)
assert.equal(backup.exportedAt, '2026-06-04T00:00:00.000Z')
assert.deepEqual(parseBackup(JSON.stringify(backup)), userData)

const migratedV1 = parseBackupWithMetadata(JSON.stringify({
  app: 'azurlane-growth-optimizer',
  schemaVersion: 1,
  exportedAt: '2026-06-04T00:00:00.000Z',
  userData: { 1: { acquired: '육성중', remodeled: 'O' } },
}))
assert.equal(migratedV1.migrated, true)
assert.equal(migratedV1.fromVersion, 1)
assert.deepEqual(migratedV1.userData, { 1: { acquired: '100', remodeled: '개장' } })

assert.deepEqual(
  parseBackup(JSON.stringify({ 2: { acquired: '125', favorite: true } })),
  { 2: { acquired: '125', favorite: true } },
)

assert.throws(
  () => parseBackup('{'),
  /JSON 파일 형식/
)

assert.throws(
  () => parseBackup(JSON.stringify({ app: 'other', schemaVersion: 1, userData: {} })),
  /이 앱에서 만든 백업 파일/
)

assert.throws(
  () => parseBackup(JSON.stringify({ app: 'azurlane-tracker', schemaVersion: 999, userData: {} })),
  /더 최신 버전/
)
