import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyAppMissingFleetTech } from './data-issues-report.mjs'

test('KR roster ships missing from the app are not classified as CN-only', () => {
  const issues = classifyAppMissingFleetTech({
    gids: [10156, 10157, 30119],
    krRosterGids: new Set([10156, 10157]),
    altoyGids: new Set(),
  })

  assert.deepEqual(issues, [
    { gid: 10156, status: 'kr-app-pending' },
    { gid: 10157, status: 'kr-app-pending' },
    { gid: 30119, status: 'cn-only' },
  ])
})
