import assert from 'node:assert/strict'
import {
  createUserDataEnvelope,
  migrateUserDataEnvelope,
  USER_DATA_APP,
  USER_DATA_SCHEMA_VERSION,
} from './userDataSchema.js'

const legacyRaw = {
  1: { acquired: '육성중', remodeled: 'O', favorite: true },
  M062: { acquired: '125', comment: 'keep this memo', favorite: 'future-value' },
}
const migratedRaw = migrateUserDataEnvelope(legacyRaw)
assert.equal(migratedRaw.fromVersion, 0)
assert.equal(migratedRaw.migrated, true)
assert.equal(migratedRaw.envelope.app, USER_DATA_APP)
assert.equal(migratedRaw.envelope.schemaVersion, USER_DATA_SCHEMA_VERSION)
assert.deepEqual(migratedRaw.envelope.userData['1'], {
  acquired: '100',
  remodeled: '개장',
  favorite: true,
})
assert.equal(migratedRaw.envelope.userData.M062.comment, 'keep this memo')
assert.equal(migratedRaw.envelope.userData.M062.favorite, 'future-value')

const backupV1 = {
  app: 'azurlane-growth-optimizer',
  schemaVersion: 1,
  exportedAt: '2026-06-04T00:00:00.000Z',
  userData: { 2: { acquired: '육성 완료', remodeled: 'X' } },
}
const migratedV1 = migrateUserDataEnvelope(backupV1)
assert.equal(migratedV1.fromVersion, 1)
assert.equal(migratedV1.migrated, true)
assert.deepEqual(migratedV1.envelope.userData['2'], {
  acquired: '120',
  remodeled: '미개장',
})

const current = createUserDataEnvelope({ 3: { acquired: '풀돌' } }, new Date('2026-07-18T00:00:00.000Z'))
const currentResult = migrateUserDataEnvelope(current)
assert.equal(currentResult.fromVersion, USER_DATA_SCHEMA_VERSION)
assert.equal(currentResult.migrated, false)
assert.deepEqual(currentResult.envelope, current)

assert.throws(
  () => migrateUserDataEnvelope({ app: USER_DATA_APP, schemaVersion: 999, userData: {} }),
  /더 최신 버전/
)
assert.throws(
  () => migrateUserDataEnvelope({ app: USER_DATA_APP, schemaVersion: 1, userData: [] }),
  /사용자 데이터/
)
