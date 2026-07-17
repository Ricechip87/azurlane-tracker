import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const altoy = JSON.parse(fs.readFileSync(path.join(root, '참고용/ALtoy/data/ship_info_data.json'), 'utf8'))
const fernandoBase = 'https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/skin'
const results = []

await mapLimit(altoy, 5, async ship => {
  const directory = path.join(root, '참고용/AzurLane/images/skin', String(ship.skin_id))
  fs.mkdirSync(directory, { recursive: true })
  const result = { gid: ship.gid, name: ship.name, skinId: ship.skin_id, downloaded: [], unavailable: [] }

  await ensureFernando(result, directory, 'painting.png')

  if (!hasEither(directory, 'icon.png', 'icon.webp')) {
    if (!await ensureFernando(result, directory, 'icon.png')) {
      const publicPng = path.join(root, 'public/ship-icons', `${ship.skin_id}.png`)
      const publicWebp = path.join(root, 'public/ship-icons', `${ship.skin_id}.webp`)
      if (fs.existsSync(publicPng)) copyFallback(result, publicPng, path.join(directory, 'icon.png'), 'public icon.png')
      else if (fs.existsSync(publicWebp)) copyFallback(result, publicWebp, path.join(directory, 'icon.webp'), 'public icon.webp')
    }
  }

  if (!hasEither(directory, 'shipyard.png', 'shipyard.webp')) {
    if (!await ensureFernando(result, directory, 'shipyard.png') && ship.shipyard) {
      await download(result, ship.shipyard, path.join(directory, 'shipyard.webp'), 'ALtoy shipyard.webp')
    }
  }

  if (result.downloaded.length || result.unavailable.length) results.push(result)
})

const report = {
  generatedAt: new Date().toISOString(),
  checked: altoy.length,
  changedShips: results.filter(item => item.downloaded.length).length,
  unavailableShips: results.filter(item => item.unavailable.length).length,
  results,
}
const output = path.join(root, 'reports/data-sources/image-sync.json')
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`참고 이미지 확인 완료: ${altoy.length}척, 갱신 ${report.changedShips}척, 원격 미제공 기록 ${report.unavailableShips}척`)

async function ensureFernando(result, directory, filename) {
  if (fs.existsSync(path.join(directory, filename))) return true
  return download(result, `${fernandoBase}/${result.skinId}/${filename}`, path.join(directory, filename), `Fernando ${filename}`)
}

async function download(result, url, destination, label) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    const temporary = `${destination}.tmp-${process.pid}`
    try {
      fs.writeFileSync(temporary, bytes)
      fs.renameSync(temporary, destination)
    } finally {
      if (fs.existsSync(temporary)) fs.rmSync(temporary)
    }
    result.downloaded.push({ label, bytes: bytes.byteLength })
    return true
  } catch (error) {
    result.unavailable.push({ label, error: String(error.message || error), url })
    return false
  }
}

function copyFallback(result, source, destination, label) {
  fs.copyFileSync(source, destination)
  result.downloaded.push({ label, bytes: fs.statSync(destination).size })
}

function hasEither(directory, first, second) {
  return fs.existsSync(path.join(directory, first)) || fs.existsSync(path.join(directory, second))
}

async function mapLimit(items, limit, worker) {
  let next = 0
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await worker(item)
    }
  }))
}
