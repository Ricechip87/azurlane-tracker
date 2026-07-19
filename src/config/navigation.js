export const MENU_GROUPS = [
  {
    label: '함순이 DB/육성/편성',
    items: [
      { id: 'my-roster', title: '내 함순이 정보', description: '현재 내 정보를 입력하는 곳' },
      {
        id: 'growth-recommend',
        title: '육성/편성 추천',
        description: '육성, 개발함, 기술 점수, 추가 스탯작, 해역/대작전 편성 추천',
      },
      { id: 'ship-db', title: '함순이 DB', description: '인게임 함순이 DB 출력' },
    ],
  },
  {
    label: '인게임 콘텐츠',
    items: [
      { id: 'skin-gallery', title: '스킨 일러', description: '함순이들 스킨 일러스트 모음' },
      { id: 'loading-gallery', title: '로딩 일러', description: '인게임 로딩 일러스트 모음' },
    ],
  },
]

export const PAGE_TITLES = Object.fromEntries(
  MENU_GROUPS.flatMap(group => group.items.map(item => [item.id, item.title]))
)
