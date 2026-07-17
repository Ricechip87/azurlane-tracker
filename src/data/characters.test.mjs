import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import characters from './characters.json' with { type: 'json' }

const expectedCharacters = [
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
