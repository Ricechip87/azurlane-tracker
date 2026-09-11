import assert from 'node:assert/strict'
import {
  buildExistingCharacterIndexes,
  selectExistingCharacter,
  assertKrRosterSourceReady,
  isKrConfirmedCharacter,
  assertExistingCharacterIdentitiesPreserved,
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

assert.equal(isKrConfirmedCharacter({ altoy: { gid: 30119 } }), true, 'ALtoy에 등장한 새 KR 함선은 CSV에서 편입')
assert.equal(isKrConfirmedCharacter({ existing: { id: 754, name: '타이거' } }), false, 'CSV에만 있는 미출시 행은 이전 생성물에 gid 없이 들어갔어도 제외')
assert.equal(isKrConfirmedCharacter({}), false, '확인되지 않은 신규 CSV 함선은 자동 편입하지 않음')
assert.equal(isKrConfirmedCharacter({ existing: { id: 'M060', gid: 970605 } }), true, '기존 유효 gid는 ALtoy의 일시 누락 때문에 삭제하지 않음')
assert.equal(isKrConfirmedCharacter({ altoy: { gid: 'invalid' }, existing: { gid: 0 } }), false, '무효 gid는 KR 편입 근거가 아님')

assert.throws(() => assertKrRosterSourceReady([]), /ALtoy/, 'ALtoy 누락·빈 원천에서는 기존 출력에 쓰기 전에 중단')
assert.throws(() => assertKrRosterSourceReady({}), /ALtoy/, 'ALtoy 원천 형식 검증')
assert.throws(() => assertKrRosterSourceReady([{ name: '아마츠카제' }]), /ALtoy/, 'gid 없는 ALtoy 행에서 잘못된 원천임을 알림')
assert.doesNotThrow(() => assertKrRosterSourceReady([{ gid: 30119, name: '아마츠카제' }]))

const established = [{ id: 'M060', gid: 970605, name: '엘베(META)' }, { id: 754, name: '타이거' }]
assert.doesNotThrow(() => assertExistingCharacterIdentitiesPreserved(established, [{ id: 'M060', gid: 970605, name: '엘베(META)' }]), 'gid 없는 미출시 행 제외는 기존 KR identity 삭제가 아님')
assert.throws(() => assertExistingCharacterIdentitiesPreserved(established, []), /970605/, 'CSV 원천 누락으로 기존 KR 함선이 사라지면 저장 전 중단')
assert.throws(() => assertExistingCharacterIdentitiesPreserved(established, [{ id: 'M064', gid: 970605 }]), /970605/, '기존 KR 함선의 사용자 보유 데이터 id가 바뀌면 중단')
assert.doesNotThrow(() => assertExistingCharacterIdentitiesPreserved(established, [{ id: 'M060', gid: 970605 }, { id: 753, gid: 30119 }]), '기존 identity를 보존한 신규 함선 편입은 허용')

console.log('character source identity tests passed')
