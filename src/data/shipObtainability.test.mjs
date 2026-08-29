import assert from 'node:assert/strict'
import data from './shipObtainability.json' with { type: 'json' }
import activeEvents from '../../scripts/data/kr-active-events.json' with { type: 'json' }
import { toKstDateKey } from '../utils/kstDate.js'
import { resolveEventAcquisition } from '../utils/eventAcquisition.js'

const allowedAvailability = new Set(['permanent', 'active-event', 'rerun-wait', 'collab-unknown', 'unknown'])
assert.equal(data.ships.length, data.meta.total)
assert.ok(data.ships.every(ship => allowedAvailability.has(ship.availability?.key)))
assert.ok(data.ships.every(ship => ship.difficulty?.key !== 'excluded'))
assert.ok(data.ships.every(ship => !JSON.stringify(ship.availability).includes('CN')))
assert.ok(data.ships.every(ship => !/대형함.*건조/.test(JSON.stringify(ship))), 'KR에 없는 대형함 건조 표기를 생성 JSON 어디에도 노출하지 않는다')
assert.ok(data.ships.every(ship => Array.isArray(ship.acquisitionRoutes)), '모든 함선에 구조화된 복수 입수처가 있어야 한다')
assert.ok(data.ships.every(ship => ship.acquisitionRoutes.length === 0 || ship.primaryRoute?.key), '입수처가 있으면 대표 입수처가 있어야 한다')
assert.equal(data.meta.acquisitionRoutes['core-monthly'], 25, 'KR 코어 월간 교환 인원 집계')

for (const name of ['쿠온', '네코네', '루루티에', '우루루', '사라나', '후미뤼르']) {
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'collab-unknown', `${name}도 다른 콜라보와 동일하게 분류`)
}
for (const name of ['셰르부르', '아로망슈', '랑트레피드']) {
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'rerun-wait', `${name} KR 이벤트 종료 후 복각 대기`)
}
for (const name of ['브리스톨(META)', '쾨니히스베르크(META)']) {
  const event = activeEvents.events.find(item => item.ships.includes(name))
  const expected = event?.startsAt <= toKstDateKey() && toKstDateKey() <= event?.endsAt ? 'active-event' : 'rerun-wait'
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, expected, `${name} KR 이벤트 기간 상태`)
}
for (const name of ['A2', '2B']) {
  const ship = data.ships.find(item => item.name === name)
  assert.ok(['active-event', 'collab-unknown'].includes(ship?.availability.key), `${name} 콜라보 기간 상태`)
  if (ship?.availability.key === 'active-event') {
    assert.equal(ship?.difficulty.key, 'event', `${name} 현재 이벤트 후보`)
    assert.equal(ship?.primaryRoute?.key, 'active-event', `${name} 현재 이벤트 입수 경로`)
  } else {
    assert.equal(ship?.difficulty.key, 'limited', `${name} 종료 후 획득 불가`)
    assert.equal(ship?.primaryRoute, null, `${name} 종료 후 현재 입수 경로 없음`)
  }
}
for (const name of ['슈퍼브', '서리', '그리핀']) {
  const ship = data.ships.find(item => item.name === name)
  const event = activeEvents.events.find(item => item.ships.includes(name))
  assert.ok(event, `${name} KR 이벤트 설정 존재`)
  const isActive = event.startsAt <= toKstDateKey() && toKstDateKey() <= event.endsAt
  assert.equal(ship?.availability.key, isActive ? 'active-event' : 'rerun-wait', `${name} KR 이벤트 기간 상태`)

  if (isActive) {
    assert.equal(ship?.availability.endsAt, event.endsAt, `${name} KR 이벤트 종료일`)
    assert.equal(ship?.primaryRoute?.key, 'active-event', `${name} 현재 이벤트 입수 경로`)
    const construction = event.construction?.[name]
    if (construction) {
      assert.equal(ship?.build.limited, true, `${name} 한정 건조 상태`)
      assert.equal(ship?.build.timer, construction.timer, `${name} 한정 건조 시간`)
      assert.equal(ship?.build.rate, construction.rate, `${name} 한정 건조 확률`)
    }
  } else {
    assert.equal(ship?.primaryRoute, null, `${name} 종료 후 현재 입수 경로 없음`)
    assert.equal(ship?.difficulty.key, 'limited', `${name} 종료 후 획득 불가`)
    assert.equal(ship?.build.limited, false, `${name} 종료 후 한정 건조 비활성`)
  }
}

{
  const event = activeEvents.events.find(item => item.name === '몽광의 아스트라리움')
  assert.ok(event, '몽광의 아스트라리움 KR 이벤트 설정 존재')
  assert.equal(event.startsAt, '2026-08-27')
  assert.equal(event.endsAt, '2026-09-10')
  assert.equal(event.endsAtLabel, '2026-09-10 점검까지')
  assert.equal(event.claimEndsAt, '2026-09-16 23:59')
  assert.deepEqual(event.sources.map(source => source.kind), ['official-kr', 'official-kr-full-notice-archive', 'bwiki-cross-check'])
  const officialSource = event.sources.find(source => source.kind === 'official-kr')
  const officialArchive = event.sources.find(source => source.kind === 'official-kr-full-notice-archive')
  const crossCheckSource = event.sources.find(source => source.kind === 'bwiki-cross-check')
  assert.equal(officialSource.scope, 'KR 등장 및 기본 입수 분류')
  assert.equal(officialSource.urls.length, 5, '신규 5척별 KR 공식 공지 URL 보존')
  assert.ok(officialSource.urls.every(url => /^https:\/\/x\.com\/azurlanekorea\/status\/\d+$/.test(url)))
  assert.equal(officialArchive.scope, 'KR 공식 공지 전문 보존본 · 이벤트 기간·수령 기한·건조 확률')
  assert.deepEqual(officialArchive.urls, ['https://gall.dcinside.com/mgallery/board/view/?id=blhx&no=889749&page=1'])
  assert.equal(crossCheckSource.scope, '건조 시간 및 PT 교환량·해역 드롭·누적 PT 세부 교차검증')
  assert.equal(crossCheckSource.urls.length, 2, '건조 시간과 이벤트 획득 세부 교차검증 URL 보존')
  assert.ok(crossCheckSource.urls.every(url => url.startsWith('https://wiki.biligame.com/blhx/')))

  const expected = {
    베닝턴: { construction: { rate: '2.0%', timer: '04:25:00' }, obtain: [{ kind: 'limited-construction', label: '한정 건조 2.0% (04:25:00)', endsAt: '2026-09-10' }] },
    빅스버그: { construction: { rate: '2.0%', timer: '01:25:00' }, obtain: [{ kind: 'limited-construction', label: '한정 건조 2.0% (01:25:00)', endsAt: '2026-09-10' }] },
    해리슨: { construction: { rate: '2.5%', timer: '00:28:00' }, obtain: [{ kind: 'limited-construction', label: '한정 건조 2.5% (00:28:00)', endsAt: '2026-09-10' }] },
    콜렛: {
      construction: { rate: '0.5%', timer: '00:29:00' },
      obtain: [
        { kind: 'limited-construction', label: '한정 건조 0.5% (00:29:00)', endsAt: '2026-09-10' },
        { kind: 'event-exchange', label: '이벤트 상점 8,000 PT 교환 (최대 5회 · 09-16 23:59까지)', endsAt: '2026-09-16 23:59' },
        { kind: 'event-drop', label: '이벤트 해역 B3/D3/SP 드롭', endsAt: '2026-09-10' },
      ],
    },
    '존 로저스': { construction: null, obtain: [{ kind: 'milestone-reward', label: '누적 10,000 PT 첫 획득 (추가 20,000/40,000/60,000 PT · 건조 불가 · 09-16 23:59까지)', endsAt: '2026-09-16 23:59' }] },
  }
  const isActive = event.startsAt <= toKstDateKey() && toKstDateKey() <= event.endsAt
  for (const [name, expectation] of Object.entries(expected)) {
    const ship = data.ships.find(item => item.name === name)
    assert.ok(ship, `${name} 입수 데이터 존재`)
    assert.deepEqual(event.acquisition?.[name], expectation.obtain, `${name} 공식 획득 설정 보존`)
    assert.deepEqual(event.construction?.[name] || null, expectation.construction, `${name} 공식 건조 설정 보존`)
    assert.equal(ship.availability.key, isActive ? 'active-event' : 'rerun-wait', `${name} KR 이벤트 기간 상태`)
    if (!isActive) continue

    assert.equal(ship.availability.endsAt, event.endsAt, `${name} 이벤트 종료일`)
    assert.deepEqual(ship.obtain, [`현재 이벤트: ${event.name} (${event.endsAtLabel})`, ...expectation.obtain.map(route => route.label)], `${name} 현재 상세 입수처`)
    assert.equal(ship.build.limited, Boolean(expectation.construction), `${name} 한정 건조 여부`)
    if (expectation.construction) {
      assert.equal(ship.build.rate, expectation.construction.rate, `${name} 건조 확률`)
      assert.equal(ship.build.timer, expectation.construction.timer, `${name} 건조 시간`)
    } else {
      assert.equal(ship.build.rate, undefined, `${name} 건조 확률 없음`)
      assert.equal(ship.build.timer, null, `${name} 건조 시간 없음`)
    }
  }

  for (const name of ['베닝턴', '빅스버그', '해리슨']) {
    assert.equal(resolveEventAcquisition(event, name, '2026-09-11').phase, 'ended', `${name} 본 이벤트 종료 후 복각 대기`)
  }
  for (const name of ['콜렛', '존 로저스']) {
    const claim = resolveEventAcquisition(event, name, '2026-09-11')
    assert.equal(claim.phase, 'claim-only', `${name} 수령 기간 유지`)
    assert.equal(claim.availability.label, '이벤트 수령 기간', `${name} 수령 기간 UI 라벨`)
  }
  assert.equal(resolveEventAcquisition(event, '콜렛', '2026-09-11').buildLimited, false, '수령 기간에 콜렛 한정 건조 비활성')
}
{
  const name = '뉘른베르크(META)'
  const event = activeEvents.events.find(item => item.ships.includes(name))
  assert.ok(event, `${name} KR 이벤트 설정 존재`)
  const isActive = event.startsAt <= toKstDateKey() && toKstDateKey() <= event.endsAt
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, isActive ? 'active-event' : 'rerun-wait', `${name} KR 이벤트 기간 상태`)
}
for (const name of ['던컨', '타카하시', '막스 임멜만', '오라주', '발파라이소']) {
  const ship = data.ships.find(item => item.name === name)
  assert.equal(ship?.availability.key, 'permanent', `${name} KR 연구 도크 상시 획득`)
  assert.deepEqual(ship?.obtain, ['연구도크'], `${name} 입수처`)
  assert.equal(ship?.primaryRoute.key, 'special-exchange', `${name} 연구 개발 경로`)
}
for (const name of ['이카로스', '미유키', 'Z24', '에밀 베르탱', '어드벤처 갤리']) {
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'permanent', `${name} KR 상시편입`)
}
for (const name of ['인디펜던스', '꼬마 샌디에이고', '푸보', '로열 포춘', '하이티엔', '하이치', '우라나미']) {
  const ship = data.ships.find(item => item.name === name)
  assert.equal(ship?.availability.key, 'permanent', `${name} KR 코어 월간 교환`)
  assert.ok(ship?.obtain.includes('코어 월간 교환'), `${name} 현재 입수처 표시`)
  assert.equal(ship?.primaryRoute.key, 'core-monthly', `${name} 확정 교환을 대표 입수처로 사용`)
}

const highMapOnlyShips = data.ships.filter(ship => ship.mapDrops?.some(drop => Number(drop.stage.split('-')[0]) >= 13) && ship.acquisitionRoutes?.every(route => route.key === 'high-map-drop'))
assert.ok(highMapOnlyShips.every(ship => ship.difficulty.key === 'hard'), '13지 이상만 가능한 함선은 고난도로 분류')

const zeitz = data.ships.find(ship => ship.name === '자이틀리츠')
assert.deepEqual(zeitz?.acquisitionRoutes.find(route => route.key === 'construction')?.sources, ['중형함 상시 건조'], '영문 heavy 풀을 KR 중형함 건조로 단일 표기')

for (const name of ['이카로스', 'Z24', '어드벤처 갤리']) {
  const ship = data.ships.find(item => item.name === name)
  assert.deepEqual(ship?.obtain, ['연습 상점(랜덤 출현)'], `${name} KR 연습 상점 입수처 표기`)
  assert.equal(ship?.primaryRoute?.key, 'rotating-exchange', `${name} 랜덤 교환 난이도를 추천 정렬에 반영`)
  assert.equal(ship?.permanentSignals?.build, false, `${name}을 근거 없이 상시 건조로 분류하지 않음`)
}

const arenaShopShips = data.ships.filter(ship => ship.permanentSignals?.arenaShop)
assert.equal(arenaShopShips.length, 59, '현재 KR 연습 상점 함선 전체 집계')
assert.ok(arenaShopShips.every(ship => ship.acquisitionRoutes.some(route => route.key === 'rotating-exchange')), '연습 상점 함선의 추천 난이도와 필터 분류를 모두 연결')
assert.equal(data.ships.find(ship => ship.name === '에마누엘레 페사노')?.availability.key, 'permanent', 'KR 연습 상점 편입 함선을 복각 대기로 남기지 않음')

assert.ok(data.ships.every(ship => !ship.obtain.some(source => /상시 건조 \([^)]*상시편입\)/.test(source))), '상세 입수처가 없는 상시편입 기록을 건조로 추정하지 않음')

console.log('shipObtainability data tests passed')
