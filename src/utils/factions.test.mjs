import assert from 'node:assert/strict'
import { getFactionBadgeName, getFactionDisplayName, getFactionDisplayText, getFactionOptions, getFactionSortIndex, normalizeFactionValue } from './factions.js'

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
assert.equal(normalizeFactionValue('MOT'), '템페스타')
assert.equal(normalizeFactionValue('Tempesta'), '템페스타')
assert.equal(normalizeFactionValue('LDP'), '페드레리아')
assert.equal(normalizeFactionValue('Liga de Pedrería'), '페드레리아')
assert.equal(normalizeFactionValue('Liga de Pedreria'), '페드레리아')
assert.equal(normalizeFactionValue('屠龙联盟'), '페드레리아')
assert.equal(normalizeFactionValue('이글 유니온'), '유니온')
assert.equal(normalizeFactionValue('로열 네이비'), '로열')
assert.equal(normalizeFactionValue('노스 유니온'), '노스유니온')
assert.equal(normalizeFactionValue('이스트 글림'), '동황')
assert.equal(normalizeFactionValue('PRAN'), '동황')
assert.equal(normalizeFactionValue('아이리스 리브레'), '아이리스')
assert.equal(normalizeFactionValue('튤리퍼 왕국'), '튤리퍼')
assert.equal(normalizeFactionValue('메탈 블러드'), '철혈')
assert.equal(normalizeFactionValue('사쿠라 엠파이어'), '중앵')
assert.equal(normalizeFactionValue('비시아 성좌'), '비시아')
assert.equal(normalizeFactionValue('사르데냐 엠파이어'), '사르데냐')
assert.equal(normalizeFactionValue('북방연합'), '노스유니온')
assert.equal(normalizeFactionValue('튤리파'), '튤리퍼')
assert.equal(normalizeFactionValue('칭송받는자'), '칭송받는자')

assert.equal(getFactionDisplayName('유니온'), '이글 유니온')
assert.equal(getFactionDisplayName('USS'), '이글 유니온')
assert.equal(getFactionDisplayName('노스유니온'), '노스 유니온')
assert.equal(getFactionDisplayName('SN'), '노스 유니온')
assert.equal(getFactionDisplayName('로열'), '로열')
assert.equal(getFactionBadgeName('유니온'), 'USS')
assert.equal(getFactionBadgeName('USS'), 'USS')
assert.equal(getFactionBadgeName('노스유니온'), 'SN')
assert.equal(getFactionBadgeName('로열'), 'HMS')
assert.equal(getFactionBadgeName('페드레리아'), 'LDP')
assert.equal(getFactionBadgeName('LDP'), 'LDP')
assert.equal(getFactionBadgeName('템페스타'), 'MOT')
assert.equal(getFactionBadgeName('MOT'), 'MOT')
assert.equal(getFactionDisplayText('유니온 점수 / 노스유니온 조합'), '이글 유니온 점수 / 노스 유니온 조합')
assert.equal(getFactionDisplayText('이글 유니온 또는 노스 유니온'), '이글 유니온 또는 노스 유니온')
assert.equal(getFactionDisplayText('MOT / LDP'), '템페스타 / 페드레리아')
assert.equal(getFactionDisplayText('Liga de Pedrería'), '페드레리아')
assert.equal(getFactionDisplayText('MOT São Martinho'), 'MOT São Martinho')
assert.ok(getFactionSortIndex('HNLMS') < getFactionSortIndex('LDP'))
assert.ok(getFactionSortIndex('LDP') < getFactionSortIndex('META'))
assert.ok(getFactionSortIndex('META') < getFactionSortIndex('MOT'))

assert.deepEqual(
  getFactionOptions(['라이자', '중앵', '유니온', '기타', '로열']).map(o => o.label),
  ['모든 진영', '────────', '이글 유니온 (USS)', '로열 (HMS)', '중앵 (IJN)', '기타', '────────', '라이자']
)

assert.equal(
  getFactionOptions(['노스유니온']).find(o => o.value === '노스유니온').label,
  '노스 유니온 (SN)'
)
assert.equal(
  getFactionOptions(['페드레리아']).find(o => o.value === '페드레리아').label,
  '페드레리아 (LDP)'
)
assert.equal(
  getFactionOptions(['MOT']).find(o => o.value === '템페스타').label,
  '템페스타 (MOT)'
)

assert.equal(getFactionOptions(['라이자', '기타']).find(o => o.value === '__faction-primary-divider').disabled, true)
assert.equal(getFactionOptions(['라이자', '기타']).find(o => o.value === '__faction-collab-divider').disabled, true)

assert.deepEqual(
  getFactionOptions(['HNLMS', 'LDP', 'META', 'MOT', '기타'])
    .filter(option => !option.disabled && option.value !== '전체')
    .map(option => [option.value, option.label]),
  [
    ['튤리퍼', '튤리퍼 (HNLMS)'],
    ['페드레리아', '페드레리아 (LDP)'],
    ['META', 'META'],
    ['템페스타', '템페스타 (MOT)'],
    ['기타', '기타'],
  ],
)
