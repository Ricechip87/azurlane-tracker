import assert from 'node:assert/strict'
import {
  buildExistingCharacterIndexes,
  selectExistingCharacter,
} from './character-source-identity.mjs'

const existing = [
  { id: 'M060', name: '엘베(META)', gid: 970605 },
  { id: 'M061', name: '쾨니히스베르크(META)', gid: 970212 },
]
const indexes = buildExistingCharacterIndexes(existing)

assert.equal(
  selectExistingCharacter(indexes, { id: 'M060', name: '쾨니히스베르크(META)' }).gid,
  970212,
)
assert.equal(
  selectExistingCharacter(indexes, { id: 'M061', name: '엘베·META' }).gid,
  970605,
)
assert.deepEqual(
  selectExistingCharacter(indexes, { id: 'M099', name: '새 함선' }),
  {},
)

console.log('character source identity tests passed')
