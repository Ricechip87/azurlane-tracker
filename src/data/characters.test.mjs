import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import characters from './characters.json' with { type: 'json' }

const expectedCharacters = [
  {
    id: 'P043',
    name: '던컨',
    gid: 29906,
    shipType: '순전',
    faction: '로열',
    techPoints: { acquired: 26, maxLB: 52, lv120: 39 },
    statAcquired: { shipTypes: ['순전', '전함', '항전'], stat: '내구', value: 2 },
    stat120: { shipTypes: ['순전', '전함', '항전'], stat: '화력', value: 1 },
    iconFile: '299060.png',
  },
  {
    id: 'P044',
    name: '타카하시',
    gid: 39908,
    shipType: '경순',
    faction: '중앵',
    techPoints: { acquired: 16, maxLB: 33, lv120: 25 },
    statAcquired: { shipTypes: ['경순'], stat: '대공', value: 1 },
    stat120: { shipTypes: ['경순'], stat: '뇌격', value: 1 },
    iconFile: '399080.png',
  },
  {
    id: 'P045',
    name: '막스 임멜만',
    gid: 49911,
    shipType: '항모',
    faction: '철혈',
    techPoints: { acquired: 62, maxLB: 124, lv120: 92 },
    statAcquired: { shipTypes: ['경항모', '항모'], stat: '내구', value: 1 },
    stat120: { shipTypes: ['경항모', '항모'], stat: '항공', value: 2 },
    iconFile: '499110.png',
  },
  {
    id: 'P046',
    name: '오라주',
    gid: 89905,
    shipType: '구축',
    faction: '아이리스',
    techPoints: { acquired: 18, maxLB: 36, lv120: 26 },
    statAcquired: { shipTypes: ['구축'], stat: '내구', value: 1 },
    stat120: { shipTypes: ['구축'], stat: '뇌격', value: 1 },
    iconFile: '899050.png',
  },
  {
    id: 'P047',
    name: '발파라이소',
    gid: 129901,
    shipType: '전함',
    faction: '페드레리아',
    techPoints: { acquired: 56, maxLB: 114, lv120: 86 },
    statAcquired: { shipTypes: ['순전', '전함', '항전'], stat: '내구', value: 2 },
    stat120: { shipTypes: ['순전', '전함', '항전'], stat: '명중', value: 1 },
    iconFile: '1299010.png',
  },
  {
    id: 'M062',
    name: '브리스톨(META)',
    gid: 970112,
    shipType: '구축',
    faction: 'META',
    techPoints: { acquired: 13, maxLB: 26, lv120: 19 },
    statAcquired: { shipTypes: ['구축'], stat: '화력', value: 1 },
    stat120: { shipTypes: ['구축'], stat: '내구', value: 2 },
    iconFile: '9701120.png',
  },
  {
    id: 'Z161',
    name: 'A2',
    gid: 1170001,
    shipType: '중순',
    faction: '니어',
    techPoints: { acquired: 0, maxLB: 0, lv120: 0 },
    statAcquired: { shipTypes: [], stat: '', value: 0 },
    stat120: { shipTypes: [], stat: '', value: 0 },
    iconFile: '11700010.png',
  },
  {
    id: 'Z162',
    name: '2B',
    gid: 1170002,
    shipType: '경순',
    faction: '니어',
    techPoints: { acquired: 0, maxLB: 0, lv120: 0 },
    statAcquired: { shipTypes: [], stat: '', value: 0 },
    stat120: { shipTypes: [], stat: '', value: 0 },
    iconFile: '11700020.png',
  },
  {
    id: 743,
    name: '셰르부르',
    gid: 81801,
    shipType: '대순',
    faction: '아이리스',
    techPoints: { acquired: 22, maxLB: 44, lv120: 32 },
    statAcquired: { shipTypes: ['중순', '초순', '모니터'], stat: '화력', value: 1 },
    stat120: { shipTypes: ['중순', '초순', '모니터'], stat: '내구', value: 2 },
    iconFile: '818010.png',
  },
  {
    id: 744,
    name: '아로망슈',
    gid: 80602,
    shipType: '경항모',
    faction: '아이리스',
    techPoints: { acquired: 18, maxLB: 38, lv120: 28 },
    statAcquired: { shipTypes: ['경항모'], stat: '내구', value: 1 },
    stat120: { shipTypes: ['경항모'], stat: '항공', value: 2 },
    iconFile: '806020.png',
  },
  {
    id: 745,
    name: '랑트레피드',
    gid: 80106,
    shipType: '구축',
    faction: '아이리스',
    techPoints: { acquired: 14, maxLB: 28, lv120: 20 },
    statAcquired: { shipTypes: ['구축'], stat: '내구', value: 1 },
    stat120: { shipTypes: ['구축'], stat: '회피', value: 1 },
    iconFile: '801060.png',
  },
]

const identityCorrections = [
  { id: 'M060', name: '엘베(META)', gid: 970605, iconFile: '9706050.png' },
  { id: 'M061', name: '쾨니히스베르크(META)', gid: 970212, iconFile: '9702120.png' },
  { id: 'Z004', name: '벨', gid: 1010004, iconFile: '10100040.png' },
]

for (const expected of expectedCharacters) {
  const character = characters.find(item => item.id === expected.id)
  assert.ok(character, `${expected.name} 캐릭터 데이터가 있어야 합니다.`)
  assert.equal(character.name, expected.name)
  assert.equal(character.gid, expected.gid)
  assert.equal(character.shipType, expected.shipType)
  assert.equal(character.faction, expected.faction)
  assert.deepEqual(character.techPoints, expected.techPoints)
  assert.deepEqual(character.statAcquired, expected.statAcquired)
  assert.deepEqual(character.stat120, expected.stat120)
  assert.equal(character.iconUrl, `/azurlane-tracker/ship-icons/${expected.iconFile}`)
  assert.ok(
    existsSync(new URL(`../../public/ship-icons/${expected.iconFile}`, import.meta.url)),
    `${expected.name} 아이콘 파일이 있어야 합니다.`,
  )
}

for (const expected of identityCorrections) {
  const character = characters.find(item => item.id === expected.id)
  assert.ok(character, `${expected.id} must exist`)
  assert.equal(character.name, expected.name)
  assert.equal(character.gid, expected.gid)
  assert.equal(character.iconUrl, `/azurlane-tracker/ship-icons/${expected.iconFile}`)
}

const collabBell = characters.find(item => item.id === 'Z004')
assert.deepEqual(collabBell.techPoints, { acquired: 0, maxLB: 0, lv120: 0 })
assert.deepEqual(collabBell.statAcquired, { shipTypes: [], stat: '', value: 0 })
assert.deepEqual(collabBell.stat120, { shipTypes: [], stat: '', value: 0 })

for (const gid of [20404, 30406, 30407, 30408, 40407]) {
  assert.equal(characters.find(item => item.gid === gid)?.shipType, '순전', `${gid} 공식 순전 분류`)
}

assert.deepEqual(
  characters
    .filter(character => character.faction === '템페스타')
    .map(character => character.name)
    .sort((a, b) => a.localeCompare(b, 'ko')),
  [
    '건스웨이',
    '골든 하인드',
    '돌핀',
    '라임',
    '로열 제임스',
    '로열 포춘',
    '메리 셀러스트',
    '상 마르티뉴',
    '아미티',
    '어드벤처',
    '어드벤처 갤리',
    '위다',
    '퀸 앤즈 리벤지',
    '팬시',
    '펄',
    '포츠머스 어드벤처',
  ].sort((a, b) => a.localeCompare(b, 'ko')),
  '템페스타(MOT) 16명을 모두 같은 진영으로 분류',
)
assert.equal(characters.filter(character => character.faction === '페드레리아').length, 1, '페드레리아(LDP) 함선 분류')
assert.ok(characters.every(character => !['MOT', 'LDP'].includes(character.faction)), '생성 데이터는 내부 표준 진영명을 사용')

for (const character of characters) {
  const iconFile = character.iconUrl?.split('/').pop()
  assert.ok(iconFile, `${character.name} must have an icon URL`)
  assert.ok(
    existsSync(new URL(`../../public/ship-icons/${iconFile}`, import.meta.url)),
    `${character.name} iconUrl must point to an existing public asset`,
  )
}
