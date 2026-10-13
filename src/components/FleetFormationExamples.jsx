import { useState } from 'react'
import formationData from '../data/fleetFormationExamples.json'
import { compareFormationExample } from '../utils/fleetFormationExamples.js'
import { RecommendationShipArtwork } from './recommendations/RecommendationShipArtwork.jsx'

export default function FleetFormationExamples({ characters }) {
  const [stage, setStage] = useState('전체')
  const [exampleId, setExampleId] = useState(formationData.examples[0]?.id)
  const examples = formationData.examples.filter(example => stage === '전체' || example.stage === stage)
  const selected = examples.find(example => example.id === exampleId) || examples[0]
  const comparison = selected ? compareFormationExample(selected, characters) : null

  return (
    <section aria-labelledby="formation-examples-heading" className="overflow-hidden border border-neutral-700 bg-[#202020]">
      <div className="border-b border-neutral-700 px-4 py-3">
        <h2 id="formation-examples-heading" className="text-base font-bold text-cyan-100">원본 추천 편성 · 내 보유 비교</h2>
        <p className="mt-1 text-xs leading-5 text-gray-400">추천표의 해역·목적별 예시입니다. 아래 자동 계산과 별개이며, 16지 전투 성능을 계산하거나 클리어를 보장하지 않습니다.</p>
        <a className="text-xs text-cyan-400 underline" href={formationData.source.url} target="_blank" rel="noreferrer">원본 추천표 보기</a>
        <span className="ml-3 text-[11px] text-gray-500">표 갱신 {formationData.source.sheetUpdatedAt} · 원본 이미지 {formationData.source.referenceImageDate}</span>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-gray-400">예시 해역
            <select className="mt-1 w-full rounded border border-neutral-600 bg-[#181818] p-2 text-sm text-gray-100" value={stage} onChange={event => setStage(event.target.value)}>
              {['전체', ...new Set(formationData.examples.map(example => example.stage))].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">예시 목적·구성
            <select className="mt-1 w-full rounded border border-neutral-600 bg-[#181818] p-2 text-sm text-gray-100" value={selected?.id || ''} onChange={event => setExampleId(event.target.value)}>
              {examples.map(example => <option key={example.id} value={example.id}>{example.title}</option>)}
            </select>
          </label>
        </div>
        {comparison && <>
          <div>
            <h3 className="font-semibold text-gray-100">{comparison.title}</h3>
            <p className="mt-1 text-xs text-cyan-200">필수 자리 중 보유 후보 {comparison.summary.ownedSlots}/{comparison.summary.requiredSlots} · 자유 육성 자리 {comparison.summary.trainingSlots}</p>
            <p className="mt-1 text-[11px] leading-5 text-gray-500">대안은 한 자리에서 택1입니다. 보유 수는 전투 준비 완료 여부가 아닙니다. 입력된 육성 상태만 표시하며 장비·스킬·개장 조건은 별도로 확인하세요.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <SlotGroup title={comparison.supportOnly ? '지원항모' : '후열 · 원본 역할 순서'} slots={comparison.main} />
            {comparison.vanguard.length > 0 && <SlotGroup title="전열 · 선봉 → 가운데 → 맨뒤" slots={comparison.vanguard} />}
          </div>
          <Notes notes={comparison.notes} />
        </>}
        <Notes notes={formationData.source.notes} />
      </div>
    </section>
  )
}

function Notes({ notes = [] }) {
  if (!notes.length) return null
  return <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-gray-400">{notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
}

function SlotGroup({ title, slots }) {
  return <div className="min-w-0">
    <h4 className="mb-2 text-xs font-semibold text-gray-300">{title}</h4>
    <div className="grid gap-2 sm:grid-cols-3">
      {slots.map((slot, index) => <div key={index} className="min-w-0 rounded border border-neutral-700 bg-[#181818] p-2">
        <div className="text-xs font-bold text-cyan-200">{slot.position}</div>
        <p className="mb-2 text-[11px] text-gray-400">{slot.role}{slot.type === 'choice' && !slot.role.includes('택1') ? ' · 택1' : ''}</p>
        {slot.type === 'training' ? <div className="flex min-h-28 items-center justify-center rounded border border-dashed border-neutral-600 p-2 text-center text-xs leading-5 text-gray-400">키울 함선 자리<br />보유 후보 수에서 제외</div> : slot.candidates.map(candidate => <div key={candidate.id} className="mb-2 last:mb-0">
          <div className="relative h-28 overflow-hidden rounded bg-neutral-800">
            <RecommendationShipArtwork character={candidate.character} name={candidate.name} loading="lazy" className="h-full w-full object-cover object-top" />
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-100">{candidate.name || candidate.character?.name}</p>
          <p className={`text-[11px] ${candidate.owned ? 'text-emerald-300' : 'text-gray-500'}`}>{candidate.registered ? candidate.owned ? `보유 · 입력 상태 ${candidate.progressLabel}` : '미보유' : 'DB 정보 없음'}</p>
          {candidate.retrofitRequired && <p className={`text-[11px] ${candidate.retrofitMissing ? 'text-amber-300' : 'text-emerald-300'}`}>{candidate.retrofitMissing ? '개장 필요 · 미완료/미입력' : '개장 완료'}</p>}
        </div>)}
        <Notes notes={slot.notes} />
      </div>)}
    </div>
  </div>
}
