import assert from 'node:assert/strict'
import data from './shipObtainability.json' with { type: 'json' }
import activeEvents from '../../scripts/data/kr-active-events.json' with { type: 'json' }
import officialConstruction from '../../scripts/data/kr-permanent-construction.json' with { type: 'json' }
import officialMetaDossiers from '../../scripts/data/kr-meta-dossiers.json' with { type: 'json' }
import { toKstDateKey } from '../utils/kstDate.js'
import { resolveEventAcquisition } from '../utils/eventAcquisition.js'

// A committed data snapshot is verified at its generation date, not the CI machine's current date.
const snapshotDate = data.meta.asOfDate || toKstDateKey(data.meta.generatedAt)
for (const gid of [960011, 960016]) {
  const ship = data.ships.find(item => item.gid === gid)
  assert.notEqual(ship.availability.key, 'permanent', `${ship.name} 상점 예고를 현재 입수로 표시하지 않는다`)
  assert.equal(ship.permanentSignals.arenaShop, false)
  assert.equal(ship.permanentSignals.timeline, false)
  assert.deepEqual(ship.acquisitionRoutes, [])
  assert.ok(ship.obtain.includes('연습 상점 편입 예고 (적용일 미확정)'))
}
for (const [gid, pool] of [[960012, 'heavy'], [960014, 'heavy'], [960013, 'light'], [960015, 'light'], [960009, 'special'], [960007, 'heavy'], [960008, 'light'], [960010, 'light']]) {
  const ship = data.ships.find(item => item.gid === gid)
  assert.equal(ship.build[pool], true, `${ship.name} 10월 29일 공식 상시 건조`)
  assert.equal(ship.build.limited, false)
  assert.equal(ship.availability.key, 'permanent')
  assert.equal(ship.verification.officialKrOverride.source, 'https://cafe.naver.com/azurlanekorea/574927')
}
for (const gid of [960014, 960009]) {
  const ship = data.ships.find(item => item.gid === gid)
  assert.equal(ship.permanentSignals.archive, true, `${ship.name} 공식 작전문서 드랍`)
  assert.ok(ship.obtain.includes('작전문서 드랍'))
  assert.ok(ship.acquisitionRoutes.some(route => route.key === 'archive-drop'))
}
assert.match(snapshotDate, /^\d{4}-\d{2}-\d{2}$/, '입수 데이터 생성 기준일 존재')
const allowedAvailability = new Set(['permanent', 'active-event', 'upcoming-event', 'rerun-wait', 'collab-unknown', 'unknown'])
assert.equal(data.ships.length, data.meta.total)
assert.ok(data.ships.every(ship => allowedAvailability.has(ship.availability?.key)))
assert.ok(data.ships.every(ship => ship.difficulty?.key !== 'excluded'))
assert.ok(data.ships.every(ship => !JSON.stringify(ship.availability).includes('CN')))
assert.ok(data.ships.every(ship => !/대형함.*건조/.test(JSON.stringify(ship))), 'KR에 없는 대형함 건조 표기를 생성 JSON 어디에도 노출하지 않는다')
assert.ok(data.ships.every(ship => Array.isArray(ship.acquisitionRoutes)), '모든 함선에 구조화된 복수 입수처가 있어야 한다')
assert.ok(data.ships.every(ship => ship.acquisitionRoutes.length === 0 || ship.primaryRoute?.key), '입수처가 있으면 대표 입수처가 있어야 한다')
assert.equal(data.meta.acquisitionRoutes['core-monthly'], 25, 'KR 코어 월간 교환 인원 집계')

{
  const ship = data.ships.find(item => item.gid === 970113)
  const event = activeEvents.events.find(item => item.ships.includes('소브라지텔니(META)'))
  assert.ok(ship, '공식 공개된 소브라지텔니 META 입수 데이터')
  assert.equal(event.startsAt, '2026-10-08 00:00')
  assert.equal(event.endsAt, '2026-12-07 23:59')
  assert.equal(ship.availability.key, resolveEventAcquisition(event, ship.name, snapshotDate).availability?.key || 'rerun-wait')
  assert.equal(ship.build.limited, false, '월드 투어 보상을 한정 건조로 표시하지 않는다')
  assert.equal(resolveEventAcquisition(event, ship.name, '2026-09-30').availability.key, 'upcoming-event')
  assert.equal(resolveEventAcquisition(event, ship.name, '2026-10-08 00:00').availability.key, 'active-event')
  assert.equal(resolveEventAcquisition(event, ship.name, '2026-12-08 00:00').availability, null)
}

for (const name of ['쿠온', '네코네', '루루티에', '우루루', '사라나', '후미뤼르']) {
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'collab-unknown', `${name}도 다른 콜라보와 동일하게 분류`)
}
for (const name of ['셰르부르', '아로망슈', '랑트레피드']) {
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'rerun-wait', `${name} KR 이벤트 종료 후 복각 대기`)
}
for (const name of ['브리스톨(META)', '쾨니히스베르크(META)']) {
  const event = activeEvents.events.find(item => item.ships.includes(name))
  const expected = event?.startsAt <= snapshotDate && snapshotDate <= event?.endsAt ? 'active-event' : 'rerun-wait'
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, expected, `${name} KR 이벤트 기간 상태`)
}
{
  const name = '새러토가(META)'
  const event = activeEvents.events.find(item => item.ships.includes(name))
  assert.ok(event, '새러토가 META KR 비콘 도전 설정 존재')
  if (snapshotDate >= event.startsAt) {
    const ship = data.ships.find(item => item.gid === 970710)
    const resolved = resolveEventAcquisition(event, name, snapshotDate)
    assert.ok(ship, 'KR 출시 후 새러토가 META 입수 데이터 존재')
    assert.equal(ship.name, name)
    assert.equal(ship.availability.key, resolved.availability ? 'active-event' : 'rerun-wait')
    assert.deepEqual(ship.build, { light: false, heavy: false, special: false, limited: false, timer: null }, '비콘 동기화 함선을 건조 후보로 표시하지 않는다')
    if (resolved.availability) {
      assert.equal(ship.availability.endsAtLabel, '2026-12-24 점검까지')
      assert.deepEqual(ship.obtain, [
        '현재 이벤트: META전 - 새러토가 (2026-12-24 점검까지)',
        '비콘·META 도전 및 정보 동기화',
      ])
      assert.equal(ship.primaryRoute.key, 'active-event')
      assert.equal(ship.difficulty.key, 'event')
    } else {
      assert.equal(ship.primaryRoute, null)
    }
  }
}
for (const dossier of officialMetaDossiers.ships) {
  if (snapshotDate < (dossier.effectiveAt || dossier.verifiedAt)) continue
  const ship = data.ships.find(item => item.gid === dossier.gid)
  assert.ok(ship, `${dossier.name} 공식 비콘 파일 대상 존재`)
  assert.equal(ship.name, dossier.name)
  assert.equal(ship.availability.key, 'permanent', `${dossier.name} 상시 비콘 파일 입수`)
  assert.deepEqual(ship.obtain, ['META 연구실·비콘 파일'])
  assert.equal(ship.primaryRoute.key, 'special-exchange', '건조·상점 교환이 아닌 특수 연구 경로')
  assert.equal(ship.permanentSignals.other, true)
  assert.equal(ship.permanentSignals.build, false)
  assert.deepEqual(ship.verification.officialMetaDossier, dossier, '공식 현행 목록 및 신규/기존 구분 보존')
  assert.ok(ship.historicalObtain.length > 0, '원본 META 동기화 입수 이력 보존')
  assert.ok(['matched', 'different', 'local-only', 'altoy-only'].includes(ship.verification.status), '원본 간 비교 상태를 보정 여부로 덮어쓰지 않는다')
}
if (snapshotDate >= '2026-09-18') {
  for (const name of ['브리스톨(META)', '콜렛', '존 로저스']) {
    const ship = data.ships.find(item => item.name === name)
    assert.equal(ship.availability.key, 'rerun-wait', `${name} 전투 및 보상 수령 기간 모두 종료`)
    assert.equal(ship.primaryRoute, null)
    assert.equal(ship.build.limited, false)
  }
  for (const gid of [970710, 970112, 970213, 970212, 970708]) {
    const ship = data.ships.find(item => item.gid === gid)
    assert.notEqual(ship.availability.key, 'permanent', `${ship.name}은 공식 비콘 파일 명단에 없음`)
    assert.equal(ship.verification.officialMetaDossier, undefined)
  }
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
  const isActive = event.startsAt <= snapshotDate && snapshotDate <= event.endsAt
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
  assert.deepEqual(event.sources.map(source => source.kind), ['official-kr', 'official-kr-full-notice', 'official-kr-full-notice-archive', 'bwiki-cross-check'])
  const officialSource = event.sources.find(source => source.kind === 'official-kr')
  const officialNotice = event.sources.find(source => source.kind === 'official-kr-full-notice')
  const officialArchive = event.sources.find(source => source.kind === 'official-kr-full-notice-archive')
  const crossCheckSource = event.sources.find(source => source.kind === 'bwiki-cross-check')
  assert.equal(officialSource.scope, 'KR 등장 및 기본 입수 분류')
  assert.equal(officialSource.urls.length, 5, '신규 5척별 KR 공식 공지 URL 보존')
  assert.ok(officialSource.urls.every(url => /^https:\/\/x\.com\/azurlanekorea\/status\/\d+$/.test(url)))
  assert.equal(officialNotice.priority, 'primary')
  assert.equal(officialNotice.scope, 'KR 공식 업데이트 완료 공지 · 이벤트 명칭·기간·수령 기한·건조 확률')
  assert.deepEqual(officialNotice.urls, ['https://cafe.naver.com/azurlanekorea/574051'])
  assert.equal(officialArchive.priority, 'fallback')
  assert.equal(officialArchive.scope, '네이버 카페 접근 불가 시 확인하는 KR 공식 공지 전문 보존본')
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
  for (const [name, expectation] of Object.entries(expected)) {
    const ship = data.ships.find(item => item.name === name)
    assert.ok(ship, `${name} 입수 데이터 존재`)
    assert.deepEqual(event.acquisition?.[name], expectation.obtain, `${name} 공식 획득 설정 보존`)
    assert.deepEqual(event.construction?.[name] || null, expectation.construction, `${name} 공식 건조 설정 보존`)
    const resolved = resolveEventAcquisition(event, name, snapshotDate)
    assert.equal(ship.availability.key, resolved.availability ? 'active-event' : 'rerun-wait', `${name} 생성 기준일의 KR 이벤트 기간 상태`)
    if (!resolved.availability) {
      assert.equal(ship.primaryRoute, null, `${name} 수령 기간까지 종료 후 현재 입수 경로 없음`)
      assert.equal(ship.build.limited, false, `${name} 종료된 한정 건조 비활성`)
      continue
    }

    const heading = resolved.phase === 'claim-only' ? '이벤트 수령 기간' : '현재 이벤트'
    assert.equal(ship.availability.phase, resolved.phase, `${name} 본 이벤트와 보상 수령 단계 구분`)
    assert.equal(ship.availability.endsAt, resolved.availability.endsAt, `${name} 현재 가능한 입수처 종료일`)
    assert.deepEqual(ship.obtain, [`${heading}: ${event.name} (${resolved.availability.endsAtLabel})`, ...resolved.activeRoutes.map(route => route.label)], `${name} 현재 상세 입수처`)
    assert.equal(ship.build.limited, resolved.buildLimited, `${name} 한정 건조 여부`)
    if (resolved.buildLimited) {
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
    assert.equal(resolveEventAcquisition(event, name, '2026-09-16 23:59').phase, 'claim-only', `${name} 마지막 수령 시각까지 유지`)
    assert.equal(resolveEventAcquisition(event, name, '2026-09-17 00:00').phase, 'ended', `${name} 수령 기한 종료 후 비활성`)
  }
  assert.equal(resolveEventAcquisition(event, '콜렛', '2026-09-11').buildLimited, false, '수령 기간에 콜렛 한정 건조 비활성')
}
{
  const correction = activeEvents.dataCorrections?.find(item => item.ship === '벨파스트' && item.field === 'canRemodel')
  assert.ok(correction, '벨파스트 개장 판정의 KR 공식 정정 근거 보존')
  assert.equal(correction.effectiveAt, '2026-09-02')
  assert.equal(correction.value, true)
  assert.equal(correction.retrofitItem, '메이드장의 견벽')
  assert.deepEqual(correction.sources.map(source => source.kind), ['official-kr-full-notice', 'official-kr-hotfix'])
  assert.deepEqual(correction.sources.flatMap(source => source.urls), [
    'https://cafe.naver.com/azurlanekorea/574051',
    'https://cafe.naver.com/azurlanekorea/574131',
  ])
  assert.ok(correction.sources.every(source => source.priority === 'primary'), '공식 완료·수정 공지를 모두 1차 근거로 사용')
}
{
  const name = '뉘른베르크(META)'
  const event = activeEvents.events.find(item => item.ships.includes(name))
  assert.ok(event, `${name} KR 이벤트 설정 존재`)
  const isActive = event.startsAt <= snapshotDate && snapshotDate <= event.endsAt
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, isActive ? 'active-event' : 'rerun-wait', `${name} KR 이벤트 기간 상태`)
}
for (const override of officialConstruction.ships) {
  if (snapshotDate < override.effectiveAt) continue
  const ship = data.ships.find(item => item.gid === override.gid)
  assert.ok(ship, `${override.name} 공식 상시화 대상 존재`)
  assert.equal(ship.availability.key, 'permanent', `${override.name} KR 상시 건조 편입`)
  assert.equal(ship.build[override.pool], true, `${override.name} 공지에 명시된 건조 풀`)
  assert.equal(ship.build.limited, false, `${override.name} 과거 한정 건조 플래그 해제`)
  assert.equal(ship.primaryRoute.key, override.archive ? 'archive-drop' : 'construction', `${override.name} 상시 입수 추천 분류`)
  assert.deepEqual(ship.verification.officialKrOverride, override, `${override.name} 공식 보정 근거 보존`)
  assert.ok(ship.historicalObtain.length > 0, `${override.name} 원본 입수 이력 유지`)
}
{
  const name = '아마츠카제'
  const event = activeEvents.events.find(item => item.ships.includes(name))
  assert.ok(event, `${name} KR 한정 건조 설정 존재`)
  assert.equal(event.startsAt, '2026-09-10')
  assert.equal(event.endsAt, '2026-09-24')
  assert.equal(event.endsAtLabel, '2026-09-24 점검까지')
  assert.deepEqual(event.construction[name], { rate: '2.0%', timer: '00:27:00' })
  assert.deepEqual(event.acquisition[name], [{ kind: 'limited-construction', label: '소형함 한정 건조 2.0% (00:27:00)', endsAt: '2026-09-24' }])
  assert.ok(event.sources.some(source => source.priority === 'primary' && source.urls.includes('https://cafe.naver.com/azurlanekorea/574296')))
  assert.ok(event.sources.some(source => source.kind === 'bwiki-cross-check' && source.scope === '건조 시간 교차검증'))
  assert.equal(resolveEventAcquisition(event, name, '2026-09-09').availability, null, 'KR 등장 이전에는 입수 가능으로 표시하지 않음')
  assert.equal(resolveEventAcquisition(event, name, '2026-09-11').buildLimited, true)
  assert.equal(resolveEventAcquisition(event, name, '2026-09-25').availability, null, '한정 건조 종료 다음날에는 비활성')
  if (snapshotDate >= event.startsAt) {
    const ship = data.ships.find(item => item.name === name)
    const resolved = resolveEventAcquisition(event, name, snapshotDate)
    assert.ok(ship, `${name} 입수 데이터 존재`)
    assert.equal(ship.availability.key, resolved.availability ? 'active-event' : 'rerun-wait')
    if (resolved.availability) {
      assert.equal(ship.build.limited, true)
      assert.equal(ship.build.light, false, '소형함 기간 한정 추가를 소형함 상시 건조로 오인하지 않음')
      assert.equal(ship.build.rate, '2.0%')
      assert.equal(ship.build.timer, '00:27:00')
      assert.ok(ship.obtain.includes('소형함 한정 건조 2.0% (00:27:00)'))
    }
  }
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
assert.ok(arenaShopShips.length >= 59, '기존 KR JSON에서 확인된 연습 상점 함선을 누락하지 않음')
assert.ok(arenaShopShips.every(ship => ship.acquisitionRoutes.some(route => route.key === 'rotating-exchange')), '연습 상점 함선의 추천 난이도와 필터 분류를 모두 연결')
assert.equal(data.ships.find(ship => ship.name === '에마누엘레 페사노')?.availability.key, 'permanent', 'KR 연습 상점 편입 함선을 복각 대기로 남기지 않음')

if (snapshotDate >= '2026-09-10') {
  const z43 = data.ships.find(ship => ship.gid === 40143)
  assert.equal(z43?.availability.key, 'permanent', 'KR 현재 상품 목록과 ALtoy에 일치하는 Z43 연습 상점 편입 반영')
  assert.ok(z43.obtain.includes('연습 상점(랜덤 출현)'))
  assert.equal(z43.primaryRoute.key, 'rotating-exchange', 'Z43을 확정 교환·상시 건조로 오인하지 않음')
  assert.equal(z43.permanentSignals.build, false)
  const sourceNote = activeEvents.dataCorrections.find(item => item.ship === 'Z43' && item.field === 'obtain')
  assert.ok(sourceNote.reason.includes('다음 점검 후'), 'KR 공지의 시점 불확실성도 근거에 보존')
  assert.equal(sourceNote.effectiveAt, undefined, 'Z43 적용일을 임의로 단정하지 않음')
}

assert.ok(data.ships.every(ship => !ship.obtain.some(source => /상시 건조 \([^)]*상시편입\)/.test(source))), '상세 입수처가 없는 상시편입 기록을 건조로 추정하지 않음')

{
  const event = activeEvents.events.find(item => item.name === '유영 미성')
  assert.ok(event, '유영 미성 KR 이벤트 설정')
  assert.equal(event.startsAt, '2026-09-24')
  assert.equal(event.endsAt, '2026-10-16 23:59')
  assert.equal(event.claimEndsAt, '2026-10-23 23:59')
  assert.ok(event.sources.some(source => source.priority === 'primary' && source.urls.includes('https://cafe.naver.com/azurlanekorea/574487')))
  const rates = { 아즈치: '1.2%', 이14: '2.0%', 헤이스티: '2.5%', '빅토리어스(META)': '0.5%' }
  for (const name of ['호스타일', '헤이스티', '타이거', '아즈치', '이14', '빅토리어스(META)']) {
    assert.ok(event.ships.includes(name))
    const ship = data.ships.find(item => item.name === name)
    const resolved = resolveEventAcquisition(event, name, snapshotDate)
    assert.equal(ship?.availability.key, resolved.availability ? 'active-event' : 'rerun-wait', `${name} 이벤트 입수 상태`)
    assert.equal(ship.build.limited, resolved.buildLimited, `${name} 이벤트 건조 여부`)
    if (resolved.buildLimited) assert.equal(ship.build.rate, rates[name], `${name} 공식 건조 확률`)
    assert.equal(resolveEventAcquisition(event, name, '2026-09-23').phase, 'ended', `${name} 이벤트 개시 전 비활성`)
    assert.equal(resolveEventAcquisition(event, name, '2026-10-24').phase, 'ended', `${name} 보상 수령 종료 후 비활성`)
  }
  for (const name of ['아즈치', '이14', '헤이스티']) {
    assert.equal(resolveEventAcquisition(event, name, '2026-10-17').phase, 'ended')
  }
  for (const name of ['타이거', '호스타일', '빅토리어스(META)']) {
    const claim = resolveEventAcquisition(event, name, '2026-10-17')
    assert.equal(claim.phase, 'claim-only', `${name} 교환·보상 수령 기간 유지`)
    assert.equal(claim.buildLimited, false, `${name} 수령 기간 건조 종료`)
  }
  assert.ok(event.acquisition.아즈치[0].label.includes('200회'))
  assert.ok(event.acquisition.타이거[0].label.includes('200/300'))
  assert.ok(event.acquisition['빅토리어스(META)'].some(route => route.kind === 'event-exchange' && route.label.includes('8,000')))
}

{
  const event = activeEvents.informationalEvents.find(item => item.name === '유영 수용 협의')
  assert.ok(event)
  assert.equal(event.startsAt, '2026-09-24')
  assert.equal(event.rewardStartsAt, '2026-09-30', '임무 시작과 7일차 보상 개방 날짜를 구분한다')
  assert.equal(event.endsAt, '2026-10-16 23:59')
  assert.equal(event.claimEndsAt, undefined, '별도 공지 없는 보상 수령 연장 금지')
  const ship = data.ships.find(item => item.name === '골든 하인드')
  assert.equal(ship.availability.key, 'permanent', '골든 하인드 기존 상시 경로 유지')
  assert.equal(ship.build.light, true)
  assert.ok(ship.obtain.includes('소형함 상시 건조'))
}

{
  const invitation = activeEvents.informationalEvents.find(event => event.name === '특별 축제 리턴')
  assert.equal(invitation.selectionCount, 1)
  assert.equal(invitation.ships.length, 8)
  for (const name of invitation.ships) {
    assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'permanent', `${name} 초대장 추가로 상시 입수처를 숨기지 않는다`)
  }
}

if (snapshotDate >= '2026-10-08') {
  const kimberly = data.ships.find(ship => ship.gid === 970104)
  assert.equal(kimberly.availability.key, 'permanent')
  assert.equal(kimberly.primaryRoute.key, 'special-exchange')
  assert.ok(kimberly.obtain[0].includes('부서진 결정 60'))
  assert.equal(kimberly.verification.officialPermanentShop.effectiveAt, '2026-10-08')
  assert.equal(kimberly.verification.officialPermanentShop.evidence.activityTime, 'always')
  assert.ok(kimberly.historicalObtain.some(source => source.includes('월드 투어')), '과거 월드 투어 이력 보존')
}

console.log('shipObtainability data tests passed')
