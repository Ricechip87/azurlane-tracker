import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawData = 'https://raw.githubusercontent.com/AzurLaneTools/AzurLaneData/main'
const downloads = [
  ['https://jforplay.github.io/altoy/data/ship_info_lite.json', '참고용/ALtoy/data/ship_info_lite.json'],
  ['https://jforplay.github.io/altoy/data/ship_info_data.json', '참고용/ALtoy/data/ship_info_data.json'],
  ['https://raw.githubusercontent.com/Fernando2603/AzurLane/main/ship.json', '참고용/AzurLane/ship.json'],
  ['https://raw.githubusercontent.com/AzurLaneTools/AzurLaneLuaScripts/main/CN/sharecfg/fleet_tech_ship_template.lua', '참고용/AzurLaneLuaScripts/CN/sharecfg/fleet_tech_ship_template.lua'],
  ['https://docs.google.com/spreadsheets/d/1R5u6fgr3e6XvfqQ3_GMuroeNfe2ShiY65akzzwDnwTs/export?format=csv&gid=1194876348', '참고용/벽람항로(일) - アズールレーン - 함선기술 함선점수】.csv'],
]

for (const region of ['CN', 'EN', 'JP', 'KR', 'TW']) {
  for (const file of ['fleet_tech_ship_template.json', 'fleet_tech_template.json', 'fleet_tech_group.json', 'ship_data_group.json']) {
    downloads.push([`${rawData}/${region}/ShareCfg/${file}`, `참고용/AzurLaneData/${region}/ShareCfg/${file}`])
  }
}

for (const [url, relative] of downloads) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${relative}: HTTP ${response.status} (${url})`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  await writeAtomic(path.join(root, relative), bytes)
  console.log(`갱신: ${relative} (${bytes.byteLength.toLocaleString()} bytes)`)
}

async function writeAtomic(destination, bytes) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  const temporary = `${destination}.tmp-${process.pid}`
  try {
    fs.writeFileSync(temporary, bytes)
    fs.renameSync(temporary, destination)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
}
