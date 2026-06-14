import fs from 'node:fs'
import path from 'node:path'
import characters from '../src/data/characters.json' with { type: 'json' }

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCES = [
  {
    key: 'main',
    label: '메인해역',
    audience: '벽청년 이상',
    file: '참고용/벽람 함순이도감 v2.1.8_배포용의 사본 - [ 인식각성 추천표(메인해역).csv',
  },
  {
    key: 'operation-siren',
    label: '대작전',
    audience: '벽청년 이상',
    file: '참고용/벽람 함순이도감 v2.1.8_배포용의 사본 - 인식각성 추천표(대작전).csv',
  },
  {
    key: 'newbie',
    label: '맨땅뉴비',
    audience: '벽뉴비 권장',
    file: '참고용/벽람 함순이도감 v2.1.8_배포용의 사본 - 맨땅뉴비 추천 함순이표.csv',
  },
]

const OUTPUT_PATH = path.join(ROOT, 'src/data/growthRecommendations.json')
const REPORT_DIR = path.join(ROOT, 'reports')
const RECOMMENDATION_REPORT_PATH = path.join(REPORT_DIR, 'growthRecommendations.review.csv')
const UNMATCHED_REPORT_PATH = path.join(REPORT_DIR, 'growthRecommendations.unmatched.csv')
const RECOMMENDATION_TEXT_REPORT_PATH = path.join(REPORT_DIR, 'growthRecommendations.review.txt')
const UNMATCHED_TEXT_REPORT_PATH = path.join(REPORT_DIR, 'growthRecommendations.unmatched.txt')
const characterByName = new Map()
for (const character of characters) {
  for (const key of buildNameKeys(character.name)) {
    if (!characterByName.has(key)) characterByName.set(key, character)
  }
}
const TIER_PATTERN = /^(?:SS\+?|S\+?|S-|A\+?|B\+?|C\+?|D\+?)\s*급?|^상시|^힐러|^잠수|^연구함|^신규/
const GROUP_PATTERN = /(구축|경순|중순|대순|항모|경항모|전함|순전|버퍼|디버퍼|힐러|잠수|연구함|상시|이벤트|무딱|DD|CL|CA|CV|CVL|BB|BC)/
const NON_NAME_HINTS = [
  'Credits to:',
  '보는법',
  '최신화 날짜',
  '이전 버전',
  '전열',
  '후열',
  '코멘트',
  '대공요구치',
  '빨간 테두리',
  '하늘색',
  '짙은 파란색',
]

function normalizeName(value) {
  return String(value || '').trim()
}

function buildNameKeys(value) {
  const trimmed = normalizeName(value)
  const withoutParentheses = trimmed.replace(/\s*\([^)]*\)\s*/g, '').trim()
  const compact = withoutParentheses
    .replace(/\s+/g, '')
    .replace(/Ⅱ/g, 'II')
    .replace(/Ⅲ/g, 'III')
    .replace(/Ⅳ/g, 'IV')
    .replace(/Ⅴ/g, 'V')

  return [...new Set([
    trimmed,
    withoutParentheses,
    compact,
  ].filter(Boolean))]
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  row.push(field)
  rows.push(row)
  return rows
}

function cleanCell(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isTierCell(value) {
  const firstLine = cleanCell(value).split('\n').find(Boolean) || ''
  return TIER_PATTERN.test(firstLine)
}

function normalizeTier(value) {
  const text = cleanCell(value)
  const firstLine = text.split('\n').find(Boolean) || ''
  const match = firstLine.match(/SS\+|SS|S\+|S-|S|A\+|A|B\+|B|C\+|C|D\+|D|상시 무딱|힐러|잠수|연구함|신규 이벤트/)
  return match ? match[0] : firstLine
}

function isGroupCell(value) {
  const text = cleanCell(value)
  if (!text || text.length > 30) return false
  if (isTierCell(text)) return false
  return GROUP_PATTERN.test(text)
}

function buildColumnGroups(rows) {
  const groups = []

  rows.forEach((row, rowIndex) => {
    if (rowIndex > 4) return

    row.forEach((cell, columnIndex) => {
      const text = cleanCell(cell)
      if (!isGroupCell(text)) return
      groups.push({ row: rowIndex, column: columnIndex, label: text })
    })
  })

  return groups.sort((a, b) => a.column - b.column || a.row - b.row)
}

function findColumnGroup(columnIndex, groups) {
  let current = null

  for (const group of groups) {
    if (group.column > columnIndex) break
    current = group
  }

  return current?.label || ''
}

function findTier(rows, rowIndex) {
  for (let index = rowIndex; index >= Math.max(0, rowIndex - 8); index -= 1) {
    const firstCell = cleanCell(rows[index]?.[0])
    if (isTierCell(firstCell)) return normalizeTier(firstCell)
  }

  return ''
}

function findRoleNote(rows, rowIndex, columnIndex) {
  const candidates = [
    rows[rowIndex + 1]?.[columnIndex],
    rows[rowIndex + 1]?.[columnIndex + 1],
    rows[rowIndex + 2]?.[columnIndex],
  ]

  return cleanCell(candidates.find(candidate => cleanCell(candidate)) || '')
}

function isProbablyNameCell(value) {
  const text = cleanCell(value)
  if (!text) return false
  if (text.length > 30) return false
  if (NON_NAME_HINTS.some(hint => text.includes(hint))) return false
  if (isTierCell(text) || isGroupCell(text)) return false
  return true
}

function extractSource(source) {
  const filePath = path.join(ROOT, source.file)
  const csv = fs.readFileSync(filePath, 'utf8')
  const rows = parseCsv(csv)
  const groups = buildColumnGroups(rows)
  const candidates = []
  const unmatched = []

  rows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      const name = cleanCell(cell)
      if (!isProbablyNameCell(name)) return

      const character = buildNameKeys(name).map(key => characterByName.get(key)).find(Boolean)
      if (!character) {
        if (/^[가-힣A-Za-z0-9 .·μ()ⅡⅢ-]+$/.test(name) && name.length <= 20) {
          unmatched.push({
            source: source.key,
            name,
            row: rowIndex + 1,
            column: columnIndex + 1,
          })
        }
        return
      }

      candidates.push({
        source: source.key,
        sourceLabel: source.label,
        audience: source.audience,
        id: character.id,
        name: character.name,
        rarity: character.rarity,
        faction: character.faction,
        shipType: character.shipType,
        tier: findTier(rows, rowIndex),
        sheetGroup: findColumnGroup(columnIndex, groups),
        roleNote: findRoleNote(rows, rowIndex, columnIndex),
        row: rowIndex + 1,
        column: columnIndex + 1,
      })
    })
  })

  const matchedCountByRow = new Map()
  for (const candidate of candidates) {
    matchedCountByRow.set(candidate.row, (matchedCountByRow.get(candidate.row) || 0) + 1)
  }

  const recommendations = []
  for (const candidate of candidates) {
    if ((matchedCountByRow.get(candidate.row) || 0) >= 2) {
      recommendations.push(candidate)
    } else {
      unmatched.push({
        source: source.key,
        name: candidate.name,
        row: candidate.row,
        column: candidate.column,
        reason: 'single matched name row',
      })
    }
  }

  return {
    source,
    rows: rows.length,
    columns: Math.max(...rows.map(row => row.length)),
    recommendations,
    unmatched,
  }
}

function dedupeRecommendations(recommendations) {
  const seen = new Set()
  const result = []

  for (const recommendation of recommendations) {
    const key = [
      recommendation.source,
      recommendation.id,
      recommendation.tier,
      recommendation.sheetGroup,
      recommendation.roleNote,
      recommendation.row,
      recommendation.column,
    ].join('|')

    if (seen.has(key)) continue
    seen.add(key)
    result.push(recommendation)
  }

  return result
}

function toCsvValue(value) {
  const text = String(value ?? '')
  if (!/[",\n\r]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function writeCsv(filePath, rows) {
  const csv = rows
    .map(row => row.map(toCsvValue).join(','))
    .join('\n')

  fs.writeFileSync(filePath, `${csv}\n`, 'utf8')
}

function groupBy(items, getKey) {
  const groups = new Map()

  for (const item of items) {
    const key = getKey(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }

  return groups
}

function formatNote(note) {
  return String(note || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' / ')
}

function writeRecommendationTextReport(filePath, items) {
  const lines = [
    '육성 추천표 자동 추출 결과',
    '',
    `총 추천 엔트리: ${items.length}`,
    '표기: 함선명 [등급/진영/함종] - 역할 메모 (원본 row:column)',
    '',
  ]

  const bySource = groupBy(items, item => `${item.sourceLabel} / ${item.audience}`)
  for (const [sourceLabel, sourceItems] of bySource) {
    lines.push(`## ${sourceLabel}`)
    lines.push('')

    const byTier = groupBy(sourceItems, item => item.tier || '티어 미확인')
    for (const [tier, tierItems] of byTier) {
      lines.push(`### ${tier}`)

      const byGroup = groupBy(tierItems, item => item.sheetGroup || '분류 미확인')
      for (const [sheetGroup, groupItems] of byGroup) {
        lines.push(`- ${sheetGroup}`)
        for (const item of groupItems) {
          const note = formatNote(item.roleNote)
          const noteText = note ? ` - ${note}` : ''
          lines.push(`  - ${item.name} [${item.rarity}/${item.faction}/${item.shipType}]${noteText} (${item.row}:${item.column})`)
        }
      }

      lines.push('')
    }
  }

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8')
}

function writeUnmatchedTextReport(filePath, items) {
  const lines = [
    '육성 추천표 미매칭/검토 후보',
    '',
    `총 검토 후보: ${items.length}`,
    '설명 텍스트가 포함될 수 있으므로 실제 누락 함선인지 원본 좌표 기준으로 확인합니다.',
    '',
  ]

  const bySource = groupBy(items, item => item.source)
  for (const [source, sourceItems] of bySource) {
    lines.push(`## ${source}`)
    for (const item of sourceItems) {
      lines.push(`- ${item.name} (${item.row}:${item.column}) - ${item.reason || 'not matched'}`)
    }
    lines.push('')
  }

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8')
}

const extracted = SOURCES.map(extractSource)
const recommendations = dedupeRecommendations(extracted.flatMap(result => result.recommendations))
const unmatched = extracted.flatMap(result => result.unmatched)

const output = {
  notes: [
    'Generated from reference CSV files in 참고용.',
    'Reference files are read-only inputs; edit the extraction script or source CSV exports to regenerate.',
    'row and column are 1-based CSV coordinates for manual review.',
  ],
  sources: SOURCES.map(source => ({
    key: source.key,
    label: source.label,
    audience: source.audience,
    file: source.file,
  })),
  recommendations,
  review: {
    unmatched: unmatched.slice(0, 300),
    unmatchedTotal: unmatched.length,
  },
}

fs.mkdirSync(REPORT_DIR, { recursive: true })
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
writeCsv(RECOMMENDATION_REPORT_PATH, [
  ['source', 'sourceLabel', 'audience', 'tier', 'sheetGroup', 'name', 'id', 'rarity', 'faction', 'shipType', 'roleNote', 'row', 'column'],
  ...recommendations.map(item => [
    item.source,
    item.sourceLabel,
    item.audience,
    item.tier,
    item.sheetGroup,
    item.name,
    item.id,
    item.rarity,
    item.faction,
    item.shipType,
    item.roleNote,
    item.row,
    item.column,
  ]),
])
writeCsv(UNMATCHED_REPORT_PATH, [
  ['source', 'name', 'row', 'column', 'reason'],
  ...unmatched.map(item => [
    item.source,
    item.name,
    item.row,
    item.column,
    item.reason || 'not matched',
  ]),
])
writeRecommendationTextReport(RECOMMENDATION_TEXT_REPORT_PATH, recommendations)
writeUnmatchedTextReport(UNMATCHED_TEXT_REPORT_PATH, unmatched)

for (const result of extracted) {
  console.log(`${result.source.label}: rows=${result.rows} columns=${result.columns} matched=${result.recommendations.length} unmatchedCandidates=${result.unmatched.length}`)
}

console.log(`totalRecommendations=${recommendations.length}`)
console.log(`reviewUnmatchedTotal=${unmatched.length}`)
console.log(`wrote ${path.relative(ROOT, OUTPUT_PATH)}`)
console.log(`wrote ${path.relative(ROOT, RECOMMENDATION_REPORT_PATH)}`)
console.log(`wrote ${path.relative(ROOT, UNMATCHED_REPORT_PATH)}`)
console.log(`wrote ${path.relative(ROOT, RECOMMENDATION_TEXT_REPORT_PATH)}`)
console.log(`wrote ${path.relative(ROOT, UNMATCHED_TEXT_REPORT_PATH)}`)
