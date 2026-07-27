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
  'src/data/shipDatabaseDetails.json',
  'src/data/shipCombatData.json',
  'src/data/equipmentDirectStats.json',
  'src/data/stageRequirements.json',
  'public/ship-icons',
  'public/ship-card-art',
  'reports/growth-recommendations',
]
const commands = [
  [process.execPath, ['scripts/convert-csv.js']],
  [process.execPath, ['scripts/sync-local-icons.js']],
  [process.execPath, ['scripts/add-tech-points.js']],
  ['python', ['-B', 'scripts/extract-growth-recommendations.py']],
  [process.execPath, ['scripts/extract-research-recommendations.mjs']],
  [process.execPath, ['scripts/extract-obtainability.mjs']],
  [process.execPath, ['scripts/extract-fleet-recommendation-data.mjs']],
  [process.execPath, ['scripts/extract-ship-database-details.mjs']],
  [process.execPath, ['scripts/sync-recommendation-card-art.mjs']],
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
  const absolutePath = path.join(root, relativePath)
  if (fs.statSync(absolutePath).isDirectory()) return directoryHash(absolutePath)
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
  if (value.meta) delete value.meta.generatedAt
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function directoryHash(directory) {
  const hash = crypto.createHash('sha256')
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolutePath = path.join(current, entry.name)
      const relativePath = path.relative(directory, absolutePath).replaceAll('\\', '/')
      hash.update(relativePath)
      if (entry.isDirectory()) visit(absolutePath)
      else hash.update(fs.readFileSync(absolutePath))
    }
  }
  visit(directory)
  return hash.digest('hex')
}
