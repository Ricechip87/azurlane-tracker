import { readFileSync } from 'fs'
const chars = JSON.parse(readFileSync('./src/data/characters.json', 'utf-8'))
const mismatched = chars.filter((c, i) => c.id !== i + 1)
console.log(`전체 ${chars.length}명 중 순서 불일치: ${mismatched.length}명`)
mismatched.slice(0, 20).forEach(c => {
  const row = chars.indexOf(c) + 1
  console.log(`  ${row}번째 행 → 게임ID: ${c.id}  이름: ${c.name}`)
})
