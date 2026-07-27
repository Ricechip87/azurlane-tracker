import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { syncLocalIconAsset } from './local-icon-assets.mjs'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-icon-test-'))
const sourceSkinDir = path.join(root, 'source')
const outputDir = path.join(root, 'public')

try {
  fs.mkdirSync(path.join(sourceSkinDir, '123'), { recursive: true })
  fs.writeFileSync(path.join(sourceSkinDir, '123', 'icon.webp'), Buffer.from('webp-fixture'))

  const url = syncLocalIconAsset({ sourceSkinDir, outputDir, skinId: '123' })
  assert.equal(url, '/azurlane-tracker/ship-icons/123.webp')
  assert.equal(fs.readFileSync(path.join(outputDir, '123.webp'), 'utf8'), 'webp-fixture')

  fs.writeFileSync(path.join(sourceSkinDir, '123', 'icon.webp'), Buffer.from('changed-source'))
  assert.equal(syncLocalIconAsset({ sourceSkinDir, outputDir, skinId: '123' }), url)
  assert.equal(fs.readFileSync(path.join(outputDir, '123.webp'), 'utf8'), 'webp-fixture')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}

console.log('local icon asset tests passed')
