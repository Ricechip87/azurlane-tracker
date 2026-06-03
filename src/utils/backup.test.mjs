import assert from 'node:assert/strict'
import { createBackup, parseBackup } from './backup.js'

const userData = {
  1: { acquired: '획득', favorite: true, comment: 'priority' },
  2: { skilled: '스작 완료' },
}

const backup = createBackup(userData, new Date('2026-06-04T00:00:00.000Z'))

assert.equal(backup.app, 'azurlane-growth-optimizer')
assert.equal(backup.schemaVersion, 1)
assert.equal(backup.exportedAt, '2026-06-04T00:00:00.000Z')
assert.deepEqual(parseBackup(JSON.stringify(backup)), userData)

assert.throws(
  () => parseBackup('{'),
  /JSON 파일 형식/
)

assert.throws(
  () => parseBackup(JSON.stringify({ app: 'other', schemaVersion: 1, userData: {} })),
  /이 앱에서 만든 백업 파일/
)

assert.throws(
  () => parseBackup(JSON.stringify({ app: 'azurlane-growth-optimizer', schemaVersion: 999, userData: {} })),
  /지원하지 않는 백업 버전/
)
