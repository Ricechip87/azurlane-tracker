import characters from '../src/data/characters.json' with { type: 'json' }
import officialShips from '../참고용/AzurLaneData/KR/ShareCfg/fleet_tech_ship_template.json' with { type: 'json' }
import { normalizeStatShipTypeValue } from '../src/utils/shipClassifications.js'

const STAT_BY_ID = {
  1: '내구',
  2: '화력',
  3: '뇌격',
  4: '대공',
  5: '항공',
  6: '장전',
  8: '명중',
  9: '회피',
  12: '대잠',
}

const SHIP_TYPE_BY_ID = {
  1: '구축',
  2: '경순',
  3: '중순',
  4: '순전',
  5: '전함',
  6: '경항모',
  7: '항모',
  8: '잠수',
  10: '항전',
  12: '공작',
  13: '모니터',
  17: '잠항모',
  18: '대형순',
  19: '운송',
  20: '구축',
  21: '구축',
  22: '범선',
  23: '범선',
  24: '범선',
}

const mismatches = []
const missingOfficial = []

for (const character of characters) {
  const official = officialShips[String(character.gid)]
  if (!official) {
    if (character.techPoints?.acquired || character.techPoints?.maxLB || character.techPoints?.lv120) {
      missingOfficial.push(character)
    }
    continue
  }

  compareStatBlock(character, 'statAcquired', {
    shipTypes: official.add_get_shiptype,
    attr: official.add_get_attr,
    value: official.add_get_value,
  })
  compareStatBlock(character, 'stat120', {
    shipTypes: official.add_level_shiptype,
    attr: official.add_level_attr,
    value: official.add_level_value,
  })
}

for (const mismatch of mismatches) {
  console.log([
    mismatch.id,
    mismatch.name,
    mismatch.field,
    `app=${formatBlock(mismatch.app)}`,
    `official=${formatBlock(mismatch.official)}`,
  ].join('\t'))
}

if (!mismatches.length) console.log('함선별 추가 스탯 데이터: 앱 데이터와 공식 원본이 일치')

if (missingOfficial.length) {
  console.log(`\n공식 원본 매칭 없음: ${missingOfficial.length}건`)
  for (const character of missingOfficial.slice(0, 30)) {
    console.log(`${character.id}\t${character.name}\tgid=${character.gid}`)
  }
}

function compareStatBlock(character, field, officialBlock) {
  const app = normalizeAppBlock(character[field])
  const official = normalizeOfficialBlock(officialBlock)

  if (blockKey(app) === blockKey(official)) return
  if (isIntentionalDisplayExpansion(app, official)) return

  mismatches.push({
    id: character.id,
    name: character.name,
    field,
    app,
    official,
  })
}

function isIntentionalDisplayExpansion(app, official) {
  return app.stat === '대잠'
    && official.stat === '대잠'
    && app.value === official.value
    && official.shipTypes.join('/') === '경항모'
    && app.shipTypes.join('/') === '경항모/항모'
}

function normalizeAppBlock(block) {
  const shipTypes = [...new Set((block?.shipTypes || []).map(normalizeStatShipTypeValue).filter(Boolean))]
  return {
    shipTypes: shipTypes.sort(),
    stat: block?.stat || '',
    value: block?.value || 0,
  }
}

function normalizeOfficialBlock(block) {
  const shipTypes = [...new Set((block.shipTypes || [])
    .map(type => SHIP_TYPE_BY_ID[type])
    .map(normalizeStatShipTypeValue)
    .filter(Boolean))]

  const stat = STAT_BY_ID[block.attr] || ''
  const value = block.value || 0
  return {
    shipTypes: stat && value ? shipTypes.sort() : [],
    stat,
    value,
  }
}

function blockKey(block) {
  return `${block.shipTypes.join('/')}:${block.stat}:${block.value}`
}

function formatBlock(block) {
  return `${block.shipTypes.join('/') || '-'} ${block.stat || '-'} +${block.value || 0}`
}
