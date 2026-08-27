import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncShipSkinAssets } from './lib/ship-skin-assets.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const referenceRoot = path.join(root, '참고용', 'AzurLane')
const metadataPath = path.join(referenceRoot, 'ship_skin_list.json')
const outputRoot = path.join(referenceRoot, 'images', 'skin')
const backgroundOutputRoot = path.join(referenceRoot, 'images', 'background')
const stagingRoot = path.join(root, `.skin-asset-stage-${process.pid}-${Date.now()}`)
const reportPath = path.join(root, 'reports', 'data-sources', 'skin-image-sync.json')
const rosterPath = path.join(root, '참고용', 'ALtoy', 'data', 'ship_info_data.json')

if (!fs.existsSync(metadataPath)) {
  throw new Error('Fernando ship_skin_list.json이 없습니다. 먼저 npm run sync:data-sources를 실행하세요.')
}

const shipSkinList = readJson(metadataPath)
const report = await syncShipSkinAssets({
  shipSkinList,
  outputRoot,
  backgroundOutputRoot,
  stagingRoot,
})

const metadataGids = new Set(shipSkinList.map(ship => Number(ship.gid)))
const rosterMetadataMissing = readJson(rosterPath)
  .filter(character => Number.isInteger(Number(character.gid)) && !metadataGids.has(Number(character.gid)))
  .map(character => ({
    gid: Number(character.gid),
    name: character.name,
    skinId: String(character.skin_id || `${character.gid}0`),
    reason: 'Fernando player-ship skin metadata unavailable',
  }))
  .sort((left, right) => left.gid - right.gid)

const downloaded = report.assets
  .filter(asset => asset.status === 'downloaded')
  .map(({ skinId, field, relativePath }) => ({ skinId, field, relativePath }))
const replacedInvalid = report.assets
  .filter(asset => asset.status === 'replaced-invalid')
  .map(({ skinId, field, relativePath }) => ({ skinId, field, relativePath }))

const output = {
  generatedAt: new Date().toISOString(),
  policy: {
    scope: 'Fernando player-ship skin renders and shared background/background2 images declared by ship_skin_list.json',
    optionalAssets: 'null metadata fields are intentionally absent',
    sharedBackgrounds: 'background/background2 URLs are deduplicated and stored by metadata URL path under images/background',
    excludedAssets: 'bgm is audio metadata and is intentionally excluded from image synchronization',
    preservation: 'existing and undeclared local assets are preserved',
    deployment: 'reference-only; images remain under gitignored 참고용 and are not copied to public',
  },
  checkedShips: report.checkedShips,
  checkedSkins: report.checkedSkins,
  declaredSkinAssets: report.declaredSkinAssets,
  declaredBackgroundAssets: report.declaredBackgroundAssets,
  declaredBackgroundReferences: report.declaredBackgroundReferences,
  checkedBackgrounds: report.checkedBackgrounds,
  excludedBgmReferences: report.excludedBgmReferences,
  excludedUniqueBgm: report.excludedUniqueBgm,
  declaredAssets: report.declaredAssets,
  existingAssets: report.existingAssets,
  downloadedAssets: report.downloadedAssets,
  invalidAssets: report.invalidAssets,
  fetchedAssets: report.fetchedAssets,
  downloaded,
  replacedInvalid,
  rosterMetadataMissing,
}

writeAtomic(reportPath, Buffer.from(`${JSON.stringify(output, null, 2)}\n`, 'utf8'))
console.log(`공용 배경 ${report.checkedBackgrounds}개(참조 ${report.declaredBackgroundReferences}건) / BGM 제외 ${report.excludedUniqueBgm}개(참조 ${report.excludedBgmReferences}건)`)
console.log(`함선 스킨 원본 동기화 완료: 함선 ${report.checkedShips}척 / 스킨 ${report.checkedSkins}종 / 선언 이미지 ${report.declaredAssets}개`)
console.log(`기존 ${report.existingAssets}개 / 신규 다운로드 ${report.downloadedAssets}개 / 손상 교체 ${report.invalidAssets}개 / 메타데이터 예외 ${rosterMetadataMissing.length}척`)

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeAtomic(destination, bytes) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  const temporary = `${destination}.tmp-${process.pid}`
  try {
    fs.writeFileSync(temporary, bytes)
    fs.renameSync(temporary, destination)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
}
