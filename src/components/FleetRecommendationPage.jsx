import { useMemo, useState } from 'react'
import equipmentData from '../data/equipmentDirectStats.json'
import growthRecommendationData from '../data/growthRecommendations.json'
import shipCombatData from '../data/shipCombatData.json'
import stageRequirementData from '../data/stageRequirements.json'
import { buildFleetRecommendation } from '../utils/fleetRecommendations.js'
import { calcMajorFactionTechPoints } from '../utils/fleetTech.js'
import { calcFleetTechLevelStats } from '../utils/fleetTechLevelStats.js'
import { getRecommendationCardArtUrl } from '../utils/recommendationCardArt.js'
import { buildOperationTierByName } from '../utils/recommendationRanking.js'
import { calcStatsByShipType, mergeStatsByShipType } from '../utils/rosterStats.js'

const RARITY_BADGE = {
  UR: 'bg-red-950 text-red-100',
  SSR: 'bg-amber-400 text-black',
  SR: 'bg-purple-700 text-white',
  R: 'bg-blue-700 text-white',
  N: 'bg-neutral-600 text-white',
}

export default function FleetRecommendationPage({ characters }) {
  const stages = stageRequirementData.stages
  const [stageId, setStageId] = useState(stages.at(-1)?.id || 1504)
  const [rosterMode, setRosterMode] = useState('current')
  const [battleMode, setBattleMode] = useState('first-clear')
  const [equipmentProfile, setEquipmentProfile] = useState('standard')
  const stage = stages.find(item => item.id === Number(stageId)) || stages.at(-1)
  const operationTierByName = useMemo(
    () => buildOperationTierByName(growthRecommendationData),
    [],
  )
  const fleetTechStats = useMemo(() => {
    const techCharacters = rosterMode === 'strongest'
      ? characters.map(character => ({ ...character, acquired: '120' }))
      : characters
    return mergeStatsByShipType(
      calcStatsByShipType(techCharacters, 'acquired'),
      calcStatsByShipType(techCharacters, '120'),
      calcFleetTechLevelStats(calcMajorFactionTechPoints(techCharacters)),
    )
  }, [characters, rosterMode])
  const result = useMemo(() => buildFleetRecommendation({
    characters,
    shipData: shipCombatData.ships,
    stage,
    rosterMode,
    battleMode,
    equipmentProfile,
    operationTierByName,
    equipment: equipmentData.equipment,
    fleetTechStats,
  }), [
    battleMode,
    characters,
    equipmentProfile,
    fleetTechStats,
    operationTierByName,
    rosterMode,
    stage,
  ])

  return (
    <section className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[310px_minmax(0,1fr)]">
        <FleetControlPanel
          stages={stages}
          stageId={stageId}
          setStageId={setStageId}
          rosterMode={rosterMode}
          setRosterMode={setRosterMode}
          battleMode={battleMode}
          setBattleMode={setBattleMode}
          equipmentProfile={equipmentProfile}
          setEquipmentProfile={setEquipmentProfile}
        />

        <div className="space-y-3">
          <StageSummary stage={stage} result={result} />
          {result.meta.incomplete && rosterMode === 'current' && (
            <div className="border border-amber-800 bg-amber-950/25 px-4 py-3 text-xs leading-5 text-amber-200">
              보유 전력에 전열 또는 후열 함선이 부족해 일부 자리가 비었습니다. 내 함순이 정보의 획득 상태를 확인해 주세요.
            </div>
          )}
          <FleetPair result={result} battleMode={battleMode} />
          {stage.supportFleetCount > 0 && (
            <SingleFleet
              title="지원 함대"
              description="15지 원천 데이터의 지원 함대 슬롯입니다. 항공·대공 기여가 큰 항모를 우선 배치합니다."
              ships={result.fleets.support}
              tone="cyan"
            />
          )}
          {stage.submarineFleetCount > 0 && (
            <SingleFleet
              title="잠수함대 · 선택"
              description="일반 공략은 미사용을 우선합니다. 안정성이 부족할 때만 이 편성을 지원 호출 후보로 사용하세요."
              ships={result.fleets.submarine}
              tone="purple"
            />
          )}
          <ModelNotice />
        </div>
      </div>
    </section>
  )
}

function FleetControlPanel({
  stages,
  stageId,
  setStageId,
  rosterMode,
  setRosterMode,
  battleMode,
  setBattleMode,
  equipmentProfile,
  setEquipmentProfile,
}) {
  return (
    <aside className="overflow-hidden border border-neutral-700 bg-[#202020] xl:sticky xl:top-3">
      <div className="border-b border-neutral-700 bg-[#262626] px-4 py-3">
        <h2 className="text-sm font-bold text-gray-100">편성 목표</h2>
        <p className="mt-1 text-[11px] leading-4 text-gray-500">자동 전투·안정 클리어 기준으로 전체 출격 구성을 계산합니다.</p>
      </div>

      <ControlSection title="1. 공략 해역">
        <select
          value={stageId}
          onChange={event => setStageId(Number(event.target.value))}
          className="w-full rounded border border-neutral-600 bg-[#181818] px-3 py-2 text-sm font-semibold text-gray-100"
        >
          {Array.from({ length: 15 }, (_, index) => 15 - index).map(chapter => (
            <optgroup key={chapter} label={`${chapter}지`}>
              {stages.filter(stage => stage.chapter === chapter).map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name} · {stage.subtitle}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </ControlSection>

      <ControlSection title="2. 함선 풀">
        <Segmented
          value={rosterMode}
          onChange={setRosterMode}
          items={[
            ['current', '내 보유 전력'],
            ['strongest', '최강 전력'],
          ]}
        />
        <p className="mt-2 text-[10px] leading-4 text-gray-500">
          최강 전력은 Lv125·호감도 200·개조·개발30·용골·전용장비 완료를 가정합니다.
        </p>
      </ControlSection>

      <ControlSection title="3. 공략 상태">
        <Segmented
          value={battleMode}
          onChange={setBattleMode}
          items={[
            ['first-clear', '최초 공략'],
            ['safe-farm', '안전해역 주회'],
          ]}
        />
      </ControlSection>

      <ControlSection title="4. 장비 +10">
        <Segmented
          value={equipmentProfile}
          onChange={setEquipmentProfile}
          items={[
            ['standard', '대중 장비'],
            ['high-end', '하이엔드'],
          ]}
        />
        <p className="mt-2 text-[10px] leading-4 text-gray-500">
          직접 능력치만 계산합니다. 확률 발동·탄막·회복·보호막·조건부 효과는 제외합니다.
        </p>
      </ControlSection>

      <div className="px-4 py-3 text-[10px] leading-4 text-gray-500">
        <strong className="block text-gray-300">중복 규칙</strong>
        보스·도중·지원·잠수함대 전체에서 동일 함선을 중복 사용하지 않습니다.
      </div>
    </aside>
  )
}

function ControlSection({ title, children }) {
  return (
    <section className="border-b border-neutral-700 p-3">
      <h3 className="mb-2 text-xs font-bold text-gray-300">{title}</h3>
      {children}
    </section>
  )
}

function Segmented({ value, onChange, items }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded border px-2 py-2 text-xs font-semibold ${value === id ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-neutral-700 bg-[#181818] text-gray-400 hover:border-neutral-500'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function StageSummary({ stage, result }) {
  const requirementCards = [
    ['항공 우세 원본', result.requirements.airDominance, result.requirements.safeAirDominance],
    ['제공권 확보 원본', result.requirements.bestAirDominance, result.requirements.safeBestAirDominance],
    ['매복 회피 원본', result.requirements.avoid, result.requirements.safeAvoid],
  ]
  return (
    <section className="border border-neutral-700 bg-[#202020]">
      <div className="border-b border-neutral-700 bg-[#262626] px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-gray-100">{stage.name} · {stage.subtitle}</h2>
            <p className="mt-1 text-[11px] text-gray-500">KR chapter_template 직접 요구치와 +10% 안전 목표</p>
          </div>
          <span className="rounded bg-cyan-950 px-2 py-1 text-xs font-bold text-cyan-300">후보 {result.meta.candidateCount}척</span>
        </div>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {requirementCards.map(([label, raw, safe]) => (
          <div key={label} className="rounded border border-neutral-700 bg-[#181818] px-3 py-3">
            <div className="text-[10px] text-gray-500">{label}</div>
            <div className="mt-1 text-lg font-black text-gray-100">{raw.toLocaleString()}</div>
            <div className="text-[10px] text-amber-300">안전 목표 {safe.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-700 px-4 py-2 text-[10px] text-gray-500">
        직접 규칙: {stage.directRules.join(' · ') || '별도 수치 규칙 없음'}
      </div>
    </section>
  )
}

function FleetPair({ result, battleMode }) {
  return (
    <div className="grid gap-3 2xl:grid-cols-2">
      <CombatFleet
        title="보스 함대"
        description="단일 전투 화력과 생존, 대작전 평가를 함께 반영합니다."
        fleet={result.fleets.boss}
        tone="amber"
      />
      <CombatFleet
        title="도중 함대"
        description={battleMode === 'safe-farm'
          ? '안전해역 주회용으로 생존과 장전을 더 높게 반영합니다.'
          : '연속 전투 안정성과 장전을 더 높게 반영합니다.'}
        fleet={result.fleets.mob}
        tone="cyan"
      />
    </div>
  )
}

function CombatFleet({ title, description, fleet, tone }) {
  return (
    <section className="border border-neutral-700 bg-[#202020]">
      <FleetHeader title={title} description={description} fleet={fleet} />
      <div className="space-y-3 p-3">
        <FleetLane label="후열" ships={fleet.rear} tone={tone} />
        <FleetLane label="전열" ships={fleet.front} tone={tone} />
      </div>
    </section>
  )
}

function SingleFleet({ title, description, ships, tone }) {
  return (
    <section className="border border-neutral-700 bg-[#202020]">
      <FleetHeader title={title} description={description} fleet={{ rear: ships, front: [] }} />
      <div className="p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          {ships.map(ship => <FleetShipCard key={ship.gid} ship={ship} tone={tone} />)}
          {Array.from({ length: Math.max(0, 3 - ships.length) }, (_, index) => (
            <EmptySlot key={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FleetHeader({ title, description, fleet }) {
  const ships = [...(fleet.rear || []), ...(fleet.front || [])]
  const aviation = ships.reduce((sum, ship) => sum + ship.stats.aviation, 0)
  const antiair = ships.reduce((sum, ship) => sum + ship.stats.antiair, 0)
  const health = ships.reduce((sum, ship) => sum + ship.stats.health, 0)
  return (
    <div className="border-b border-neutral-700 bg-[#262626] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-100">{title}</h3>
          <p className="mt-1 text-[10px] leading-4 text-gray-500">{description}</p>
        </div>
        <div className="flex gap-1 text-[10px]">
          <Metric label="항공" value={aviation} />
          <Metric label="대공" value={antiair} />
          <Metric label="내구" value={health} />
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return <span className="rounded bg-[#171717] px-2 py-1 text-gray-400">{label} <strong className="text-gray-100">{value.toLocaleString()}</strong></span>
}

function FleetLane({ label, ships, tone }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold text-gray-500">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {ships.map(ship => <FleetShipCard key={ship.gid} ship={ship} tone={tone} />)}
        {Array.from({ length: Math.max(0, 3 - ships.length) }, (_, index) => (
          <EmptySlot key={index} />
        ))}
      </div>
    </div>
  )
}

function FleetShipCard({ ship, tone }) {
  const image = getRecommendationCardArtUrl(ship, import.meta.env.BASE_URL)
  const border = tone === 'amber' ? 'border-amber-700/70' : tone === 'purple' ? 'border-purple-700/70' : 'border-cyan-800/70'
  return (
    <article className={`min-w-0 overflow-hidden rounded border ${border} bg-[#171717]`}>
      <div className="flex min-h-[104px]">
        <img src={image} alt="" className="h-[104px] w-[82px] shrink-0 object-cover object-top" />
        <div className="min-w-0 flex-1 p-2">
          <div className="flex items-center gap-1">
            <strong className="truncate text-xs text-gray-100">{ship.name}</strong>
            <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${RARITY_BADGE[ship.rarity] || 'bg-neutral-700 text-white'}`}>{ship.rarity}</span>
          </div>
          <div className="mt-1 text-[10px] text-gray-500">{ship.shipType} · {ship.acquired || '최강 가정'}</div>
          {ship.augment && (
            <div className={`mt-1 truncate text-[9px] ${ship.augment.equipped ? 'text-emerald-400' : 'text-amber-300'}`} title={ship.augment.note}>
              전용장비: {ship.augment.note}
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-x-2 text-[9px] text-gray-400">
            <span>내구 {ship.stats.health}</span>
            <span>대공 {ship.stats.antiair}</span>
            <span>포격 {ship.stats.firepower}</span>
            <span>항공 {ship.stats.aviation}</span>
          </div>
        </div>
      </div>
      <div className="truncate border-t border-neutral-800 px-2 py-1.5 text-[9px] text-gray-500" title={ship.equipment.map(item => item.name).join(' · ')}>
        +10 장비: {ship.equipment.length ? ship.equipment.map(item => item.name).join(' · ') : '직접 스탯 장비 없음'}
      </div>
    </article>
  )
}

function EmptySlot() {
  return (
    <div className="flex min-h-[132px] items-center justify-center rounded border border-dashed border-neutral-700 bg-[#181818] text-[10px] text-gray-600">
      편성 가능 함선 부족
    </div>
  )
}

function ModelNotice() {
  return (
    <section className="border border-neutral-700 bg-[#1a1a1a] px-4 py-3 text-[11px] leading-5 text-gray-500">
      <strong className="text-gray-300">현재 계산 범위</strong>
      <p className="mt-1">
        함선 레벨·한계돌파·강화·호감도·개조·연구함 개발30, 함선·진영 기술 보너스와 장비 +10 직접 스탯을 반영합니다.
        함선 스킬, 확률·조건부 장비 효과, 실제 함재기 슬롯을 포함한 제공권 공식, 장비 계정 수량은 아직 수치 판정에서 제외합니다.
        따라서 항공 우세치는 공식 원본과 안전 목표를 안내하되 달성 여부를 단정하지 않습니다.
      </p>
    </section>
  )
}
