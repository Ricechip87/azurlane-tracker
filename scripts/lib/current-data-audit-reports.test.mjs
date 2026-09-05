import assert from 'node:assert/strict'
import {
  buildFactionAudit,
  buildFactionAuditMarkdown,
  buildObtainabilityAudit,
  buildObtainabilityAuditMarkdown,
  formatKstTimestamp,
} from './current-data-audit-reports.mjs'

assert.equal(formatKstTimestamp('2026-08-29T11:44:22.948Z'), '2026-08-29 20:44:22 KST')

const obtainabilityShips = [
  {
    name: '상시함',
    obtain: ['상점 교환'],
    availability: { key: 'permanent' },
    difficulty: { key: 'easy' },
    acquisitionRoutes: [
      { key: 'fixed-exchange' },
      { key: 'fixed-exchange' },
    ],
    verification: { status: 'matched' },
  },
  {
    name: '이벤트함',
    obtain: ['현재 이벤트'],
    availability: { key: 'active-event' },
    difficulty: { key: 'event' },
    acquisitionRoutes: [{ key: 'active-event' }],
    verification: { status: 'altoy-only' },
  },
  {
    name: '대기함',
    obtain: [],
    availability: { key: 'rerun-wait' },
    difficulty: { key: 'limited' },
    acquisitionRoutes: [],
    verification: { status: 'different' },
  },
]

const obtainabilityMeta = {
  generatedAt: '2026-08-29T11:44:22.948Z',
  total: 3,
  withObtain: 2,
  withoutObtain: 1,
  availability: { permanent: 1, 'active-event': 1, 'rerun-wait': 1 },
  difficulty: { easy: 1, event: 1, limited: 1 },
  acquisitionRoutes: { 'fixed-exchange': 1, 'active-event': 1 },
  source: 'fixture',
}

const obtainabilityAudit = buildObtainabilityAudit({
  meta: obtainabilityMeta,
  ships: obtainabilityShips,
})
assert.equal(obtainabilityAudit.total, 3)
assert.equal(obtainabilityAudit.withObtain, 2)
assert.equal(obtainabilityAudit.withoutObtain, 1)
assert.deepEqual(obtainabilityAudit.acquisitionRoutes, {
  'active-event': 1,
  'fixed-exchange': 1,
})
assert.deepEqual(obtainabilityAudit.verification, {
  'altoy-only': 1,
  different: 1,
  matched: 1,
})
assert.deepEqual(obtainabilityAudit.metadataMismatches, [])
assert.match(buildObtainabilityAuditMarkdown(obtainabilityAudit), /표시 함선: 3척/)

const staleObtainabilityAudit = buildObtainabilityAudit({
  meta: { ...obtainabilityMeta, total: 2 },
  ships: obtainabilityShips,
})
assert.deepEqual(staleObtainabilityAudit.metadataMismatches, [
  { field: 'total', expected: 3, actual: 2 },
])

const characters = [
  { id: 1, gid: 10, name: '유니온 기존함', faction: '유니온' },
  { id: 2, gid: 20, name: '노스 기존함', faction: '노스유니온' },
  { id: 3, gid: 30, name: '유니온 신규함', faction: '유니온' },
  { id: 4, gid: 40, name: '진영 오분류함', faction: '로열' },
]
const factionAudit = buildFactionAudit({
  generatedAt: '2026-08-30 12:00:00 KST',
  characters,
  altoyShips: [
    { gid: 10, nationality: 1 },
    { gid: 20, nationality: 7 },
    { gid: 30, nationality: 1 },
    { gid: 40, nationality: 1 },
  ],
  cnStatistics: {
    101: { nationality: 1 },
    201: { nationality: 7 },
  },
  derivedDatasets: {
    growthRecommendations: [
      { gid: 10, name: '유니온 기존함', faction: '유니온' },
      { gid: 20, name: '노스 기존함', faction: '유니온' },
      { gid: 999, name: '유니온 기존함', faction: '유니온' },
    ],
    shipObtainability: [
      { gid: 10, name: '유니온 기존함', faction: '유니온' },
      { gid: 30, name: '유니온 신규함', faction: '유니온' },
    ],
    researchRecommendations: [],
  },
  researchShips: [
    {
      name: '연구함',
      unlockRequirements: [
        { type: 'tech-points', faction: '유니온', value: 760 },
        { type: 'tech-points', faction: '노스유니온', value: 300 },
      ],
    },
  ],
})

assert.deepEqual(factionAudit.factions.유니온, {
  appCount: 2,
  matchedCount: 2,
  cnMatchCount: 1,
  altoyFallbackCount: 1,
  missingSourceCount: 0,
  mismatchCount: 1,
})
assert.deepEqual(factionAudit.factions.노스유니온, {
  appCount: 1,
  matchedCount: 1,
  cnMatchCount: 1,
  altoyFallbackCount: 0,
  missingSourceCount: 0,
  mismatchCount: 0,
})
assert.equal(factionAudit.derived.growthRecommendations.checkedCount, 3)
assert.equal(factionAudit.derived.growthRecommendations.missingCount, 1)
assert.equal(factionAudit.derived.growthRecommendations.mismatchCount, 1)
assert.equal(factionAudit.derived.shipObtainability.mismatchCount, 0)
assert.equal(factionAudit.sourceMismatches.length, 1)
assert.deepEqual(factionAudit.sourceMismatches[0], {
  id: 4,
  gid: 40,
  name: '진영 오분류함',
  source: 'ALtoy',
  expectedFaction: '유니온',
  actualFaction: '로열',
  expectedNationality: 1,
  actualNationality: 1,
})
assert.deepEqual(factionAudit.researchTechRequirements, {
  노스유니온: 1,
  유니온: 1,
})
assert.match(buildFactionAuditMarkdown(factionAudit), /ALtoy 보완 1척/)

console.log('current data audit report tests passed')
