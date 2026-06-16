import { useState } from 'react'
import { FleetTechPanel } from './StatsBar.jsx'
import GrowthMatrixDummy from './GrowthMatrixDummy.jsx'

const RECOMMENDATION_TABS = [
  {
    id: 'level120',
    label: '육성 추천',
    title: '육성 추천',
    description: '해역과 대작전 기준으로 120 육성 우선순위를 고릅니다.',
  },
  {
    id: 'growth-matrix-dummy',
    label: '육성표 더미',
    title: '육성표 더미',
    description: '스프레드시트형 육성 추천표 구조를 앱 안에서 확인하기 위한 더미 화면입니다.',
  },
  {
    id: 'research',
    label: '개발함 추천',
    title: '개발함 추천',
    description: '개발함 획득 조건과 필요한 진영/함종 기반 후보를 정리합니다.',
  },
  {
    id: 'tech',
    label: '기술 점수 추천',
    title: '기술 점수 추천',
    description: '진영별 기술점수, 현재 LV, 다음 LV, 후보 함선을 확인합니다.',
  },
  {
    id: 'bonus-stat',
    label: '추가 스탯작 추천',
    title: '추가 스탯작 추천',
    description: '함종과 원하는 스탯을 기준으로 육성 후보를 고릅니다.',
  },
  {
    id: 'fleet',
    label: '편성 추천',
    title: '편성 추천',
    description: '해역과 대작전 기준으로 보유 함선 편성을 추천합니다.',
  },
]

export default function RecommendationPage({ characters }) {
  const [activeTab, setActiveTab] = useState('level120')
  const currentTab = RECOMMENDATION_TABS.find(tab => tab.id === activeTab) || RECOMMENDATION_TABS[0]

  return (
    <main className="mx-auto max-w-[1500px] p-4 space-y-4">
      <header className="border border-gray-800 bg-gray-900 px-5 py-4">
        <div className="text-xs font-semibold text-blue-300">육성/편성 추천</div>
        <h1 className="mt-1 text-2xl font-bold text-gray-100">{currentTab.title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{currentTab.description}</p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-gray-800">
        {RECOMMENDATION_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-x border-t px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-blue-500 bg-blue-600/20 text-blue-100' : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'growth-matrix-dummy' ? (
        <GrowthMatrixDummy characters={characters} />
      ) : activeTab === 'tech' ? (
        <section>
          <div className="relative overflow-visible rounded border border-gray-800 bg-gray-900">
            <FleetTechPanel characters={characters} detailMode="inline" />
          </div>
        </section>
      ) : (
        <RecommendationPlaceholder tab={currentTab} />
      )}
    </main>
  )
}

function RecommendationPlaceholder({ tab }) {
  return (
    <section className="min-h-[360px] border border-gray-800 bg-gray-900 px-6 py-8">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div>
          <div className="text-xs font-semibold text-blue-300">{tab.label}</div>
          <h2 className="mt-2 text-xl font-bold text-gray-100">준비 중</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">{tab.description}</p>
        </div>
        <div className="flex min-h-[240px] items-center justify-center border border-dashed border-gray-700 bg-gray-950 text-center">
          <div>
            <div className="text-sm text-gray-500">이 영역에 다음 추천 로직이 들어갑니다.</div>
            <div className="mt-3 text-2xl font-bold text-gray-300">공사중</div>
          </div>
        </div>
      </div>
    </section>
  )
}
