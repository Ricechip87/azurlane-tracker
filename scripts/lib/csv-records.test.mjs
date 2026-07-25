import assert from 'node:assert/strict'
import { parseCsvRecords } from './csv-records.mjs'

const records = parseCsvRecords(
  '1,A,,함선,SSR,구축,,,,,,,,"첫 줄\n둘째 줄",7,"구축, 잠수"\r\n' +
  '2,B,,다음 함선,SR,경순,,,,,,,,,0,경순\r\n',
)

assert.equal(records.length, 2)
assert.equal(records[0][3], '함선')
assert.equal(records[0][13], '첫 줄\n둘째 줄')
assert.equal(records[0][14], '7')
assert.equal(records[0][15], '구축, 잠수')
assert.equal(records[1][3], '다음 함선')
assert.throws(() => parseCsvRecords('1,A,"닫히지 않은 값'), /닫히지 않은/)

console.log('CSV record parser tests passed')
