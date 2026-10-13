import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareFormationExample } from './fleetFormationExamples.js'

const example = { id: 'test', main: [
  { type: 'fixed', candidates: [{ id: 1, retrofitRequired: true }] },
  { type: 'choice', candidates: [{ id: 2 }, { id: 3 }] },
  { type: 'training', candidates: [] },
], vanguard: [{ type: 'fixed', candidates: [{ id: 404, name: '미등록' }] }] }
const characters = [{ id: 1, acquired: '120', remodeled: '미개장' }, { id: 2, acquired: '미획득' }, { id: 3, acquired: '획득' }]
const before = JSON.stringify({ example, characters })
const result = compareFormationExample(example, characters)
assert.equal(result.main[0].candidates[0].owned, true)
assert.equal(result.main[0].candidates[0].progressLabel, 'Lv120')
assert.equal(result.main[0].candidates[0].retrofitMissing, true)
assert.equal(result.main[1].hasOwnedCandidate, true)
assert.equal(result.main[1].candidates[1].progressLabel, '획득')
assert.equal(result.main[2].hasOwnedCandidate, false)
assert.equal(result.vanguard[0].candidates[0].registered, false)
assert.deepEqual(result.summary, { requiredSlots: 3, ownedSlots: 2, trainingSlots: 1 })
assert.equal(JSON.stringify({ example, characters }), before, 'never mutate roster or source')
const remodeled = compareFormationExample(example, [{ id: '1', acquired: '육성 완료', remodeled: '개장' }])
assert.equal(remodeled.main[0].candidates[0].retrofitMissing, false)
assert.equal(remodeled.main[0].candidates[0].progressLabel, 'Lv120')
assert.equal(compareFormationExample({ main: [], vanguard: [] }, []).summary.requiredSlots, 0)
const source = JSON.parse(readFileSync(new URL('../data/fleetFormationExamples.json', import.meta.url), 'utf8'))
const roster = JSON.parse(readFileSync(new URL('../data/characters.json', import.meta.url), 'utf8'))
assert.equal(source.examples.length, 9)
assert.equal(new Set(source.examples.map(item => item.id)).size, 9)
for (const formation of source.examples) {
  assert.equal(formation.main.length, 3)
  assert.equal(formation.vanguard.length, formation.supportOnly ? 0 : 3)
  for (const slot of [...formation.main, ...formation.vanguard]) {
    assert.ok(['fixed', 'choice', 'training'].includes(slot.type))
    if (slot.type === 'training') assert.deepEqual(slot.candidates, [])
    else assert.ok(slot.candidates.length > 0)
    for (const candidate of slot.candidates) {
      const character = roster.find(item => item.id === candidate.id)
      assert.equal(character?.gid, candidate.gid)
      assert.equal(character?.name, candidate.name)
      if (candidate.retrofitRequired) assert.equal(character.canRemodel, true)
    }
  }
}
const farm134 = source.examples.filter(item => item.stage === '13-4')
assert.deepEqual(farm134.map(item => compareFormationExample(item, []).summary.trainingSlots).sort(), [4, 5])
console.log('Fleet formation example comparisons passed')
