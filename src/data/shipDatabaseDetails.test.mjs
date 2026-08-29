import assert from 'node:assert/strict'
import characters from './characters.json' with { type: 'json' }
import details from './shipDatabaseDetails.json' with { type: 'json' }

assert.equal(details.meta.shipCount, characters.length)
assert.equal(Object.keys(details.ships).length, characters.length)

assert.equal(details.ships['970213']?.className, '뉘른베르크(META)')
assert.deepEqual(details.ships['970213']?.skills.map(skill => skill.name), [
  '난국을 베는 검',
  '보물 수호',
  '빛을 좇는 불꽃·뉘른베르크II',
])
assert.ok(details.ships['970213']?.skills.every(skill => !/[\u4e00-\u9fff]/.test(`${skill.name}${skill.effect}`)), '뉘른베르크(META) 상세에 중국어를 노출하지 않는다')

for (const character of characters) {
  const detail = details.ships[String(character.gid)]
  assert.ok(detail, `${character.name} (${character.gid}) 상세 정보가 필요합니다.`)
  assert.equal('equipment' in detail, false)
  assert.equal('gift' in detail, false)
  assert.equal('giftDislike' in detail, false)

  for (const skill of detail.skills) {
    assert.ok(skill.name)
    assert.ok(skill.effect)
    assert.doesNotMatch(skill.name, /\{namecode:|\$\d+|<[^>]+>/)
    assert.doesNotMatch(skill.effect, /\{namecode:|\$\d+|<[^>]+>/)
  }
  const skillKeys = detail.skills.map(skill => skill.name)
  assert.equal(
    new Set(skillKeys).size,
    skillKeys.length,
    `${character.name} (${character.gid})에 중복 스킬이 없어야 합니다.`,
  )
  assert.ok(Number.isInteger(detail.missingSkillCount))
  assert.ok(detail.missingSkillCount >= 0)

  for (const key of Object.keys(detail.retrofit?.bonus || {})) {
    assert.doesNotMatch(key, /^equipment_proficiency_/)
  }
}

assert.deepEqual(
  details.ships['10102'].skills.map(skill => skill.name),
  ['극동의 속박', '전탄 발사 - 패러것급Ⅱ'],
)
assert.ok(
  details.ships['10103'].skills.some(skill => skill.name === '쾌속 장전' && skill.retrofit),
  '개장 추가 스킬이 최종 스킬 목록에 포함되어야 합니다.',
)
assert.ok(
  details.ships['20603'].skills.some(skill => skill.name === '유니콘의 응원' && skill.retrofit),
  '개장 후 교체 스킬도 개장 스킬로 표시해야 합니다.',
)
assert.equal(
  Object.values(details.ships).reduce((count, detail) => count + detail.missingSkillCount, 0),
  0,
  '인게임 스킬이 아닌 빈 내부 참조는 표시 대상에서 제외해야 합니다.',
)
assert.deepEqual(
  details.ships['970501'].skills.map(skill => skill.name),
  ['잿더미의 저주', '바다로 돌아온 나비', '청산·후소'],
  '후소(META)는 인게임에서 확인되는 효과 있는 스킬 세 개만 표시해야 합니다.',
)
assert.deepEqual(
  details.ships['970510'].skills.map(skill => skill.name),
  ['전투에 예포를!', '요격의 수호자'],
  '강구트(META)는 인게임에서 육성하는 본 스킬 두 개만 표시해야 합니다.',
)

for (const [gid, expectedSkills] of Object.entries({
  10156: ['특수 탄막 - 콜렛Ⅱ', '데이터 스트림 스매시', '스카이돔 시큐리티'],
  10157: ['전탄 발사 - 플레처급II', '얌전히 움직이지 마', '있는 힘껏 지키기'],
  10158: ['전탄 발사 - 플레처급II', '어디서든 참견쟁이', '최고의 랜덤 요리'],
  10236: ['특수 탄막 - 빅스버그Ⅱ', '아이돌 레슨·배틀 트레이닝', '~Lucky Power~♪'],
  10720: ['프리스타일 윙', 'Vlogger`s time'],
})) {
  assert.deepEqual(details.ships[gid]?.skills.map(skill => skill.name), expectedSkills, `${gid} 신규 함선 스킬`)
}

console.log('shipDatabaseDetails data tests passed')
