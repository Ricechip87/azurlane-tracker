import assert from 'node:assert/strict'
import {
  PREFER_ALTOY_GIDS,
  selectObtainSources,
  resolveOfficialConstruction,
} from './obtainability-sources.mjs'
import { classifyObtainability } from './obtainability-classifier.mjs'
import officialConstruction from '../data/kr-permanent-construction.json' with { type: 'json' }
import activeEvents from '../data/kr-active-events.json' with { type: 'json' }
import officialMetaDossiers from '../data/kr-meta-dossiers.json' with { type: 'json' }
import characters from '../../src/data/characters.json' with { type: 'json' }
import * as obtainabilitySources from './obtainability-sources.mjs'
import { resolveEventAcquisition } from '../../src/utils/eventAcquisition.js'

{
  const row = officialConstruction.ships.find(item => item.gid === 960014)
  const lite = { gid: 960014, heavy: false, limited: true }
  assert.equal(resolveOfficialConstruction({ gid: 960014, lite, overrides: [row], today: '2026-10-28' }).override, null)
  assert.equal(resolveOfficialConstruction({ gid: 960014, lite, overrides: [row], today: '2026-10-29' }).override.archive, '템페스타와 자유 군도')
  assert.deepEqual(lite, { gid: 960014, heavy: false, limited: true }, '공식 보완은 원본 플래그를 수정하지 않는다')
  assert.equal(resolveOfficialConstruction({ gid: 960014, lite, overrides: [{ ...row, archive: undefined }], today: '2026-10-30' }).override.archive, undefined)
  for (const archive of [true, 1, '', null, {}]) {
    assert.throws(() => resolveOfficialConstruction({ gid: 960014, lite, overrides: [{ ...row, archive }], today: '2026-10-30' }), /공식 작전문서 이름/)
  }
}

const saratogaEvent = activeEvents.events.find(event => event.ships.includes('새러토가(META)'))
assert.ok(saratogaEvent, '9월 17일 KR 공식 새러토가 META 비콘 이벤트 설정 존재')
assert.equal(saratogaEvent.startsAt, '2026-09-17')
assert.equal(saratogaEvent.endsAt, '2026-12-24')
assert.equal(saratogaEvent.endsAtLabel, '2026-12-24 점검까지')
assert.ok(saratogaEvent.sources.some(source => source.priority === 'primary' && source.urls.includes('https://cafe.naver.com/azurlanekorea/574395')))
assert.equal(resolveEventAcquisition(saratogaEvent, '새러토가(META)', '2026-09-16').availability, null, 'KR 출시 이전 비활성')
const activeSaratoga = resolveEventAcquisition(saratogaEvent, '새러토가(META)', '2026-09-18')
assert.equal(activeSaratoga.availability.key, 'active-event')
assert.equal(activeSaratoga.buildLimited, false, 'META 비콘을 한정 건조로 분류하지 않는다')
assert.deepEqual(activeSaratoga.activeRoutes.map(route => route.label), ['비콘·META 도전 및 정보 동기화'])
assert.equal(resolveEventAcquisition(saratogaEvent, '새러토가(META)', '2026-12-25').availability, null, '도전 종료 후 현재 경로 없음')
for (const name of ['브리스톨(META)', '콜렛', '존 로저스']) {
  const event = activeEvents.events.find(row => row.ships.includes(name))
  const ended = resolveEventAcquisition(event, name, '2026-09-18')
  assert.equal(ended.availability, null, `${name} 이전 도전 및 보상 수령까지 종료`)
  assert.deepEqual(ended.activeRoutes, [], `${name} 현재 입수처 없음`)
  assert.equal(ended.buildLimited, false)
}

const hornetDossier = {
  gid: 970706,
  name: '호넷(META)',
  effectiveAt: '2026-09-17',
  obtain: ['META 연구실·비콘 파일'],
  source: 'https://cafe.naver.com/azurlanekorea/574395',
}
assert.equal(typeof obtainabilitySources.resolveOfficialMetaDossier, 'function', '공식 비콘 파일 편입은 날짜와 gid로 제한해 해석한다')
const resolveDossier = obtainabilitySources.resolveOfficialMetaDossier
assert.equal(resolveDossier({ gid: 970706, dossiers: [hornetDossier], today: '2026-09-16' }), null, '효력일 전에는 상시 비콘 파일로 변경하지 않는다')
assert.equal(resolveDossier({ gid: 970706, dossiers: [hornetDossier], today: '2026-09-17' }), hornetDossier, '효력일 이후에만 공식 보정 적용')
const verifiedExistingDossier = { ...hornetDossier, gid: 970701, name: '히류(META)', effectiveAt: undefined, verifiedAt: '2026-09-17' }
assert.equal(resolveDossier({ gid: 970701, dossiers: [verifiedExistingDossier], today: '2026-09-16' }), null, '기존 함선의 과거 편입일은 확인일로부터 역산하지 않는다')
assert.equal(resolveDossier({ gid: 970701, dossiers: [verifiedExistingDossier], today: '2026-09-18' }), verifiedExistingDossier, '현재 목록에서 확인된 기존 비콘 파일도 상시 입수로 판정')
for (const gid of [970710, 970112, 970109]) {
  assert.equal(resolveDossier({ gid, dossiers: [hornetDossier], today: '2026-09-18' }), null, `${gid} 미기재 META를 일괄 상시화하지 않는다`)
}
const dossierClassification = classifyObtainability({ faction: 'META', obtain: hornetDossier.obtain, permanentSignals: { other: true } })
assert.equal(dossierClassification.availability.key, 'permanent')
assert.equal(dossierClassification.primaryRoute.key, 'special-exchange')
assert.deepEqual(dossierClassification.primaryRoute.sources, ['META 연구실·비콘 파일'])

assert.deepEqual(officialMetaDossiers.ships.map(({ gid, name }) => [gid, name]), [
  [970706, '호넷(META)'], [970705, '다이호(META)'], [970506, '나가토(META)'],
  [970304, '위치타(META)'], [970505, '로드니(META)'], [970206, '키로프(META)'],
  [970205, '진츠(META)'], [970302, '알제리(META)'], [970504, '퀸 엘리자베스(META)'],
  [970503, '애리조나(META)'], [970404, '리나운(META)'], [970403, '리펄스(META)'],
  [970402, '샤른호르스트(META)'], [970401, '그나이제나우(META)'], [970703, '소류(META)'],
  [970201, '헬레나(META)'], [970702, '아크 로열(META)'], [970701, '히류(META)'],
], '공식 완료 공지의 18척만 정확한 gid와 도감 이름으로 대응')
for (const dossier of officialMetaDossiers.ships) {
  assert.equal(characters.find(ship => ship.gid === dossier.gid)?.name, dossier.name, '기존 도감 identity와 일치')
  assert.equal(dossier.source, 'https://cafe.naver.com/azurlanekorea/574395')
  assert.equal(dossier.verifiedAt, '2026-09-17')
  assert.deepEqual(dossier.obtain, ['META 연구실·비콘 파일'])
  assert.equal(dossier.effectiveAt, dossier.gid === 970706 ? '2026-09-17' : undefined, '호넷만 신규 편입일을 확정하며 기존 함선 편입일은 추정하지 않는다')
  assert.equal(dossier.change, dossier.gid === 970706 ? 'new-dossier' : 'verified-existing-dossier')
  assert.equal(resolveDossier({ gid: dossier.gid, dossiers: officialMetaDossiers.ships, today: '2026-09-16' }), null)
  assert.equal(resolveDossier({ gid: dossier.gid, dossiers: officialMetaDossiers.ships, today: '2026-09-18' }), dossier)
}
assert.equal(officialMetaDossiers.ships.find(row => row.gid === 970404).noticeName, '리나온·META', '공지 원문 표기도 별도 보존')
assert.equal(officialMetaDossiers.ships.find(row => row.gid === 970403).noticeName, '리벌스·META')
for (const gid of [970710, 970112, 970213, 970212, 970708]) {
  assert.equal(resolveDossier({ gid, dossiers: officialMetaDossiers.ships, today: '2026-09-18' }), null, `${gid} 현행 도전·월드 투어·미편입 META는 비콘 파일 상시로 추정하지 않는다`)
}

assert.equal(PREFER_ALTOY_GIDS.size, 21)
assert.ok(PREFER_ALTOY_GIDS.has(40505), '비스마르크 Zwei must prefer current ALtoy obtainability')
assert.ok(PREFER_ALTOY_GIDS.has(970101), '헌터(META) must prefer the META shop source')

assert.deepEqual(selectObtainSources({
  gid: 40505,
  localKrObtain: ['한정 이벤트: 오엽각 교차점'],
  altoyObtain: ['이벤트: 오엽각 교차점', '상설 UR 함선 교환'],
}), ['이벤트: 오엽각 교차점', '상설 UR 함선 교환'])

assert.deepEqual(selectObtainSources({
  gid: 10102,
  localKrObtain: ['KR 입수처'],
  altoyObtain: ['ALtoy 입수처'],
}), ['KR 입수처'])

assert.deepEqual(selectObtainSources({
  gid: 10300010,
  localKrObtain: [],
  altoyObtain: ['이벤트：저편에서의 만남'],
}), ['이벤트：저편에서의 만남'])

const officialOverride = {
  gid: 40406,
  name: '알비트',
  effectiveAt: '2026-09-10',
  pool: 'heavy',
  source: 'https://cafe.naver.com/azurlanekorea/574296',
}
const staleLite = Object.freeze({ gid: 40406, light: false, heavy: false, special: false, limited: true, timer: '04:35:00' })
const beforePermanent = resolveOfficialConstruction({ gid: 40406, lite: staleLite, overrides: [officialOverride], today: '2026-09-09' })
assert.equal(beforePermanent.override, null, '시행일 이전에는 공식 상시화 예고를 현재 입수처로 사용하지 않는다')
assert.equal(beforePermanent.lite, staleLite, '미적용 원본 유지')
const permanent = resolveOfficialConstruction({ gid: 40406, lite: staleLite, overrides: [officialOverride], today: '2026-09-10' })
assert.deepEqual(permanent.lite, { ...staleLite, heavy: true, limited: false }, '공식 완료 공지의 정확한 건조 풀과 한정 종료를 반영')
assert.equal(permanent.override, officialOverride, '공식 보정 근거를 원본 검증 상태와 별도로 보존')
assert.equal(staleLite.heavy, false, '원본 객체를 덮어쓰지 않는다')
assert.equal(resolveOfficialConstruction({ gid: 40143, lite: staleLite, overrides: [officialOverride], today: '2026-09-11' }).override, null, '공지에 없는 함선은 추정하지 않는다')
const classification = classifyObtainability({
  faction: '철혈',
  obtain: ['중형함 상시 건조'],
  permanentSignals: { build: permanent.lite.heavy },
})
assert.equal(classification.availability.key, 'permanent')
assert.equal(classification.primaryRoute.key, 'construction')
assert.equal(classification.difficulty.key, 'normal')

assert.deepEqual(officialConstruction.ships.filter(row => row.effectiveAt === '2026-09-10').map(({ gid, name, pool }) => ({ gid, name, pool })), [
  { gid: 40406, name: '알비트', pool: 'heavy' },
  { gid: 40147, name: 'Z47', pool: 'light' },
  { gid: 40813, name: 'U-31', pool: 'special' },
], '9월 10일 KR 공지가 확정한 상시 건조 3척과 건조 풀만 보정')
for (const override of officialConstruction.ships.filter(row => row.effectiveAt === '2026-09-10')) {
  assert.equal(override.effectiveAt, '2026-09-10')
  assert.equal(override.source, 'https://cafe.naver.com/azurlanekorea/574296')
  const resolved = resolveOfficialConstruction({ gid: override.gid, lite: {}, overrides: officialConstruction.ships, today: '2026-09-11' })
  assert.equal(resolved.lite[override.pool], true)
  assert.equal(resolved.lite.limited, false)
  assert.equal(resolved.override.name, override.name)
}
