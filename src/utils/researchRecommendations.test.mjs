import assert from 'node:assert/strict'
import {
  buildResearchRecommendationState,
  calcAllFactionTechPoints,
  evaluateResearchUnlock,
  getEligibleResearchXpShips,
  getResearchUnlockCandidates,
} from './researchRecommendations.js'

function character(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? '테스트 함선',
    faction: overrides.faction ?? '유니온',
    shipType: overrides.shipType ?? '구축',
    acquired: overrides.acquired ?? '미획득',
    techPoints: overrides.techPoints ?? { acquired: 10, maxLB: 20, lv120: 30 },
    ...overrides,
  }
}

assert.deepEqual(
  calcAllFactionTechPoints([
    character({ faction: '사르데냐', acquired: '획득' }),
    character({ faction: '사르데냐', acquired: '풀돌' }),
    character({ faction: '노스유니온', acquired: '120' }),
  ]),
  { 사르데냐: 40, 노스유니온: 60 },
)

const roster = [
  character({ faction: '로열', shipType: '전함', acquired: '획득' }),
  character({ faction: '로열', shipType: '항모', acquired: '120' }),
  character({ faction: '로열', shipType: '경순', acquired: '획득' }),
]

assert.deepEqual(
  evaluateResearchUnlock(
    [
      { type: 'tech-points', faction: '로열', value: 100 },
      { type: 'roster-count', faction: '로열', lane: '후열', value: 2 },
    ],
    roster,
    { 로열: 90 },
  ),
  {
    met: false,
    progress: 0.9,
    requirements: [
      { type: 'tech-points', faction: '로열', value: 100, current: 90, remaining: 10, met: false },
      { type: 'roster-count', faction: '로열', lane: '후열', value: 2, current: 2, remaining: 0, met: true },
    ],
  },
)

const researchShips = [
  { id: 'P041', name: '8기 PR', generation: 8, planRarity: 'PR', unlockRequirements: [] },
  { id: 'P036', name: '7기 DR', generation: 7, planRarity: 'DR', unlockRequirements: [] },
  { id: 'P020', name: '완료 함선', generation: 4, planRarity: 'DR', unlockRequirements: [] },
  { id: 'P042', name: '잠김 함선', generation: 8, planRarity: 'DR', unlockRequirements: [{ type: 'tech-points', faction: '철혈', value: 100 }] },
]
const userCharacters = [
  character({ id: 'P041', name: '8기 PR', acquired: '미획득' }),
  character({ id: 'P036', name: '7기 DR', acquired: '미획득' }),
  character({ id: 'P020', name: '완료 함선', acquired: '획득' }),
  character({ id: 'P042', name: '잠김 함선', acquired: '미획득' }),
]
const recommendationState = buildResearchRecommendationState(researchShips, userCharacters)
assert.deepEqual(recommendationState.ready.map(item => item.name), ['8기 PR', '7기 DR'])
assert.deepEqual(recommendationState.locked.map(item => item.name), ['잠김 함선'])
assert.deepEqual(recommendationState.completed.map(item => item.name), ['완료 함선'])

assert.deepEqual(
  getEligibleResearchXpShips(
    { factions: ['아이리스', '비시아'], lane: '전열' },
    [
      character({ id: 1, name: '아이리스 전열', faction: '아이리스', shipType: '구축', acquired: '획득' }),
      character({ id: 2, name: '비시아 후열', faction: '비시아', shipType: '전함', acquired: '120' }),
      character({ id: 3, name: '미획득 전열', faction: '아이리스', shipType: '경순', acquired: '미획득' }),
    ],
  ).map(item => item.name),
  ['아이리스 전열'],
)

assert.deepEqual(
  getResearchUnlockCandidates(
    { type: 'roster-count', faction: '로열', lane: '후열' },
    [
      character({ id: 10, name: '미획득 전함', faction: '로열', shipType: '전함', acquired: '미획득' }),
      character({ id: 11, name: '보유 항모', faction: '로열', shipType: '항모', acquired: '획득' }),
      character({ id: 12, name: '타 진영 전함', faction: '유니온', shipType: '전함', acquired: '미획득' }),
    ],
  ).map(item => item.name),
  ['미획득 전함'],
)

assert.deepEqual(
  getResearchUnlockCandidates(
    { type: 'tech-points', faction: '로열' },
    [
      character({ id: 20, name: '기술 후보', faction: '로열', acquired: '100', techPoints: { acquired: 1, maxLB: 2, lv120: 30 } }),
      character({ id: 21, name: '완료', faction: '로열', acquired: '120' }),
    ],
  ).map(item => item.name),
  ['기술 후보'],
)
