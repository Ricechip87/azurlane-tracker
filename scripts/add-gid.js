import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHARS_PATH = path.join(__dirname, '../src/data/characters.json')

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Node.js' } }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

console.log('Fernando2603 ship.json 다운로드 중...')
const ships = await fetchJSON('https://raw.githubusercontent.com/Fernando2603/AzurLane/main/ship.json')

// id → gid 매핑 생성
const idToGid = {}
for (const ship of ships) {
  idToGid[ship.id] = ship.gid
}

const characters = JSON.parse(fs.readFileSync(CHARS_PATH, 'utf-8'))

let matched = 0
const updated = characters.map(c => {
  const gid = idToGid[c.id]
  if (gid) {
    matched++
    return { ...c, gid, iconUrl: `https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/skin/${gid * 10}/icon.png` }
  }
  return c
})

fs.writeFileSync(CHARS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
console.log(`완료: ${matched}/${characters.length}명 gid 매핑`)
