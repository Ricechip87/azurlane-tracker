import { useMemo, useState } from 'react'

const MODES = [
  {
    id: 'main',
    label: '메인해역',
    description: '일반 해역 진행과 13~15지 대응을 기준으로 한 육성 우선순위 초안입니다.',
  },
  {
    id: 'operation',
    label: '대작전',
    description: '대작전 보스전과 고난도 전투에 가져갈 함선을 고르는 화면입니다.',
  },
  {
    id: 'newbie',
    label: '맨땅뉴비',
    description: '시작 직후 구하기 쉽고 오래 쓰기 좋은 함선을 먼저 보는 화면입니다.',
  },
]

const POSITIONS = [
  { id: 'front', label: '전열' },
  { id: 'back', label: '후열' },
]

const FRONT_ROWS = [
  { id: 'ss', label: 'SS 급\n최우선' },
  { id: 's', label: 'S 급\n최고 성능' },
  { id: 'aplus', label: 'A+ 급' },
  { id: 'a', label: 'A 급' },
]

const FRONT_GROUPS = [
  { id: 'dd', label: '구축 DD', span: 5 },
  { id: 'cl', label: '경순 CL', span: 6 },
  { id: 'ca', label: '중순 / 대순 CA', span: 6 },
  { id: 'support', label: '버퍼 / 디버퍼', span: 4 },
]

const FRONT_CELLS = [
  cell('ss', 1, 'Z52', '딜탱 / 보조 / 힐', 'blue'),
  cell('ss', 2, '라피Ⅱ', '탱 / 대잠 / 대공', 'blue'),
  cell('ss', 3, '윌리엄 D 포터', '만능 육각형', 'red'),
  cell('ss', 6, '시만토', '균형잡힌 공방\n유틸 + 짤힐', 'blue'),
  cell('ss', 7, '드 제번 프로빈시엔', '최상위 대공 + 힐', 'blue'),
  note('ss', 10, 1, 'S+\nSS 대용\nS 상위호환', 'rank'),
  cell('ss', 11, '샌디에이고', '상위 대공 성능', 'blue'),
  cell('ss', 12, '괌', '최상급 대공\n최상급 탱킹', 'blue'),
  cell('ss', 13, '하우덴 리우', '탱 / 딜 / 보조 / 힐\n꽉찬 육각형', 'blue'),
  note('ss', 14, 3, '13/15지: 대공 요구치가 높아 일부 고성능 대공함 상향 평가.\n14지: 대공 요구치가 높지 않아 일부 고성능 대공함 하향 평가.\n\n구축: 잉그레이엄, 알렌 M. 섬너, 허먼 II\n경순: 샌디에이고, 시만토, 스킬라, 리노 등', 'text'),
  cell('ss', 18, '엘드릿지', '전열 탱 보조 1황\n구축 탱커 1황\n개장 필요', 'blue'),

  note('s', 1, 3, '14지 대잠 관련 코멘트\n대잠 성능이 좋은 1~2 함순이를 추천\n주로 구축, 대잠 경순\n\n손컨 관련 코멘트\n조명탄/탐조등 지역 피하기', 'text'),
  cell('s', 4, '트라팔가', '대공 / 지원탄막'),
  cell('s', 6, '플리머스', '경순 딜러 1황\n기함 전함 딜버프'),
  note('s', 8, 3, '전열 선택시 우선순위/장점에 대한 간략한 설명\nZ52, 라피 II, 엘드릿지, 괌, 시만토 조합을 상황에 따라 선택', 'text'),
  cell('s', 12, '브레스트', '쫄팟 보스팟\n둘다 탱잘함'),
  cell('s', 13, '나폴리', '실드 무시 딜러\n탱커'),
  cell('s', 14, '에기르', '보스 전용 탱커'),
  cell('s', 15, '앵커리지', '연막탄 탱킹 보조'),
  cell('s', 18, '잔 다르크', '탱커 보조'),

  cell('aplus', 1, '펠릭스 슐츠', '탱커 2황'),
  cell('aplus', 6, '핑하이', '확고한 탱킹능력\n낮은 딜 기여도'),
  cell('aplus', 7, '닝하이', '태생 보딱 중\n탱킹 1황'),
  cell('aplus', 8, '얏센', '태생 보딱 중\n탱킹 1황'),
  cell('aplus', 9, '토키사키 쿠루미', '분신을 활용한 탱'),
  cell('aplus', 12, '크론시타트', '무난하게 좋음\n타함대 지원탄막'),
  cell('aplus', 13, '체셔', '대공요원 중\n2등으로 단단함'),
  cell('aplus', 14, '라라 사타린 데빌룩', '튼튼한 서포터형\n드레이크'),
  cell('aplus', 15, '야토가미 토카', '기함보호\n3번자리 딜러'),
  cell('aplus', 16, '힌덴부르크', '전열 딜러 1황'),
  cell('aplus', 17, '운젠', '전열 딜러 2황'),
  cell('aplus', 18, '허먼Ⅱ', '대공 / 대잠\n공습선도 + 기함보호'),
  cell('aplus', 19, '키로프(META)', '분신을 통한 탱킹보조'),

  cell('a', 1, '잉그레이엄', '대공 / 기타보조'),
  cell('a', 2, '오토 폰 알벤슬레벤', '무난한 탱커'),
  cell('a', 3, '저비스', '3번 자리 딜러'),
  cell('a', 4, '모가도르', '3번 자리 딜러'),
  cell('a', 5, '유키카제', '무난한 탱커 / 불사'),
  cell('a', 6, '하얼빈', '높은 공격력\n연막탄'),
  cell('a', 7, '노시로', '경장 방뢰요원'),
  cell('a', 8, '아스카', '경순 드레이크'),
  cell('a', 9, '마르세예즈', '버퍼 겸 3번 자리 딜러'),
  cell('a', 10, '바야르', '5초 무적\n준최상급 딜링'),
  cell('a', 11, '류 리온', '준최상급\n3번자리 딜러'),
  cell('a', 12, '브렌누스', '고성능 대체 탱커들'),
  cell('a', 13, '프리드리히 카를', '고출력 중순 표준'),
  cell('a', 14, '아즈마', '대순 탱커'),
  cell('a', 15, '드레이크', '고출력 중순 표준'),
  cell('a', 16, '피츠버그', '딜탱 다 잘함 + 파갑'),
  cell('a', 17, '볼티모어', '미항팟 항공 버퍼'),
  cell('a', 18, '이부키', '쫄팟/단기전의 신'),
  cell('a', 19, '카자구모', '공습선도 1황'),
  cell('a', 20, '스킬라', '대공 + 항공뎀증'),
  cell('a', 21, '라임', '탄약 + 1'),
]

const BACKLOG_CARDS = [
  {
    title: '1차 기준',
    body: '티어표 자체를 먼저 보여주고, 사용자가 직접 부족한 포지션을 눈으로 확인할 수 있게 둡니다.',
  },
  {
    title: '2차 기준',
    body: '내 보유함 정보가 붙으면 120~125 달성 함선은 딤드 처리하고, 미보유/미육성 함선만 강조합니다.',
  },
  {
    title: '3차 기준',
    body: '메인해역, 대작전, 맨땅뉴비 데이터를 분리해서 같은 표 구조에 갈아끼울 수 있게 만듭니다.',
  },
]

function cell(row, column, name, memo, tone = 'default') {
  return { type: 'ship', row, column, name, memo, tone, span: 1 }
}

function note(row, column, span, text, tone = 'text') {
  return { type: 'note', row, column, span, text, tone }
}

export default function GrowthRecommendationPage({ characters }) {
  const [mode, setMode] = useState('main')
  const [position, setPosition] = useState('front')
  const currentMode = MODES.find(item => item.id === mode) || MODES[0]

  const characterByName = useMemo(() => (
    new Map(characters.map(character => [character.name, character]))
  ), [characters])

  const totalColumns = FRONT_GROUPS.reduce((sum, group) => sum + group.span, 0)

  return (
    <section className="space-y-4">
      <div className="border border-gray-800 bg-gray-900 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-blue-300">육성 추천 초안</div>
            <h2 className="mt-1 text-xl font-bold text-gray-100">{currentMode.label} 티어표</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{currentMode.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MODES.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`border px-3 py-2 text-sm font-semibold transition-colors ${mode === item.id ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-700 bg-gray-950 text-gray-400 hover:text-gray-100'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4">
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPosition(item.id)}
                className={`border px-3 py-1.5 text-sm font-semibold transition-colors ${position === item.id ? 'border-blue-500 bg-blue-600/20 text-blue-100' : 'border-gray-700 bg-gray-950 text-gray-400 hover:text-gray-100'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500">현재는 화면 검토용 1차 표기이며, 보유함 반영은 다음 단계에서 붙입니다.</div>
        </div>
      </div>

      {position === 'front' ? (
        <div className="border border-gray-800 bg-gray-950">
          <div className="overflow-auto">
            <div
              className="growth-matrix min-w-[1780px]"
              style={{
                '--matrix-columns': `92px repeat(${totalColumns}, minmax(78px, 1fr))`,
                '--matrix-rows': `42px repeat(${FRONT_ROWS.length}, 160px)`,
              }}
            >
              <div className="growth-matrix-origin">전열<br />(선봉)</div>
              {FRONT_GROUPS.map((group, index) => {
                const start = FRONT_GROUPS.slice(0, index).reduce((sum, item) => sum + item.span, 0) + 2
                return (
                  <div
                    key={group.id}
                    className="growth-matrix-group"
                    style={{ gridColumn: `${start} / span ${group.span}` }}
                  >
                    {group.label}
                  </div>
                )
              })}

              {FRONT_ROWS.map((row, index) => (
                <div
                  key={row.id}
                  className="growth-matrix-tier"
                  style={{ gridRow: index + 2 }}
                >
                  {row.label.split('\n').map(line => <span key={line}>{line}</span>)}
                </div>
              ))}

              {FRONT_CELLS.map((item, index) => (
                <MatrixCell
                  key={`${item.row}-${item.column}-${index}`}
                  item={item}
                  character={item.type === 'ship' ? characterByName.get(item.name) : null}
                  rowIndex={FRONT_ROWS.findIndex(row => row.id === item.row) + 2}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <BacklineDraft />
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {BACKLOG_CARDS.map(card => (
          <article key={card.title} className="border border-gray-800 bg-gray-900 px-4 py-3">
            <h3 className="text-sm font-bold text-gray-100">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function MatrixCell({ item, character, rowIndex }) {
  const gridStyle = {
    gridColumn: `${item.column + 1} / span ${item.span}`,
    gridRow: rowIndex,
  }

  if (item.type === 'note') {
    return (
      <div className={`growth-matrix-note tone-${item.tone}`} style={gridStyle}>
        {item.text}
      </div>
    )
  }

  return (
    <div className={`growth-matrix-card tone-${item.tone}`} style={gridStyle}>
      <div className="growth-matrix-portrait">
        {character?.iconUrl ? <img src={character.iconUrl} alt="" /> : <span>{item.name.slice(0, 2)}</span>}
      </div>
      <button type="button" className="growth-matrix-name">{item.name}</button>
      <div className="growth-matrix-noteText">{item.memo}</div>
    </div>
  )
}

function BacklineDraft() {
  return (
    <div className="border border-gray-800 bg-gray-950 px-6 py-12 text-center">
      <div className="text-sm font-semibold text-blue-300">후열 표 준비 중</div>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-500">
        후열은 힐러, 항모, 전함, 잠수함 기준으로 같은 표 구조를 붙일 예정입니다.
        지금은 전열 UI를 먼저 보고 칸 크기와 정보 밀도를 맞추는 단계입니다.
      </p>
    </div>
  )
}
