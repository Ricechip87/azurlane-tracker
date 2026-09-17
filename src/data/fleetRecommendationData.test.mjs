import assert from 'node:assert/strict'
import characters from './characters.json' with { type: 'json' }
import equipment from './equipmentDirectStats.json' with { type: 'json' }
import combat from './shipCombatData.json' with { type: 'json' }
import stages from './stageRequirements.json' with { type: 'json' }

assert.equal(Object.keys(combat.ships).length, characters.length)
assert.equal(combat.meta.shipCount, 888, '2026-09-17 KR 함선 전투 데이터 888척 반영')

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
