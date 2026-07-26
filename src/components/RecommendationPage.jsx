import { lazy, Suspense, useState } from 'react'
import GrowthRecommendationPage from './GrowthRecommendationPage.jsx'
import ResearchRecommendationPage from './ResearchRecommendationPage.jsx'
import TechPointRecommendationPage from './TechPointRecommendationPage.jsx'
import AdditionalStatRecommendationPage from './AdditionalStatRecommendationPage.jsx'

const FleetRecommendationPage = lazy(() => import('./FleetRecommendationPage.jsx'))

const RECOMMENDATION_TABS = [
  {
    id: 'level120',
    label: '육성 추천',
    title: '육성 추천',
    description: '현재 내가 보유 중이거나 입수가 쉬운 함선들 중에서 추천합니다.\n(맨땅 뉴비는 적당히 100레벨까지 그 외에는 125까지)',
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
      <header className="border border-neutral-700 bg-[#242424] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-300">육성/편성 추천</div>
            <h1 className="mt-1 text-2xl font-bold text-gray-100">{currentTab.title}</h1>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-500">{currentTab.description}</p>
          </div>
          {activeTab === 'fleet' && (
            <div className="rounded border-2 border-amber-500 bg-amber-950/50 px-6 py-3 text-center shadow-[0_0_24px_rgba(245,158,11,0.16)]">
              <div className="text-3xl font-black tracking-widest text-amber-300 sm:text-4xl">만드는 중</div>
              <div className="mt-1 text-xs font-bold text-amber-100/80">현재 결과는 시험용이며 완성된 추천이 아닙니다.</div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-neutral-700">
        {RECOMMENDATION_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-x border-t px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-neutral-500 bg-neutral-700 text-white' : 'border-neutral-700 bg-[#242424] text-gray-400 hover:border-neutral-500 hover:text-gray-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'level120' ? (
        <GrowthRecommendationPage characters={characters} />
      ) : activeTab === 'research' ? (
        <ResearchRecommendationPage characters={characters} />
      ) : activeTab === 'tech' ? (
        <TechPointRecommendationPage characters={characters} />
      ) : activeTab === 'bonus-stat' ? (
        <AdditionalStatRecommendationPage characters={characters} />
      ) : activeTab === 'fleet' ? (
        <Suspense fallback={<RecommendationLoading />}>
          <FleetRecommendationPage characters={characters} />
        </Suspense>
      ) : (
        <RecommendationPlaceholder tab={currentTab} />
      )}
    </main>
  )
}

function RecommendationLoading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center border border-neutral-700 bg-[#202020] text-sm text-gray-500">
      편성 계산 데이터를 불러오는 중입니다.
    </div>
  )
}

function RecommendationPlaceholder({ tab }) {
  return (
    <section className="min-h-[360px] border border-neutral-700 bg-[#242424] px-6 py-8">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div>
          <div className="text-xs font-semibold text-gray-300">{tab.label}</div>
          <h2 className="mt-2 text-xl font-bold text-gray-100">준비 중</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">{tab.description}</p>
        </div>
        <div className="flex min-h-[240px] items-center justify-center border border-dashed border-neutral-700 bg-[#1a1a1a] text-center">
          <div>
            <div className="text-sm text-gray-500">이 영역에 다음 추천 로직이 들어갑니다.</div>
            <div className="mt-3 text-2xl font-bold text-gray-300">공사중</div>
          </div>
        </div>
      </div>
    </section>
  )
}
