import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyAppMissingFleetTech } from './lib/data-issues-report.mjs'
import { PREFER_ALTOY_GIDS } from './lib/obtainability-sources.mjs'
import { parseShipDataGroupGidsLua } from './lib/research-lua-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = sourcePath => JSON.parse(fs.readFileSync(
  path.isAbsolute(sourcePath) ? sourcePath : path.join(root, sourcePath),
  'utf8',
))
const audit = readJson('reports/data-sources/latest.json')
const characters = readJson('src/data/characters.json')
const obtainability = readJson('src/data/shipObtainability.json')
const sourceRoot = process.env.AUDIT_SOURCE_ROOT
  ? path.resolve(process.env.AUDIT_SOURCE_ROOT)
  : path.join(root, '참고용')
const altoy = readJson(process.env.ALTOY_DATA_PATH || path.join(sourceRoot, 'ALtoy/data/ship_info_data.json'))
const krGroups = readJson(process.env.KR_SHIP_GROUP_PATH || path.join(sourceRoot, 'AzurLaneData/KR/ShareCfg/ship_data_group.json'))
const krRosterPath = path.join(sourceRoot, 'AzurLaneLuaScripts/KR/sharecfg/ship_data_group.lua')
const krRosterGids = new Set(parseShipDataGroupGidsLua(fs.readFileSync(krRosterPath, 'utf8')).map(Number))
const sourceLabel = process.env.AUDIT_SOURCE_ROOT ? '지정한 최신 KR 원천' : '최신 동기화 KR 원천'

const charactersByGid = new Map(characters.map(ship => [String(ship.gid), ship]))
const charactersByName = new Map(characters.map(ship => [normalizeName(ship.name), ship]))
const altoyByGid = new Map(altoy.map(ship => [String(ship.gid), ship]))
const altoyByName = new Map(altoy.map(ship => [normalizeName(ship.name), ship]))
const altoyGids = new Set(altoy.map(ship => Number(ship.gid)))
const krGroupsByGid = new Map(Object.values(krGroups).map(group => [String(group.group_type), group]))

const identityExceptions = audit.display.identityFallbacks.map(issue => ({
  ...issue,
  reason: '앱 gid 필드에 ALtoy gid가 아닌 기본 스킨 ID가 저장되어 이름 보조 매칭이 필요함',
  iconFile: iconFile(charactersByName.get(normalizeName(issue.name)), issue.skinId),
}))

const obtainabilityReview = obtainability.ships
  .filter(ship => ship.verification.status === 'different'
    || (ship.verification.status === 'altoy-only' && !krRosterGids.has(Number(ship.gid))))
  .map(ship => {
    const character = charactersByGid.get(String(ship.gid)) || charactersByName.get(normalizeName(ship.name))
    const altoyShip = altoyByGid.get(String(ship.gid)) || altoyByName.get(normalizeName(ship.name))
    const krGroup = krGroupsByGid.get(String(ship.gid))
    return {
      gid: ship.gid,
      name: ship.name,
      status: ship.verification.status,
      reason: ship.verification.status === 'altoy-only'
        ? `ALtoy에는 입수처가 있으나 ${sourceLabel}에는 없음`
        : PREFER_ALTOY_GIDS.has(Number(ship.gid))
          ? `${sourceLabel}보다 최신인 ALtoy 입수처를 적용함`
          : `${sourceLabel}과 ALtoy의 입수처 문구가 서로 다름`,
      resolution: PREFER_ALTOY_GIDS.has(Number(ship.gid)) ? 'altoy-applied' : 'review',
      krObtain: descriptions(krGroup?.description),
      altoyObtain: unique(altoyShip?.description || []),
      appliedObtain: ship.obtain,
      iconFile: iconFile(character, altoyShip?.skin_id),
    }
  })

const missingReferenceImages = audit.images.referenceMissing.map(issue => {
  const character = charactersByGid.get(String(issue.gid)) || charactersByName.get(normalizeName(issue.name))
  return {
    ...issue,
    reason: `Fernando 원격 원천에도 ${issue.missing.join(', ')}가 없어 자동 보충하지 못함 (앱 공개 이미지는 별도 확인)`,
    iconFile: iconFile(character, issue.skinId),
  }
})

const appMissingFleetTech = classifyAppMissingFleetTech({
  gids: audit.fleetTech.appMissingFleetTechGids,
  krRosterGids,
  altoyGids,
}).map(issue => ({
  ...issue,
  ...fleetTechIssueCopy(issue.status),
  iconFile: iconFile(null, altoyByGid.get(String(issue.gid))?.skin_id),
}))
const cnOnlyExcluded = appMissingFleetTech.filter(issue => issue.status === 'cn-only')

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    identityExceptions: identityExceptions.length,
    obtainabilityAltoyOnly: obtainabilityReview.filter(item => item.status === 'altoy-only').length,
    obtainabilityDifferent: obtainabilityReview.filter(item => item.status === 'different').length,
    missingReferenceImages: missingReferenceImages.length,
    appMissingFleetTech: appMissingFleetTech.length,
    krAppPending: appMissingFleetTech.filter(item => item.status.startsWith('kr-')).length,
    cnOnlyExcluded: cnOnlyExcluded.length,
    availability: obtainability.meta.availability || {},
    acquisitionRoutes: obtainability.meta.acquisitionRoutes || {},
  },
  identityExceptions,
  obtainabilityReview,
  missingReferenceImages,
  appMissingFleetTech,
  cnOnlyExcluded,
}

const outputDir = path.join(root, 'reports/data-sources')
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(path.join(outputDir, 'issues.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(outputDir, 'issues.html'), renderHtml(report), 'utf8')
console.log(`검토 보고서 생성: 식별자 ${report.summary.identityExceptions}, 입수처 ${obtainabilityReview.length}, 이미지 ${report.summary.missingReferenceImages}, 앱 미반영 기술 ${report.summary.appMissingFleetTech} (KR 반영 ${report.summary.krAppPending}, CN 전용 ${report.summary.cnOnlyExcluded})`)

function renderHtml(data) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AzurLane 데이터 검토 목록</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; background: #111827; color: #e5e7eb; }
    body { max-width: 1500px; margin: 0 auto; padding: 24px; }
    h1 { margin-bottom: 8px; } h2 { margin-top: 40px; }
    .summary { color: #9ca3af; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 14px; }
    .card { display: grid; grid-template-columns: 82px 1fr; gap: 12px; padding: 12px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; }
    .card img, .placeholder { width: 82px; height: 82px; object-fit: cover; border-radius: 8px; background: #374151; }
    .placeholder { display: grid; place-items: center; color: #9ca3af; font-size: 12px; text-align: center; }
    .name { font-size: 17px; font-weight: 700; } .meta { color: #93c5fd; font-size: 13px; margin: 3px 0 7px; }
    .reason { color: #d1d5db; font-size: 13px; line-height: 1.45; }
    details { grid-column: 1 / -1; font-size: 13px; color: #d1d5db; }
    code { color: #fbbf24; overflow-wrap: anywhere; } ul { margin: 6px 0; padding-left: 20px; }
  </style>
</head>
<body>
  <h1>AzurLane 데이터 검토 목록</h1>
  <div class="summary">생성: ${escapeHtml(data.generatedAt)} · 자동 오류가 아니라 사람 확인이 필요한 예외/불일치 목록입니다.<br>입수 상태: 상시 획득 ${data.summary.availability.permanent || 0} · 현재 이벤트 ${data.summary.availability['active-event'] || 0} · 복각 대기 ${data.summary.availability['rerun-wait'] || 0} · 콜라보 복각 미정 ${data.summary.availability['collab-unknown'] || 0}<br>상시 입수 방법: 확정 상점 ${data.summary.acquisitionRoutes['fixed-exchange'] || 0} · 코어 월간 ${data.summary.acquisitionRoutes['core-monthly'] || 0} · 랜덤 상점 ${data.summary.acquisitionRoutes['rotating-exchange'] || 0} · 상시 건조 ${data.summary.acquisitionRoutes.construction || 0} · 고해역 드롭 ${data.summary.acquisitionRoutes['high-map-drop'] || 0}</div>
  ${section('식별자 보조 매칭', `${data.identityExceptions.length}명 · 앱 gid와 ALtoy gid가 달라 이름으로 연결`, data.identityExceptions.map(identityCard))}
  ${section('입수처 교차검증', `${data.obtainabilityReview.length}명 · ALtoy 단독 ${data.summary.obtainabilityAltoyOnly}, ALtoy 최신값 적용 ${data.summary.obtainabilityDifferent}`, data.obtainabilityReview.map(obtainCard))}
  ${section('원격 미제공 참고 이미지', `${data.missingReferenceImages.length}명 · 최신 원격 원천에도 없어 자동 보충하지 못한 파일`, data.missingReferenceImages.map(imageCard))}
  ${section('앱 미반영 함선 기술 데이터', `${data.appMissingFleetTech.length}건 · KR 반영 ${data.summary.krAppPending}, CN 전용 ${data.summary.cnOnlyExcluded}`, data.appMissingFleetTech.map(fleetTechCard))}
</body>
</html>\n`
}

function section(title, description, cards) {
  return `<h2>${escapeHtml(title)}</h2><p class="summary">${escapeHtml(description)}</p><div class="grid">${cards.join('')}</div>`
}

function identityCard(item) {
  return card(item.name, `앱 ${item.appId} · skin ${item.skinId}`, item.reason, item.iconFile,
    `<code>app gid ${item.appGid}</code><br><code>ALtoy gid ${item.altoyGid}</code>`)
}

function obtainCard(item) {
  const details = `<details><summary>입수처 비교</summary><b>KR</b>${list(item.krObtain)}<b>ALtoy 원문</b>${list(item.altoyObtain)}<b>현재 KR 표기 적용</b>${list(item.appliedObtain)}</details>`
  return card(item.name, `${item.gid} · ${item.status}`, item.reason, item.iconFile, details)
}

function imageCard(item) {
  return card(item.name, `${item.gid} · skin ${item.skinId}`, item.reason, item.iconFile,
    `<code>${escapeHtml(item.missing.join(', '))}</code>`)
}

function fleetTechCard(item) {
  return card(`gid ${item.gid}`, item.label, item.reason, item.iconFile, '')
}

function fleetTechIssueCopy(status) {
  if (status === 'kr-altoy-app-pending') return {
    label: 'KR/ALtoy 반영 · 앱 미반영',
    reason: '최신 KR 및 ALtoy 함선 목록에는 있으나 현재 앱 함선 DB에는 아직 반영되지 않음',
  }
  if (status === 'kr-app-pending') return {
    label: 'KR 반영 · 앱 미반영',
    reason: '최신 KR 함선 목록에는 있으나 ALtoy와 현재 앱 함선 DB에는 아직 반영되지 않음',
  }
  if (status === 'altoy-app-pending') return {
    label: 'ALtoy 반영 · 앱 미반영',
    reason: 'ALtoy 함선 목록에는 있으나 최신 KR 목록과 현재 앱 함선 DB에는 반영되지 않음',
  }
  return {
    label: 'CN only',
    reason: 'CN 기술 원본에는 있으나 최신 KR·ALtoy 함선 목록과 현재 앱 함선 DB에는 없음',
  }
}

function card(name, meta, reason, icon, extra) {
  const visual = icon
    ? `<img src="../../public/ship-icons/${encodeURIComponent(icon)}" alt="${escapeHtml(name)}">`
    : '<div class="placeholder">이미지 없음</div>'
  return `<article class="card">${visual}<div><div class="name">${escapeHtml(name)}</div><div class="meta">${escapeHtml(meta)}</div><div class="reason">${escapeHtml(reason)}</div>${extra}</div></article>`
}

function list(values) {
  return values.length ? `<ul>${values.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>` : '<p>없음</p>'
}

function descriptions(value) {
  if (!Array.isArray(value)) return []
  return unique(value.map(item => Array.isArray(item) ? item[0] : item))
}

function unique(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function normalizeName(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[·ㆍ\s()（）・]/g, '')
}

function iconFile(character, skinId) {
  if (character?.iconUrl) return path.basename(character.iconUrl)
  if (skinId && fs.existsSync(path.join(root, 'public/ship-icons', `${skinId}.png`))) return `${skinId}.png`
  if (skinId && fs.existsSync(path.join(root, 'public/ship-icons', `${skinId}.webp`))) return `${skinId}.webp`
  return null
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}
