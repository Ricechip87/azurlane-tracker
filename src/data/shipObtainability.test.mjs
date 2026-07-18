import assert from 'node:assert/strict'
import data from './shipObtainability.json' with { type: 'json' }

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
for (const name of ['셰르부르', '아로망슈', '랑트레피드', '브리스톨(META)', '쾨니히스베르크(META)']) {
  assert.equal(data.ships.find(ship => ship.name === name)?.availability.key, 'active-event', `${name} KR 현재 획득 가능`)
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
