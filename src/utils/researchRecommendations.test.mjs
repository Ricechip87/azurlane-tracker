import assert from 'node:assert/strict'
import {
  buildOperationTierByName,
  buildResearchFactionProgress,
  buildResearchRecommendationState,
  buildWebResearchRecommendationGroups,
  calcAllFactionTechPoints,
  evaluateResearchUnlock,
  getEligibleResearchXpShips,
  getResearchGoalItems,
  groupResearchShipsByGeneration,
  getResearchUnlockCandidates,
  selectPriorityResearchShips,
} from './researchRecommendations.js'

assert.deepEqual(
  getResearchGoalItems({
    ready: [{ id: 'ready', generation: 7, name: '개발 가능' }],
    locked: [{ id: 'locked', generation: 8, name: '해금 필요' }],
    completed: [{ id: 'completed', generation: 8, name: '개발 완료' }],
  }).map(item => item.name),
  ['해금 필요', '개발 가능'],
)

assert.deepEqual(
  groupResearchShipsByGeneration([
    { id: 'g5-b', generation: 5, name: '나' },
    { id: 'g8', generation: 8, name: '최신' },
    { id: 'g5-a', generation: 5, name: '가' },
  ]).map(group => ({ generation: group.generation, names: group.items.map(item => item.name) })),
  [
    { generation: 8, names: ['최신'] },
    { generation: 5, names: ['가', '나'] },
  ],
)

const webRecommendationState = {
  ready: [
    { id: 'ready-8', name: '바로 8기', generation: 8, coinStrengthening: { available: false }, unlock: { progress: 1 } },
    { id: 'ready-7', name: '바로 7기', generation: 7, coinStrengthening: { available: true }, unlock: { progress: 1 } },
  ],
  locked: [
    { id: 'near', name: '가까운 목표', generation: 5, coinStrengthening: { available: true }, unlock: { progress: 0.7 } },
    { id: 'quick', name: '물자강화 목표', generation: 4, coinStrengthening: { available: true }, unlock: { progress: 0.2 } },
    { id: 'long', name: '장기 목표', generation: 8, coinStrengthening: { available: false }, unlock: { progress: 0.1 } },
  ],
  completed: [],
}
assert.deepEqual(
  buildWebResearchRecommendationGroups(webRecommendationState, new Map([
    ['물자강화 목표', 'SS'],
    ['장기 목표', 'SS+'],
  ]), 1).map(group => ({ key: group.key, names: group.items.map(item => item.name) })),
  [
    { key: 'start', names: ['바로 8기'] },
    { key: 'unlock', names: ['가까운 목표'] },
    { key: 'quick', names: ['물자강화 목표'] },
    { key: 'long', names: ['장기 목표'] },
  ],
)

assert.deepEqual(
  selectPriorityResearchShips(
    [{ name: '8기 A', generation: 8 }, { name: '8기 B', generation: 8 }, { name: '7기', generation: 7 }],
    [{ name: '잠김', generation: 8, unlock: { progress: 0.9 } }],
  ),
  { items: [{ name: '8기 A', generation: 8 }, { name: '8기 B', generation: 8 }], mode: 'ready' },
)

assert.deepEqual(
  selectPriorityResearchShips([], [
    { name: '진행 중', generation: 1, unlock: { progress: 0.15 } },
    { name: '덜 진행', generation: 8, unlock: { progress: 0.1 } },
  ]),
  { items: [{ name: '진행 중', generation: 1, unlock: { progress: 0.15 } }], mode: 'progress' },
)

assert.deepEqual(
  selectPriorityResearchShips([], [
    { name: '8기 진행 없음', generation: 8, unlock: { progress: 0 } },
    { name: '1기 입문 A', generation: 1, unlockRequirements: [{ value: 20 }], unlock: { progress: 0 } },
    { name: '1기 입문 B', generation: 1, unlockRequirements: [{ value: 7 }], unlock: { progress: 0 } },
  ]),
  {
    items: [
      { name: '1기 입문 B', generation: 1, unlockRequirements: [{ value: 7 }], unlock: { progress: 0 } },
      { name: '1기 입문 A', generation: 1, unlockRequirements: [{ value: 20 }], unlock: { progress: 0 } },
    ],
    mode: 'starter',
  },
)

assert.deepEqual(
  buildResearchFactionProgress(
    [
      { name: '철혈 100', generation: 2, unlockRequirements: [{ type: 'tech-points', faction: '철혈', value: 100 }] },
      { name: '철혈 300 A', generation: 7, unlockRequirements: [{ type: 'tech-points', faction: '철혈', value: 300 }] },
      { name: '철혈 300 B', generation: 8, unlockRequirements: [{ type: 'tech-points', faction: '철혈', value: 300 }] },
      { name: '사르데냐 200', unlockRequirements: [{ type: 'tech-points', faction: '사르데냐', value: 200 }] },
      { name: '도감 조건', unlockRequirements: [{ type: 'roster-count', faction: '철혈', lane: '전열', value: 7 }] },
    ],
    { 철혈: 150, 사르데냐: 250 },
  ),
  [
    {
      faction: '철혈',
      current: 150,
      maxRequired: 300,
      remaining: 150,
      nextTarget: { required: 300, ships: ['철혈 300 B', '철혈 300 A'], met: false },
      targets: [
        { required: 100, ships: ['철혈 100'], met: true },
        { required: 300, ships: ['철혈 300 B', '철혈 300 A'], met: false },
      ],
    },
    {
      faction: '사르데냐',
      current: 250,
      maxRequired: 200,
      remaining: 0,
      nextTarget: null,
      targets: [{ required: 200, ships: ['사르데냐 200'], met: true }],
    },
  ],
)

assert.deepEqual(
  [...buildOperationTierByName({
    recommendations: [
      { source: 'main', name: '테스트 함선', tier: 'SS+' },
      { source: 'operation-siren', name: '테스트 함선', tier: 'A' },
      { source: 'operation-siren', name: '중복 함선', tier: 'B' },
      { source: 'operation-siren', name: '중복 함선', tier: 'S' },
    ],
  })],
  [['테스트 함선', 'A'], ['중복 함선', 'S']],
)

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
    { obtainabilityByName: new Map([['미획득 전함', { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'easy', label: '쉬움' } }]]) },
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

const rankedTechCandidates = [
  character({ id: 30, name: '보유 두 단계', faction: '로열', acquired: '획득', techPoints: { acquired: 0, maxLB: 80, lv120: 80 } }),
  character({ id: 31, name: '보유 한 단계 A', faction: '로열', acquired: '100', techPoints: { acquired: 0, maxLB: 0, lv120: 90 } }),
  character({ id: 32, name: '보유 한 단계 SS', faction: '로열', acquired: '100', techPoints: { acquired: 0, maxLB: 0, lv120: 20 } }),
  character({ id: 33, name: '쉬움 A 고득점', faction: '로열', acquired: '미획득', techPoints: { acquired: 100, maxLB: 100, lv120: 100 } }),
  character({ id: 34, name: '쉬움 SS 저득점', faction: '로열', acquired: '미획득', techPoints: { acquired: 30, maxLB: 30, lv120: 30 } }),
  character({ id: 35, name: '보통 SS 최고득점', faction: '로열', acquired: '미획득', techPoints: { acquired: 200, maxLB: 200, lv120: 200 } }),
  character({ id: 36, name: '현재 이벤트 후보', faction: '로열', acquired: '미획득', techPoints: { acquired: 70, maxLB: 70, lv120: 70 } }),
  character({ id: 37, name: '복각 대기 최고득점', faction: '로열', acquired: '미획득', techPoints: { acquired: 300, maxLB: 300, lv120: 300 } }),
  character({ id: 38, name: '콜라보 복각 미정', faction: '로열', acquired: '미획득', techPoints: { acquired: 400, maxLB: 400, lv120: 400 } }),
]
const obtainabilityByName = new Map([
  ['쉬움 A 고득점', { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'easy', label: '쉬움' } }],
  ['쉬움 SS 저득점', { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'easy', label: '쉬움' } }],
  ['보통 SS 최고득점', { availability: { key: 'permanent', label: '상시 획득' }, difficulty: { key: 'normal', label: '보통' } }],
  ['현재 이벤트 후보', { availability: { key: 'active-event', label: '현재 이벤트' }, difficulty: { key: 'event', label: '이벤트' } }],
  ['복각 대기 최고득점', { availability: { key: 'rerun-wait', label: '복각 대기' }, difficulty: { key: 'limited', label: '현재 획득 불가' } }],
  ['콜라보 복각 미정', { availability: { key: 'collab-unknown', label: '콜라보 복각 미정' }, difficulty: { key: 'limited', label: '현재 획득 불가' } }],
])
const operationTierByName = new Map([
  ['보유 두 단계', 'SS+'],
  ['보유 한 단계 A', 'A'],
  ['보유 한 단계 SS', 'SS'],
  ['쉬움 A 고득점', 'A'],
  ['쉬움 SS 저득점', 'SS'],
  ['보통 SS 최고득점', 'SS'],
  ['현재 이벤트 후보', 'A'],
])

assert.deepEqual(
  getResearchUnlockCandidates(
    { type: 'tech-points', faction: '로열' },
    rankedTechCandidates,
    { obtainabilityByName, operationTierByName },
  ).map(item => item.name),
  [
    '보유 한 단계 SS',
    '보유 한 단계 A',
    '보유 두 단계',
    '쉬움 SS 저득점',
    '쉬움 A 고득점',
    '현재 이벤트 후보',
    '보통 SS 최고득점',
  ],
)
