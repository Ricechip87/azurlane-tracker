import assert from 'node:assert/strict'
import characters from './characters.json' with { type: 'json' }
import equipment from './equipmentDirectStats.json' with { type: 'json' }
import combat from './shipCombatData.json' with { type: 'json' }
import stages from './stageRequirements.json' with { type: 'json' }

assert.equal(Object.keys(combat.ships).length, characters.length)
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
