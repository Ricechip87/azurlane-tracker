import { COLLAB_FACTIONS } from '../../src/utils/collabFactions.js'

const AVAILABILITY = {
  PERMANENT: { key: 'permanent', label: '상시 획득' },
  ACTIVE_EVENT: { key: 'active-event', label: '현재 이벤트' },
  RERUN_WAIT: { key: 'rerun-wait', label: '복각 대기' },
  COLLAB_UNKNOWN: { key: 'collab-unknown', label: '콜라보 복각 미정' },
  UNKNOWN: { key: 'unknown', label: '미확인' },
}

const DIFFICULTY = {
  EASY: { key: 'easy', label: '쉬움' }, NORMAL: { key: 'normal', label: '보통' },
  HARD: { key: 'hard', label: '어려움' }, LIMITED: { key: 'limited', label: '현재 획득 불가' },
  EVENT: { key: 'event', label: '이벤트' }, UNKNOWN: { key: 'unknown', label: '미확인' },
}

export function classifyObtainability({ faction, obtain = [], permanentSources = [], mapDrops = [], permanentSignals = {}, activeEvent = null }) {
  const permanent = Object.values(permanentSignals).some(Boolean)
  let availability
  if (permanent) availability = AVAILABILITY.PERMANENT
  else if (activeEvent) availability = activeEvent.availability
    || { ...AVAILABILITY.ACTIVE_EVENT, eventName: activeEvent.name, endsAt: activeEvent.endsAt }
  else if (COLLAB_FACTIONS.has(faction)) availability = AVAILABILITY.COLLAB_UNKNOWN
  else if (faction === 'META' && obtain.length > 0) availability = AVAILABILITY.RERUN_WAIT
  else if (obtain.some(source => /이벤트|기간 한정|한정 건조/.test(source))) availability = AVAILABILITY.RERUN_WAIT
  else availability = AVAILABILITY.UNKNOWN
  const acquisitionRoutes = classifyAcquisitionRoutes({ obtain, mapDrops, permanentSignals, availability, activeEvent })
  const primaryRoute = acquisitionRoutes[0] || null
  return {
    availability,
    acquisitionRoutes,
    primaryRoute,
    difficulty: classifyDifficulty({ obtain, permanentSources, mapDrops, permanentSignals, availability, primaryRoute }),
  }
}

function classifyDifficulty({ obtain, permanentSources, mapDrops, permanentSignals, availability, primaryRoute }) {
  if (availability.key === 'active-event') return { ...DIFFICULTY.EVENT, reasons: ['현재 진행 중인 KR 이벤트'] }
  if (availability.key === 'rerun-wait' || availability.key === 'collab-unknown') return { ...DIFFICULTY.LIMITED, reasons: [availability.label] }
  if (availability.key !== 'permanent') return { ...DIFFICULTY.UNKNOWN, reasons: [] }
  const sources = [...new Set([...obtain, ...permanentSources])]
  const rank = primaryRoute?.rank ?? 2
  const difficulty = rank <= 1 ? DIFFICULTY.EASY : rank >= 3 ? DIFFICULTY.HARD : DIFFICULTY.NORMAL
  return { ...difficulty, reasons: [...new Set([...permanentReasons(permanentSignals), ...sources.filter(source => !/이벤트|기간 한정|한정 건조/.test(source))])] }
}

function classifyAcquisitionRoutes({ obtain, mapDrops, permanentSignals, availability, activeEvent }) {
  if (availability.key === 'active-event') {
    const label = activeEvent?.phase === 'claim-only' ? '이벤트 수령 기간' : '현재 이벤트'
    const source = activeEvent?.name ? `${label} ${activeEvent.name}` : label
    return [route('active-event', label, 'limited-time', 1, [source])]
  }
  if (availability.key !== 'permanent') return []

  const currentSources = [...new Set(obtain)]
    .filter(source => !/이벤트|기간 한정|한정 건조/.test(source))
  const routes = []
  const add = (key, label, certainty, rank, sources) => {
    const normalizedSources = [...new Set(sources.filter(Boolean))]
    if (!normalizedSources.length || routes.some(item => item.key === key)) return
    routes.push(route(key, label, certainty, rank, normalizedSources))
  }

  const coreSources = currentSources.filter(source => /코어.*(월간|교환|상점)/.test(source))
  if (permanentSignals.coreMonthly) coreSources.unshift('코어 월간 교환')
  add('core-monthly', '코어 월간 교환', 'guaranteed', 0, coreSources)

  const fixedExchangeSources = currentSources.filter(source => /^(함대 상점|군수 상점|훈장 상점|상점의 대함대|원형 상점|특별 ?보급)/.test(source) && !/랜덤|갱신|확률/.test(source))
  add('fixed-exchange', '상점 확정 교환', 'guaranteed', 0, fixedExchangeSources)

  const rewardSources = currentSources.filter(source => /^(주간 임무|도감 업적|출석 스탬프|작전 파일:|히든 임무)/.test(source))
  add('guaranteed-reward', '임무·보상', 'guaranteed', 0, rewardSources)

  const rotatingExchangeSources = currentSources.filter(source => /(훈장 교환|훈장 상점|훈장 지원|지원 신청|연습 상점|특별 ?보급).*(랜덤|갱신|확률)/.test(source))
  add('rotating-exchange', '상점 랜덤 교환', 'rotation', 1, rotatingExchangeSources)

  const lowMapDrops = mapDrops.filter(drop => mapDifficultyRank(drop.stage) === 1)
  add('map-drop', '일반 해역 드롭', 'random', 1, mapSources(currentSources, lowMapDrops))

  if (permanentSignals.archive) {
    const archiveSources = currentSources.filter(source => /작전문서/.test(source))
    add('archive-drop', '작전문서 드롭', 'random', 1, archiveSources.length ? archiveSources : ['작전문서 드롭'])
  }

  const constructionSources = currentSources.filter(source => /(소형함|중형함|특형함).*(상시 )?건조|상시 건조/.test(source))
  if (permanentSignals.build && constructionSources.length === 0) constructionSources.push('상시 건조')
  add('construction', '상시 건조', 'random', 2, constructionSources)

  const laterMapDrops = mapDrops.filter(drop => mapDifficultyRank(drop.stage) === 2)
  add('later-map-drop', '후반 해역 드롭', 'random', 2, mapSources(currentSources, laterMapDrops))

  const highMapDrops = mapDrops.filter(drop => mapDifficultyRank(drop.stage) === 3)
  add('high-map-drop', '고해역 드롭', 'random', 3, mapSources(currentSources, highMapDrops))

  const specialSources = currentSources.filter(source => /META ?상점|상설 UR|UR Exchange|META 연구실|META 연구실·|메타랩|연구 ?도크/.test(source))
  add('special-exchange', '특수 교환·연구', 'conditional', 3, specialSources)

  const usedSources = new Set(routes.flatMap(item => item.sources))
  const otherSources = currentSources.filter(source => !usedSources.has(source))
  if (otherSources.length || (routes.length === 0 && Object.values(permanentSignals).some(Boolean))) {
    add('other-permanent', '기타 상시 입수', 'conditional', 2, otherSources.length ? otherSources : permanentReasons(permanentSignals))
  }

  return routes.sort((a, b) => a.rank - b.rank)
}

function route(key, label, certainty, rank, sources) {
  return { key, label, certainty, rank, sources }
}

function mapSources(currentSources, drops) {
  return drops.flatMap(drop => {
    const matched = currentSources.filter(source => source.includes(drop.stage))
    return matched.length ? matched : [`메인 스테이지 해역${drop.stage}`]
  })
}

function mapDifficultyRank(stage) {
  const chapter = Number(String(stage || '').split('-')[0])
  if (!Number.isFinite(chapter)) return null
  if (chapter <= 4) return 1
  if (chapter <= 12) return 2
  return 3
}

function permanentReasons(signals) {
  const labels = { map: '메인 해역 드랍', archive: '작전문서 드랍', coreMonthly: '코어 월간 교환', arenaShop: '연습 상점(랜덤 출현)', build: '상시 건조', shop: '상점 교환', other: '상시 획득처', timeline: 'KR 상시편입 확인' }
  return Object.entries(signals).filter(([, enabled]) => enabled).map(([key]) => labels[key]).filter(Boolean)
}
