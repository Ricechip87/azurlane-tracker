import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const data = JSON.parse(await readFile(new URL('./researchRecommendations.json', import.meta.url), 'utf8'))

assert.equal(data.source.maxGeneration, 8)
assert.equal(data.source.nextGenerationPolicy, 'KR 정식 데이터 편입 후 반영')
assert.equal(data.ships.length, 42)
assert.deepEqual(
  Object.fromEntries(
    [...new Set(data.ships.map(ship => ship.generation))]
      .sort((a, b) => a - b)
      .map(generation => [generation, data.ships.filter(ship => ship.generation === generation).length]),
  ),
  { 1: 6, 2: 6, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5 },
)

for (const ship of data.ships) {
  assert.match(String(ship.id), /^P\d{3}$/)
  assert.ok(ship.gid)
  assert.ok(['PR', 'DR'].includes(ship.planRarity))
  assert.ok(ship.unlockRequirements.length > 0, `${ship.name}: unlock requirements`)
  assert.equal(ship.xpPhases.length, 2, `${ship.name}: XP phase count`)
  for (const phase of ship.xpPhases) {
    assert.ok(phase.requiredXp > 0, `${ship.name}: XP requirement`)
    assert.ok(phase.factions.length > 0, `${ship.name}: XP factions`)
    assert.ok(['전열', '후열'].includes(phase.lane), `${ship.name}: XP lane`)
  }
  const fileName = path.basename(ship.iconUrl).replace(/\.(png|webp)$/i, '.png')
  await assert.doesNotReject(
    access(new URL(`../../public/ship-card-art/${fileName}`, import.meta.url)),
    `missing research card art: ${ship.name} (${fileName})`,
  )
}

assert.deepEqual(data.ships.find(ship => ship.name === '캔자스').unlockRequirements, [
  { type: 'tech-points', faction: '유니온', value: 950 },
])

assert.deepEqual(data.ships.find(ship => ship.name === '나폴리').unlockRequirements, [
  { type: 'tech-points', faction: '사르데냐', value: 300 },
  { type: 'tech-points', faction: '노스유니온', value: 200 },
])
assert.deepEqual(data.ships.find(ship => ship.name === '어드미럴 나히모프').unlockRequirements, [
  { type: 'tech-points', faction: '노스유니온', value: 300 },
  { type: 'tech-points', faction: '사르데냐', value: 200 },
])
assert.deepEqual(data.ships.find(ship => ship.name === '드미트리 돈스코이').unlockRequirements, [
  { type: 'tech-points', faction: '노스유니온', value: 300 },
])
assert.deepEqual(data.ships.find(ship => ship.name === '치칼로프').unlockRequirements, [
  { type: 'tech-points', faction: '유니온', value: 760 },
  { type: 'tech-points', faction: '사르데냐', value: 300 },
])

assert.equal(data.ships.filter(ship => ship.coinStrengthening.available).length, 30)

const houdenLeeuw = data.ships.find(ship => ship.id === 'P042')
assert.deepEqual(houdenLeeuw.unlockRequirements, [
  { type: 'tech-points', faction: '철혈', value: 800 },
  { type: 'tech-points', faction: '사르데냐', value: 200 },
])
assert.deepEqual(houdenLeeuw.xpPhases.map(phase => ({ factions: phase.factions, lane: phase.lane, requiredXp: phase.requiredXp })), [
  { factions: ['튤리퍼', '철혈', '사르데냐'], lane: '전열', requiredXp: 1200000 },
  { factions: ['튤리퍼', '철혈', '사르데냐'], lane: '전열', requiredXp: 2400000 },
])
