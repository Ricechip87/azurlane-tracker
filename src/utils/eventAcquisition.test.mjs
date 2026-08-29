import assert from 'node:assert/strict'
import { resolveEventAcquisition } from './eventAcquisition.js'

const event = {
  name: '몽광의 아스트라리움',
  startsAt: '2026-08-27',
  endsAt: '2026-09-10',
  endsAtLabel: '2026-09-10 점검까지',
  claimEndsAt: '2026-09-16 23:59',
  acquisition: {
    베닝턴: [
      { kind: 'limited-construction', label: '한정 건조 2.0% (04:25:00)', endsAt: '2026-09-10' },
    ],
    콜렛: [
      { kind: 'limited-construction', label: '한정 건조 0.5% (00:29:00)', endsAt: '2026-09-10' },
      { kind: 'event-exchange', label: '이벤트 상점 8,000 PT 교환 (최대 5회)', endsAt: '2026-09-16 23:59' },
      { kind: 'event-drop', label: '이벤트 해역 B3/D3/SP 드롭', endsAt: '2026-09-10' },
    ],
    '존 로저스': [
      { kind: 'milestone-reward', label: '누적 10,000 PT 첫 획득 (추가 20,000/40,000/60,000 PT · 건조 불가 · 09-16 23:59까지)', endsAt: '2026-09-16 23:59' },
    ],
  },
}

assert.equal(
  resolveEventAcquisition(event, '콜렛', new Date('2026-08-26T23:59:59+09:00')).phase,
  'ended',
  '이벤트 시작 직전에는 활성화하지 않는다',
)
assert.equal(
  resolveEventAcquisition(event, '콜렛', new Date('2026-08-27T12:00:00+09:00')).phase,
  'main',
  'KST 시작일 00:00 이후에는 메인 이벤트로 활성화한다',
)

const mainCollett = resolveEventAcquisition(event, '콜렛', '2026-09-10')
assert.equal(mainCollett.phase, 'main')
assert.equal(mainCollett.availability.label, '현재 이벤트')
assert.equal(mainCollett.availability.endsAtLabel, '2026-09-10 점검까지')
assert.deepEqual(mainCollett.activeRoutes.map(route => route.kind), ['limited-construction', 'event-exchange', 'event-drop'])
assert.equal(mainCollett.buildLimited, true)

const claimCollett = resolveEventAcquisition(event, '콜렛', '2026-09-11')
assert.equal(claimCollett.phase, 'claim-only')
assert.equal(claimCollett.availability.label, '이벤트 수령 기간')
assert.equal(claimCollett.availability.endsAt, '2026-09-16 23:59')
assert.deepEqual(claimCollett.activeRoutes.map(route => route.kind), ['event-exchange'])
assert.equal(claimCollett.buildLimited, false)

const claimJohn = resolveEventAcquisition(event, '존 로저스', '2026-09-16')
assert.equal(claimJohn.phase, 'claim-only')
assert.equal(claimJohn.availability.label, '이벤트 수령 기간')
assert.deepEqual(claimJohn.activeRoutes.map(route => route.kind), ['milestone-reward'])
assert.equal(claimJohn.activeRoutes[0].label, '누적 10,000 PT 첫 획득 (추가 20,000/40,000/60,000 PT · 건조 불가 · 09-16 23:59까지)')

const endedBennington = resolveEventAcquisition(event, '베닝턴', '2026-09-11')
assert.equal(endedBennington.phase, 'ended')
assert.equal(endedBennington.availability, null)
assert.equal(endedBennington.buildLimited, false)

for (const name of ['베닝턴', '콜렛', '존 로저스']) {
  const ended = resolveEventAcquisition(event, name, '2026-09-17')
  assert.equal(ended.phase, 'ended', `${name} 수령 기한 후 종료`)
  assert.deepEqual(ended.activeRoutes, [], `${name} 수령 기한 후 활성 경로 없음`)
  assert.equal(ended.buildLimited, false, `${name} 수령 기한 후 한정 건조 비활성`)
}

console.log('event acquisition tests passed')
