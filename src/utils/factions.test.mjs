import assert from 'node:assert/strict'
import { getFactionOptions, normalizeFactionValue } from './factions.js'

assert.equal(normalizeFactionValue('유니온'), '유니온')
assert.equal(normalizeFactionValue('USS'), '유니온')
assert.equal(normalizeFactionValue('HMS'), '로열')
assert.equal(normalizeFactionValue('IJN'), '중앵')
assert.equal(normalizeFactionValue('KMS'), '철혈')
assert.equal(normalizeFactionValue('ROC'), '동황')
assert.equal(normalizeFactionValue('RN'), '사르데냐')
assert.equal(normalizeFactionValue('SN'), '노스유니온')
assert.equal(normalizeFactionValue('FFNF'), '아이리스')
assert.equal(normalizeFactionValue('MNF'), '비시아')
assert.equal(normalizeFactionValue('HNLMS'), '튤리퍼')
assert.equal(normalizeFactionValue('북방연합'), '노스유니온')
assert.equal(normalizeFactionValue('튤리파'), '튤리퍼')
assert.equal(normalizeFactionValue('칭송받는자'), '칭송받는자')

assert.deepEqual(
  getFactionOptions(['라이자', '중앵', '유니온', '기타', '로열']).map(o => o.label),
  ['모든 진영', '────────', '유니온 (USS)', '로열 (HMS)', '중앵 (IJN)', '기타', '라이자']
)

assert.equal(getFactionOptions(['라이자', '기타']).find(o => o.value === '__faction-divider').disabled, true)
