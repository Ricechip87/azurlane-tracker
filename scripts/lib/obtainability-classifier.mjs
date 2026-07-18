const COLLAB_FACTIONS = new Set([
  'DOAX VV', '그리드맨', '던만추', '데어라', '라이자', '블랙 록 슈터',
  '섬란 카구라', '아이마스', '초차원 넵튠', '칭송받는자', '키즈나 아이',
  '투러브', '홀로라이브',
])

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
  else if (activeEvent) availability = { ...AVAILABILITY.ACTIVE_EVENT, eventName: activeEvent.name, endsAt: activeEvent.endsAt }
  else if (COLLAB_FACTIONS.has(faction)) availability = AVAILABILITY.COLLAB_UNKNOWN
  else if (faction === 'META' && obtain.length > 0) availability = AVAILABILITY.RERUN_WAIT
  else if (obtain.some(source => /이벤트|기간 한정|한정 건조/.test(source))) availability = AVAILABILITY.RERUN_WAIT
  else availability = AVAILABILITY.UNKNOWN
  return { availability, difficulty: classifyDifficulty({ obtain, permanentSources, mapDrops, permanentSignals, availability }) }
}

function classifyDifficulty({ obtain, permanentSources, mapDrops, permanentSignals, availability }) {
  if (availability.key === 'active-event') return { ...DIFFICULTY.EVENT, reasons: ['현재 진행 중인 KR 이벤트'] }
  if (availability.key === 'rerun-wait' || availability.key === 'collab-unknown') return { ...DIFFICULTY.LIMITED, reasons: [availability.label] }
  if (availability.key !== 'permanent') return { ...DIFFICULTY.UNKNOWN, reasons: [] }
  const sources = [...new Set([...obtain, ...permanentSources])]
  const sourceRanks = sources.map(sourceDifficultyRank).filter(Number.isFinite)
  const mapRanks = mapDrops.map(drop => mapDifficultyRank(drop.stage)).filter(Number.isFinite)
  const signalRanks = [
    permanentSignals.archive ? 0 : null,
    permanentSignals.coreMonthly ? 1 : null,
    permanentSignals.build ? 1 : null,
    permanentSignals.timeline ? 1 : null,
  ].filter(Number.isFinite)
  const detectedRank = Math.min(...sourceRanks, ...mapRanks, ...signalRanks, Number.POSITIVE_INFINITY)
  const rank = Number.isFinite(detectedRank) ? detectedRank : 1
  const difficulty = rank === 0 ? DIFFICULTY.EASY : rank === 2 ? DIFFICULTY.HARD : DIFFICULTY.NORMAL
  return { ...difficulty, reasons: [...new Set([...permanentReasons(permanentSignals), ...sources.filter(source => !/이벤트|기간 한정|한정 건조/.test(source))])] }
}

function sourceDifficultyRank(source) {
  if (/^상설 UR|^UR Exchange|META 연구실|META 연구실·|메타랩/.test(source)) return 2
  if (/^META ?상점|^(소형함|중형함|대형함|특형함) 건조|^대형함 건조|^중형함 건조|랜덤|확률적|^특별 ?보급|^코어 |^원형 상점|^연구 ?도크/.test(source)) return 1
  if (/^함대 상점|^군수 상점|^훈장 상점 교환$|^상점의 대함대|^주간 임무|^도감 업적|^출석 스탬프|^작전 파일:|^히든 임무/.test(source)) return 0
  return null
}

function mapDifficultyRank(stage) {
  const chapter = Number(String(stage || '').split('-')[0])
  if (!Number.isFinite(chapter)) return null
  if (chapter <= 4) return 0
  if (chapter <= 12) return 1
  return 2
}

function permanentReasons(signals) {
  const labels = { map: '메인 해역 드랍', archive: '작전문서 드랍', coreMonthly: '코어 월간 교환', build: '상시 건조', shop: '상점 교환', other: '상시 획득처', timeline: 'KR 상시편입 확인' }
  return Object.entries(signals).filter(([, enabled]) => enabled).map(([key]) => labels[key]).filter(Boolean)
}
