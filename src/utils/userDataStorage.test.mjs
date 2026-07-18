import assert from 'node:assert/strict'
import { loadUserDataFromStorage, saveUserDataToStorage } from './userDataStorage.js'

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)) }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem(key, value) { this.values.set(key, value) }
}

const key = 'azurlane-userdata'
const storage = new MemoryStorage({
  [key]: JSON.stringify({ 1: { acquired: '육성중', favorite: true } }),
})
const loaded = loadUserDataFromStorage(storage, key, new Date('2026-07-18T01:02:03.000Z'))
assert.equal(loaded.migrated, true)
assert.equal(loaded.fromVersion, 0)
assert.deepEqual(loaded.userData['1'], { acquired: '100', favorite: true })
assert.ok(storage.getItem(`${key}-recovery`), 'migration must preserve the previous raw value')
assert.equal(JSON.parse(storage.getItem(key)).schemaVersion, 2)

saveUserDataToStorage(storage, key, { 2: { acquired: '125' } }, new Date('2026-07-18T02:00:00.000Z'))
assert.deepEqual(JSON.parse(storage.getItem(key)).userData, { 2: { acquired: '125' } })

const corruptStorage = new MemoryStorage({ [key]: '{' })
const corrupt = loadUserDataFromStorage(corruptStorage, key, new Date('2026-07-18T03:00:00.000Z'))
assert.deepEqual(corrupt.userData, {})
assert.match(corrupt.error, /읽지 못했습니다/)
assert.equal(corruptStorage.getItem(`${key}-recovery`), '{')
assert.equal(corruptStorage.getItem(key), '{', 'failed migration must not overwrite the original')
