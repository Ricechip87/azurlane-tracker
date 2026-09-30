import assert from 'node:assert/strict'
import characters from './characters.json' with { type: 'json' }
import equipment from './equipmentDirectStats.json' with { type: 'json' }
import combat from './shipCombatData.json' with { type: 'json' }
import stages from './stageRequirements.json' with { type: 'json' }
import { buildFleetRecommendation } from '../utils/fleetRecommendations.js'

assert.equal(Object.keys(combat.ships).length, characters.length)
assert.equal(combat.meta.shipCount, 895, '2026-09-30 KR 공개 함선 전투 데이터 895척 반영')

for (const gid of [20119, 20140, 20238, 30409, 31703, 970709]) {
  assert.ok(combat.ships[gid]?.base.health > 0, `${gid} 신규 함선 전투 스탯`)
}

const saratogaMeta = combat.ships['970710']
assert.ok(saratogaMeta, '새러토가(META) 전투 데이터가 필요합니다.')
assert.equal(saratogaMeta.name, '새러토가(META)')
assert.equal(saratogaMeta.type, 7)
assert.equal(saratogaMeta.base.health, 1233)
assert.equal(saratogaMeta.maxBase.health, 3037)
assert.equal(saratogaMeta.maxBase.aviation, 212)
assert.equal(saratogaMeta.growth.aviation, 1038)
assert.equal(saratogaMeta.enhance.aviation, 84)
assert.deepEqual(saratogaMeta.equipSlots, [[7], [9], [8], [10], [10]])

for (const [gid, expected] of Object.entries({
  10711: { id: 15580, name: '인트레피드 파워', stats: { aviation: 30, reload: 15 } },
  70301: { id: 15600, name: '흔들리지 않는 임팩트', stats: { firepower: 25, accuracy: 10 } },
  40805: { id: 15620, name: '이걸로 속도를 확인해 봐', stats: { torpedo: 25, accuracy: 10 } },
  20210: { id: 15640, name: '교육 담당의 수완', stats: { firepower: 25, reload: 20 } },
  39903: { id: 15660, name: '지금은 경계 중', stats: { firepower: 20, health: 180 } },
})) {
  assert.deepEqual(combat.ships[gid]?.augment, expected, `${gid} 신규 전용장비의 +10 직접 능력치를 반영합니다.`)
}

for (const character of characters) {
  const source = combat.ships[String(character.gid)]
  assert.ok(source, `전투 스탯 누락: ${character.name}(${character.gid})`)
  assert.equal(source.name, character.name)
  assert.ok(source.equipSlots.length === 5)
}

assert.ok(equipment.equipment.length >= 500)
assert.ok(equipment.equipment.every(item => item.rarity >= 4))
assert.ok(equipment.equipment.every(item => Object.keys(item.stats).length > 0))
for (const [id, rarity, firepower] of [[22300, 5, 35], [22320, 6, 55]]) {
  assert.deepEqual(equipment.equipment.find(item => item.id === id), {
    id, name: '152mm 연장포 MK.XXVI', icon: '22300', type: 2,
    rarity, shipTypes: [2], stats: { firepower, antiair: 10 },
  }, '9월 24일 SSR·UR 주포의 정확한 +10 직접 능력치')
}
for (const chapter of [13, 15]) {
  const result = buildFleetRecommendation({
    characters: [{ ...characters.find(ship => ship.gid === 20238), acquired: '125' }],
    shipData: combat.ships,
    equipment: equipment.equipment,
    stage: { chapter },
    equipmentProfile: 'high-end',
  })
  assert.deepEqual(result.fleets.boss.front[0].equipment.slice(0, 2).map(item => item.id), [22320, 22320], `${chapter}지 하이엔드 타이거 두 주포 슬롯에 신규 UR 직접 능력치를 반영한다`)
}

const stage1504 = stages.stages.find(stage => stage.id === 1504)
assert.ok(stage1504)
assert.equal(stage1504.airDominance, 2820)
assert.equal(stage1504.bestAirDominance, 3665)
assert.equal(stage1504.avoidRequirement, 172)
assert.equal(stage1504.supportFleetCount, 1)
assert.equal(stage1504.submarineFleetCount, 1)
assert.equal(stages.stages.find(stage => stage.id === 1301).nightBattle, false)
assert.equal(stages.stages.find(stage => stage.id === 1401).nightBattle, true)

console.log('fleet recommendation data: passed')
