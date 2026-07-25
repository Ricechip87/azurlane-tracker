import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const outputs = [
  'src/data/characters.json',
  'src/data/growthRecommendations.json',
  'src/data/researchRecommendations.json',
  'src/data/shipObtainability.json',
]
const commands = [
  [process.execPath, ['scripts/convert-csv.js']],
  [process.execPath, ['scripts/add-tech-points.js']],
  ['python', ['-B', 'scripts/extract-growth-recommendations.py']],
  [process.execPath, ['scripts/extract-research-recommendations.mjs']],
  [process.execPath, ['scripts/extract-obtainability.mjs']],
  [process.execPath, ['scripts/sync-growth-card-art.mjs']],
]

const before = Object.fromEntries(outputs.map(file => [file, semanticHash(file)]))
for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
const changed = outputs.filter(file => before[file] !== semanticHash(file))
if (changed.length) throw new Error(`반복 생성 결과가 달라졌습니다: ${changed.join(', ')}`)
console.log('semantic generation idempotency: passed')

function semanticHash(relativePath) {
  const value = JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
  if (value.meta) delete value.meta.generatedAt
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
