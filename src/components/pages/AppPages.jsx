import { useEffect, useState } from 'react'
import BackupPanel from '../BackupPanel.jsx'
import CharacterTable from '../CharacterTable.jsx'
import FilterPanel from '../FilterPanel.jsx'
import StatsBar from '../StatsBar.jsx'
import heroImage from '../../assets/home-anchorage-painting.png'

const publicAssetUrl = path => `${import.meta.env.BASE_URL}${path}`
const LOADING_ILLUSTRATIONS = [publicAssetUrl('images/loading-illustrations/100021-painting.png')]
const LOADING_ILLUSTRATION_INTERVAL_MS = 8000

export function DataLoadStatePage({ error }) {
  return (
    <main className="mx-auto max-w-[1500px] p-6">
      <section className="border border-neutral-700 bg-[#242424] px-6 py-10 text-sm text-gray-400">
        {error ? `함선 데이터를 불러오지 못했습니다. (${error})` : '함선 데이터를 불러오는 중입니다.'}
      </section>
    </main>
  )
}

export function HomePage() {
  return (
    <main className="mx-auto max-w-[1500px] p-6">
      <section className="relative mx-auto min-h-[360px] overflow-hidden rounded border border-gray-800 bg-gray-900 md:aspect-[2048/1220] md:min-h-0 md:w-3/4">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-gray-950/20" />
        <div className="relative flex min-h-[360px] max-w-[460px] flex-col justify-start px-5 py-6 md:min-h-full">
          <div className="mb-3 w-fit rounded bg-neutral-700 px-2.5 py-1 text-[11px] font-bold text-white">PRIVATE TOOL</div>
          <h1 className="text-2xl font-black text-white md:text-3xl">AzurLane Tracker</h1>
          <p className="mt-3 text-sm leading-6 text-gray-200">
            내 보유함 기반 성장, 기술점수,<br />
            추가 스탯, 편성 추천을 정리하기 위한<br />
            벽람항로 개인 도구.
          </p>
        </div>
        <p className="absolute bottom-5 left-5 max-w-[440px] text-sm leading-6 text-gray-200">
          출처 : 벽람항로 공개 게임 데이터·GitHub 저장소·유저 정리 스프레드시트 및 위키 등<br />
          (문제가 될 시 샷다 내림.)
        </p>
      </section>
    </main>
  )
}

export function MyRosterPage(props) {
  const { characters, filteredCharacters, filters, setFilters, updateUser, userData, setUserData, storageMessage } = props

  return (
    <>
      <header className="border-b border-neutral-800 bg-[#1f1f1f] px-6 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4">
          <h1 className="text-xl font-bold text-gray-100">내 함순이 정보</h1>
          <BackupPanel userData={userData} setUserData={setUserData} storageMessage={storageMessage} compact />
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] space-y-4 p-4">
        <div className="flex flex-wrap gap-4">
          <StatsBar characters={characters} />
          <RosterHeroPanel />
        </div>
        <FilterPanel filters={filters} setFilters={setFilters} characters={characters} />
        <CharacterTable characters={filteredCharacters} updateUser={updateUser} />
      </main>
    </>
  )
}

function RosterHeroPanel() {
  const [imageIndex, setImageIndex] = useState(0)
  const currentImage = LOADING_ILLUSTRATIONS[imageIndex]

  useEffect(() => {
    if (LOADING_ILLUSTRATIONS.length <= 1) return undefined
    const timerId = window.setInterval(() => {
      setImageIndex(current => (current + 1) % LOADING_ILLUSTRATIONS.length)
    }, LOADING_ILLUSTRATION_INTERVAL_MS)
    return () => window.clearInterval(timerId)
  }, [])

  return (
    <section className="w-full flex-1 overflow-hidden rounded-lg border border-neutral-700 bg-[#242424] lg:min-w-[720px]">
      <div className="grid min-h-[206px] grid-cols-1 md:grid-cols-[360px_1fr]">
        <div className="flex items-center justify-center border-b border-neutral-700 bg-[#1a1a1a] p-2 md:border-b-0 md:border-r">
          <div className="aspect-video w-full max-w-[340px] overflow-hidden rounded border border-neutral-600 bg-[#242424]">
            {currentImage ? <img src={currentImage} alt="" className="h-full w-full object-cover" /> : (
              <div className="flex h-full items-center justify-center border border-dashed border-gray-700 text-xs text-gray-600">로딩 일러스트</div>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center px-6 py-5">
          <div className="text-xs font-semibold text-gray-300">입력 안내</div>
          <div className="mt-3 max-w-3xl space-y-1.5 text-sm leading-6 text-gray-400">
            <p>번거롭지만 본인이 보유 중인 애정어린 함순이 정보를 수동으로 기입해주세요.</p>
            <p>여기 정보가 기입되어야 육성/편성 추천 정보가 돌아갑니다.</p>
            <p>입력한 정보는 현재 브라우저의 로컬 저장소에 자동으로 저장됩니다.</p>
            <p>브라우저 데이터 삭제나 기기 변경으로 인한 유실에 대비해, 위의 내보내기 버튼으로 현재 정보를 JSON 백업 파일로 다운로드 해두세요.</p>
            <p>제 모항으로 다이아 50만개 보내기 그런거 아닙니다.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function UnderConstructionPage({ title }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[1500px] items-center justify-center p-6">
      <section className="flex aspect-[16/9] w-full max-w-4xl items-center justify-center rounded border border-neutral-600 bg-[#242424] text-center shadow-2xl shadow-black/40">
        <div>
          <div className="text-sm font-semibold text-gray-100">{title}</div>
          <div className="mt-4 text-3xl font-bold text-white">공사중</div>
        </div>
      </section>
    </main>
  )
}
