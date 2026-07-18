import assert from 'node:assert/strict'
import { normalizeConstructionSources } from './construction-sources.mjs'

assert.deepEqual(normalizeConstructionSources([
  '대형함 상시 건조',
  '대형함 건조',
  '중형함 건조、특형함 건조',
  '대형함 건조·특형함 건조',
  '소형함 건조',
]), [
  '중형함 상시 건조',
  '특형함 상시 건조',
  '소형함 상시 건조',
])

assert.deepEqual(normalizeConstructionSources([
  '작전문서 드랍',
  '이벤트: 쉼표, 포함 이름',
]), [
  '작전문서 드랍',
  '이벤트: 쉼표, 포함 이름',
], '건조가 아닌 입수처 문구는 분리하거나 변경하지 않는다')

console.log('construction-source tests passed')
