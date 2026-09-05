const FACTION_DEFINITIONS = [
  { key: '유니온', label: '이글 유니온', nationality: 1 },
  { key: '노스유니온', label: '노스 유니온', nationality: 7 },
]

const AVAILABILITY_LABELS = {
  'active-event': '현재 이벤트',
  'collab-unknown': '콜라보 복각 미정',
  permanent: '상시 획득',
  'rerun-wait': '복각 대기',
}

const DIFFICULTY_LABELS = {
  easy: '쉬움',
  event: '현재 이벤트',
  hard: '어려움',
  limited: '한정',
  normal: '보통',
}

const ROUTE_LABELS = {
  'active-event': '현재 이벤트',
  'archive-drop': '작전문서 드롭',
  construction: '건조',
  'core-monthly': '코어 월간 교환',
  'fixed-exchange': '상점 확정 교환',
  'guaranteed-reward': '임무·보상',
  'high-map-drop': '고해역 드롭',
  'later-map-drop': '후반 해역 드롭',
  'map-drop': '해역 드롭',
  'rotating-exchange': '상점 랜덤 교환',
  'special-exchange': '특수 교환',
}

const VERIFICATION_LABELS = {
  'altoy-only': 'ALtoy만 확인',
  different: '원천 간 차이 있음',
  matched: '원천 일치',
}

export function formatKstTimestamp(value) {
  if (!value) return '기록 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })} KST`
}

export function buildObtainabilityAudit({ meta = {}, ships = [] }) {
  const report = {
    sourceGeneratedAt: meta.generatedAt || '',
    source: meta.source || '',
    note: meta.note || '',
    total: ships.length,
    withObtain: ships.filter(ship => Array.isArray(ship.obtain) && ship.obtain.length > 0).length,
    withoutObtain: ships.filter(ship => !Array.isArray(ship.obtain) || ship.obtain.length === 0).length,
    availability: countBy(ships, ship => ship.availability?.key),
    difficulty: countBy(ships, ship => ship.difficulty?.key),
    acquisitionRoutes: countUniqueByShip(ships, ship => ship.acquisitionRoutes?.map(route => route.key)),
    verification: countBy(ships, ship => ship.verification?.status),
  }

  const metadataFields = [
    'total',
    'withObtain',
    'withoutObtain',
    'availability',
    'difficulty',
    'acquisitionRoutes',
  ]
  report.metadataMismatches = metadataFields.flatMap(field => (
    stable(report[field]) === stable(meta[field])
      ? []
      : [{ field, expected: report[field], actual: meta[field] }]
  ))
  return report
}

export function buildObtainabilityAuditMarkdown(report) {
  const availabilityRows = renderCountRows(report.availability, AVAILABILITY_LABELS)
  const difficultyRows = renderCountRows(report.difficulty, DIFFICULTY_LABELS)
  const routeRows = renderCountRows(report.acquisitionRoutes, ROUTE_LABELS)
  const verificationRows = renderCountRows(report.verification, VERIFICATION_LABELS)
  const metadataStatus = report.metadataMismatches.length
    ? `불일치 ${report.metadataMismatches.length}건`
    : '일치'

  return `# KR 입수 상태 자동 감사\n\n` +
    `- 원천 데이터 생성 시각: ${formatKstTimestamp(report.sourceGeneratedAt)}\n` +
    `- 표시 함선: ${report.total}척\n` +
    `- 입수처 있음: ${report.withObtain}척\n` +
    `- 입수처 없음: ${report.withoutObtain}척\n` +
    `- 계산값과 내장 메타데이터: ${metadataStatus}\n` +
    `- 원천: ${report.source || '기록 없음'}\n\n` +
    `## 획득 상태\n\n` +
    `| 상태 | 함선 수 |\n|---|---:|\n${availabilityRows}\n\n` +
    `## 입수 난이도\n\n` +
    `| 구분 | 함선 수 |\n|---|---:|\n${difficultyRows}\n\n` +
    `## 입수 경로\n\n` +
    `한 함선에 여러 경로가 있으면 각 경로에 한 번씩 집계한다.\n\n` +
    `| 경로 | 함선 수 |\n|---|---:|\n${routeRows}\n\n` +
    `## 원천 대조 상태\n\n` +
    `| 상태 | 함선 수 |\n|---|---:|\n${verificationRows}\n\n` +
    `## 생성 정책\n\n` +
    `이 문서는 \`src/data/shipObtainability.json\`의 현재 값을 자동 집계한다. ` +
    `특정 함선의 과거 조사 과정이나 판단 근거를 추정하여 서술하지 않는다.\n` +
    (report.note ? `\n- 데이터 주석: ${report.note}\n` : '')
}

export function buildFactionAudit({
  generatedAt,
  characters = [],
  altoyShips = [],
  cnStatistics = {},
  derivedDatasets = {},
  researchShips = [],
}) {
  const altoyByGid = new Map(altoyShips.map(ship => [String(ship.gid), ship]))
  const characterByGid = new Map(characters.map(ship => [String(ship.gid), ship]))
  const characterByName = new Map(characters.map(ship => [ship.name, ship]))
  const sourceMismatches = []
  const missingSources = []
  const factions = {}

  for (const definition of FACTION_DEFINITIONS) {
    const members = characters.filter(ship => normalizeFaction(ship.faction) === definition.key)
    const summary = {
      appCount: members.length,
      matchedCount: 0,
      cnMatchCount: 0,
      altoyFallbackCount: 0,
      missingSourceCount: 0,
      mismatchCount: 0,
    }

    for (const ship of members) {
      const cnRecord = cnStatistics[`${ship.gid}1`]
      const altoyRecord = altoyByGid.get(String(ship.gid))
      const sourceRecord = cnRecord || altoyRecord
      const source = cnRecord ? 'CN ship_data_statistics' : 'ALtoy'
      if (!sourceRecord) {
        summary.missingSourceCount++
        missingSources.push(pickShip(ship))
        continue
      }
      if (Number(sourceRecord.nationality) !== definition.nationality) {
        summary.mismatchCount++
        sourceMismatches.push({
          ...pickShip(ship),
          source,
          expectedNationality: definition.nationality,
          actualNationality: sourceRecord.nationality,
        })
        continue
      }
      summary.matchedCount++
      if (cnRecord) summary.cnMatchCount++
      else summary.altoyFallbackCount++
    }
    factions[definition.key] = summary
  }

  for (const ship of characters.filter(character => !isAuditedFaction(normalizeFaction(character.faction)))) {
    const cnRecord = cnStatistics[`${ship.gid}1`]
    const altoyRecord = altoyByGid.get(String(ship.gid))
    const sourceRecord = cnRecord || altoyRecord
    const sourceFaction = FACTION_DEFINITIONS.find(definition => (
      definition.nationality === Number(sourceRecord?.nationality)
    ))
    if (!sourceFaction) continue
    factions[sourceFaction.key].mismatchCount++
    sourceMismatches.push({
      ...pickShip(ship),
      source: cnRecord ? 'CN ship_data_statistics' : 'ALtoy',
      expectedFaction: sourceFaction.key,
      actualFaction: normalizeFaction(ship.faction),
      expectedNationality: sourceFaction.nationality,
      actualNationality: Number(sourceRecord.nationality),
    })
  }

  const derived = Object.fromEntries(Object.entries(derivedDatasets).map(([name, records]) => [
    name,
    auditDerivedFactionRecords(records, characterByGid, characterByName),
  ]))
  const researchTechRequirements = Object.fromEntries(FACTION_DEFINITIONS.map(({ key }) => [
    key,
    researchShips.reduce((count, ship) => count + (ship.unlockRequirements || []).filter(requirement => (
      requirement.type === 'tech-points' && normalizeFaction(requirement.faction) === key
    )).length, 0),
  ]))

  return {
    generatedAt,
    appShipCount: characters.length,
    policy: {
      factions: FACTION_DEFINITIONS,
      sourcePriority: ['CN ship_data_statistics', 'ALtoy nationality fallback'],
    },
    factions,
    sourceMismatches,
    missingSources,
    derived,
    researchTechRequirements,
  }
}

export function buildFactionAuditMarkdown(report) {
  const factionRows = FACTION_DEFINITIONS.map(({ key, label, nationality }) => {
    const value = report.factions[key]
    return `| ${label} | ${value.appCount} | ${nationality} | ` +
      `CN ${value.cnMatchCount}척 / ALtoy 보완 ${value.altoyFallbackCount}척 | ` +
      `${value.missingSourceCount} | ${value.mismatchCount} |`
  }).join('\n')
  const derivedLabels = {
    growthRecommendations: 'growthRecommendations.json',
    shipObtainability: 'shipObtainability.json',
    researchRecommendations: 'researchRecommendations.json',
  }
  const derivedRows = Object.entries(report.derived).map(([name, value]) => (
    `| \`${derivedLabels[name] || name}\` | ${value.checkedCount} | ${value.missingCount} | ${value.mismatchCount} |`
  )).join('\n')
  const requirementRows = FACTION_DEFINITIONS.map(({ key, label }) => (
    `| ${label} | ${report.researchTechRequirements[key] || 0} |`
  )).join('\n')

  return `# 이글 유니온 / 노스 유니온 진영 자동 감사\n\n` +
    `- 기준 데이터 생성 시각: ${report.generatedAt}\n` +
    `- 앱 전체 함선: ${report.appShipCount}척\n` +
    `- 진영 대조 원천 누락: ${report.missingSources.length}건\n` +
    `- 진영 대조 원천과 불일치: ${report.sourceMismatches.length}건\n\n` +
    `## 캐릭터 데이터\n\n` +
    `| 구분 | 앱 건수 | 기대 nationality | 원천 일치 | 원천 누락 | 불일치 |\n` +
    `|---|---:|---:|---|---:|---:|\n${factionRows}\n\n` +
    `CN 원본에서 gid를 찾지 못한 함선은 같은 gid의 ALtoy \`nationality\`를 사용해 보완한다.\n\n` +
    `## 파생 데이터\n\n` +
    `앱 캐릭터와 gid를 우선 대조하고, gid가 없을 때만 정확한 이름을 사용한다.\n\n` +
    `| 파일 | 대조 건수 | 캐릭터 누락 | 진영 불일치 |\n` +
    `|---|---:|---:|---:|\n${derivedRows}\n\n` +
    `## 개발함 기술점수 조건\n\n` +
    `| 요구 진영 | 조건 수 |\n|---|---:|\n${requirementRows}\n\n` +
    `## 생성 정책\n\n` +
    `- 내부 값 \`유니온\`은 이글 유니온, \`노스유니온\`은 노스 유니온으로 표시한다.\n` +
    `- 원천 우선순위: ${report.policy.sourcePriority.join(' → ')}\n` +
    `- 이 문서는 현재 데이터에서 계산 가능한 수치만 기록하며 과거 조사 서술을 자동 생성하지 않는다.\n`
}

function auditDerivedFactionRecords(records, characterByGid, characterByName) {
  const checked = []
  const missing = []
  const mismatches = []
  for (const record of records || []) {
    const character = record.gid == null
      ? characterByName.get(record.name)
      : characterByGid.get(String(record.gid))
    const sourceFaction = normalizeFaction(record.faction)
    const characterFaction = normalizeFaction(character?.faction)
    if (!isAuditedFaction(sourceFaction) && !isAuditedFaction(characterFaction)) continue
    checked.push(record)
    if (!character) {
      missing.push(pickShip(record))
      continue
    }
    if (sourceFaction !== characterFaction) {
      mismatches.push({
        ...pickShip(record),
        expectedFaction: characterFaction,
        actualFaction: sourceFaction,
      })
    }
  }
  return {
    checkedCount: checked.length,
    missingCount: missing.length,
    mismatchCount: mismatches.length,
    missing,
    mismatches,
  }
}

function countBy(items, selectKey) {
  const counts = new Map()
  for (const item of items) {
    const key = selectKey(item)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right, 'en')))
}

function countUniqueByShip(items, selectKeys) {
  const counts = new Map()
  for (const item of items) {
    for (const key of new Set((selectKeys(item) || []).filter(Boolean))) {
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right, 'en')))
}

function renderCountRows(counts, labels = {}) {
  return Object.entries(counts).map(([key, count]) => `| ${labels[key] || key} | ${count} |`).join('\n')
}

function normalizeFaction(value) {
  if (value === '이글 유니온') return '유니온'
  if (value === '노스 유니온') return '노스유니온'
  return value
}

function isAuditedFaction(value) {
  return FACTION_DEFINITIONS.some(definition => definition.key === value)
}

function pickShip(ship) {
  return { id: ship.id, gid: ship.gid, name: ship.name }
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
