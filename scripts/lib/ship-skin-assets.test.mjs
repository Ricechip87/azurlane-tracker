import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildShipSkinAssetPlan,
  syncShipSkinAssets,
} from './ship-skin-assets.mjs'

const fernandoRoot = 'https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/skin'
const fernandoBackgroundRoot = 'https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/background'
const fernandoBgmRoot = 'https://raw.githubusercontent.com/Fernando2603/AzurLane/main/audio/bgm'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)
const webp = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x0c, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
  0x00, 0x00, 0x00, 0x00,
])

const shipSkinList = [
  {
    gid: 2,
    name: 'Second ship',
    skins: [{
      id: 2000,
      gid: 2,
      painting: `${fernandoRoot}/2000/painting.png`,
      painting_n: null,
      banner: `${fernandoRoot}/2000/banner.png`,
      chibi: null,
      icon: null,
      qicon: null,
      shipyard: null,
    }],
  },
  {
    gid: 1,
    name: 'First ship',
    skins: [{
      id: 1000,
      gid: 1,
      painting: `${fernandoRoot}/1000/painting.png`,
      painting_n: null,
      banner: null,
      chibi: null,
      icon: `${fernandoRoot}/1000/icon.png`,
      qicon: null,
      shipyard: null,
    }],
  },
]

const plan = buildShipSkinAssetPlan({ shipSkinList })
assert.deepEqual(
  plan.assets.map(({ skinId, field, relativePath }) => ({ skinId, field, relativePath })),
  [
    { skinId: '1000', field: 'icon', relativePath: '1000/icon.png' },
    { skinId: '1000', field: 'painting', relativePath: '1000/painting.png' },
    { skinId: '2000', field: 'banner', relativePath: '2000/banner.png' },
    { skinId: '2000', field: 'painting', relativePath: '2000/painting.png' },
  ],
)
assert.equal(plan.checkedShips, 2)
assert.equal(plan.checkedSkins, 2)
assert.equal(plan.declaredSkinAssets, 4)
assert.equal(plan.declaredBackgroundAssets, 0)
assert.equal(plan.assets.length, 4)

// Null URLs are optional, not missing assets synthesized from a filename convention.
assert.equal(plan.assets.some(asset => asset.field === 'painting_n'), false)
assert.equal(plan.assets.some(asset => asset.field === 'chibi'), false)

// Shared background/background2 images belong to the repository-level
// images/background directory. They are deduplicated by their declared URL
// target even when multiple skins or fields reference the same file. BGM is
// audio metadata and is counted for the exclusion report, never downloaded by
// the image synchronizer.
const sharedBackgroundPlan = buildShipSkinAssetPlan({
  shipSkinList: [{
    gid: 21,
    skins: [{
      id: 2100,
      icon: `${fernandoRoot}/2100/icon.png`,
      background: `${fernandoBackgroundRoot}/326.png`,
      background2: `${fernandoBackgroundRoot}/326.png`,
      bgm: `${fernandoBgmRoot}/event-theme.ogg`,
    }, {
      id: 2101,
      background: `${fernandoBackgroundRoot}/326.png`,
      bgm: `${fernandoBgmRoot}/event-theme.ogg`,
    }],
  }],
})
assert.deepEqual(
  sharedBackgroundPlan.assets.map(({ field, relativePath }) => ({ field, relativePath })),
  [
    { field: 'icon', relativePath: '2100/icon.png' },
    { field: 'background', relativePath: 'background/326.png' },
  ],
)
assert.equal(sharedBackgroundPlan.declaredBackgroundReferences, 3)
assert.equal(sharedBackgroundPlan.checkedBackgrounds, 1)
assert.equal(sharedBackgroundPlan.declaredSkinAssets, 1)
assert.equal(sharedBackgroundPlan.declaredBackgroundAssets, 1)
assert.equal(sharedBackgroundPlan.excludedBgmReferences, 2)
assert.equal(sharedBackgroundPlan.excludedUniqueBgm, 1)

const sharedBackgroundRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-shared-background-'))
try {
  const fetches = []
  const syncOptions = {
    shipSkinList: [{
      gid: 21,
      skins: [{
        id: 2100,
        icon: `${fernandoRoot}/2100/icon.png`,
        background: `${fernandoBackgroundRoot}/326.png`,
        background2: `${fernandoBackgroundRoot}/326.png`,
        bgm: `${fernandoBgmRoot}/event-theme.ogg`,
      }],
    }],
    outputRoot: path.join(sharedBackgroundRoot, 'images', 'skin'),
    backgroundOutputRoot: path.join(sharedBackgroundRoot, 'images', 'background'),
    stagingRoot: path.join(sharedBackgroundRoot, 'stage'),
    fetchImpl: async url => {
      fetches.push(url)
      return new Response(png, { status: 200 })
    },
  }
  const firstReport = await syncShipSkinAssets(syncOptions)
  assert.deepEqual(fetches.sort(), [
    `${fernandoBackgroundRoot}/326.png`,
    `${fernandoRoot}/2100/icon.png`,
  ])
  assert.equal(firstReport.checkedBackgrounds, 1)
  assert.equal(firstReport.declaredBackgroundReferences, 2)
  assert.equal(firstReport.declaredSkinAssets, 1)
  assert.equal(firstReport.declaredBackgroundAssets, 1)
  assert.equal(firstReport.excludedBgmReferences, 1)
  assert.equal(firstReport.excludedUniqueBgm, 1)
  assert.equal(fs.existsSync(path.join(syncOptions.backgroundOutputRoot, '326.png')), true)
  assert.equal(fs.existsSync(path.join(syncOptions.outputRoot, '2100', 'icon.png')), true)

  fetches.length = 0
  const rerunReport = await syncShipSkinAssets(syncOptions)
  assert.deepEqual(fetches, [])
  assert.equal(rerunReport.downloadedAssets, 0)
  assert.equal(rerunReport.existingAssets, 2)
} finally {
  fs.rmSync(sharedBackgroundRoot, { recursive: true, force: true })
}

// Fernando can associate the exact same skin asset with multiple playable ship
// records (for example II/μ variants). That is one download target, while all
// source ship records must still be included in the audit count.
const sharedAssetUrl = `${fernandoRoot}/3000/icon.png`
const deduplicatedPlan = buildShipSkinAssetPlan({
  shipSkinList: [
    { gid: 30, skins: [{ id: 3000, gid: 999, icon: sharedAssetUrl }] },
    { gid: 31, skins: [{ id: 3000, gid: 999, icon: sharedAssetUrl }] },
  ],
})
assert.equal(deduplicatedPlan.checkedShips, 2)
assert.equal(deduplicatedPlan.checkedSkins, 1)
assert.deepEqual(
  deduplicatedPlan.assets.map(({ skinId, field, relativePath, url }) => ({
    skinId,
    field,
    relativePath,
    url,
  })),
  [{
    skinId: '3000',
    field: 'icon',
    relativePath: '3000/icon.png',
    url: sharedAssetUrl,
  }],
)

// The same local target may be shared only when the declaration is identical.
// A distinct source URL for that target is ambiguous and must fail closed.
assert.throws(
  () => buildShipSkinAssetPlan({
    shipSkinList: [
      { gid: 40, skins: [{ id: 4000, painting: `${fernandoRoot}/4000/painting.png` }] },
      { gid: 41, skins: [{ id: 4000, painting: `${fernandoRoot}/4000/painting.png?revision=other` }] },
    ],
  }),
  /conflict/i,
)

assert.throws(
  () => buildShipSkinAssetPlan({
    shipSkinList: [
      { gid: 50, skins: [{ id: 5000, icon: `${fernandoRoot}/5000/icon.png` }] },
      { gid: 50, skins: [{ id: 5001, icon: `${fernandoRoot}/5001/icon.png` }] },
    ],
  }),
  /duplicate.*gid|gid.*duplicate/i,
)
assert.throws(
  () => buildShipSkinAssetPlan({ shipSkinList: [{ gid: 51, skins: [] }] }),
  /skins.*empty|at least one skin/i,
)

assert.throws(
  () => buildShipSkinAssetPlan({
    shipSkinList: [{ gid: 1, skins: [{ id: '../1000', painting: `${fernandoRoot}/1000/painting.png` }] }],
  }),
  /numeric|skin\s*id/i,
)
assert.throws(
  () => buildShipSkinAssetPlan({
    shipSkinList: [{ gid: 1, skins: [{ id: 1000, painting: 'https://example.test/1000/painting.png' }] }],
  }),
  /host|raw\.githubusercontent\.com/i,
)
assert.throws(
  () => buildShipSkinAssetPlan({
    shipSkinList: [{ gid: 1, skins: [{ id: 1000, painting: `${fernandoRoot}/9999/painting.png` }] }],
  }),
  /path|skin\s*id|URL/i,
)
assert.throws(
  () => buildShipSkinAssetPlan({
    shipSkinList: [{ gid: 1, skins: [{ id: 1000, painting: `${fernandoRoot}/1000/icon.png` }] }],
  }),
  /field|filename|URL/i,
)

const atomicRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-atomic-'))
try {
  const outputRoot = path.join(atomicRoot, 'images', 'skin')
  const stagingRoot = path.join(atomicRoot, 'stage')
  write(path.join(outputRoot, '1000', 'icon.png'), png)

  await assert.rejects(
    () => syncShipSkinAssets({
      shipSkinList,
      outputRoot,
      stagingRoot,
      fetchImpl: async url => {
        if (url.endsWith('/2000/banner.png')) throw new Error('simulated download failure')
        return new Response(png, { status: 200 })
      },
    }),
    /simulated download failure/,
  )

  // A failed staging pass must not expose any partial files or replace existing ones.
  assert.deepEqual(fs.readFileSync(path.join(outputRoot, '1000', 'icon.png')), png)
  assert.equal(fs.existsSync(path.join(outputRoot, '1000', 'painting.png')), false)
  assert.equal(fs.existsSync(path.join(outputRoot, '2000', 'painting.png')), false)
  assert.equal(fs.existsSync(stagingRoot), false)
} finally {
  fs.rmSync(atomicRoot, { recursive: true, force: true })
}

const invalidRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-invalid-'))
try {
  const invalidList = [{
    gid: 60,
    skins: [{ id: 6000, icon: `${fernandoRoot}/6000/icon.png` }],
  }, {
    gid: 61,
    skins: [{ id: 6001, icon: `${fernandoRoot}/6001/icon.png` }],
  }, {
    gid: 62,
    skins: [{ id: 6002, icon: `${fernandoRoot}/6002/icon.png` }],
  }]
  const outputRoot = path.join(invalidRoot, 'images', 'skin')
  const fetches = []
  write(path.join(outputRoot, '6000', 'icon.png'), 'not-an-image')
  write(path.join(outputRoot, '6001', 'icon.png'), webp)

  const report = await syncShipSkinAssets({
    shipSkinList: invalidList,
    outputRoot,
    stagingRoot: path.join(invalidRoot, 'stage'),
    fetchImpl: async url => {
      fetches.push(url)
      return new Response(png, { status: 200 })
    },
  })

  assert.deepEqual(fetches.sort(), [
    `${fernandoRoot}/6000/icon.png`,
    `${fernandoRoot}/6001/icon.png`,
    `${fernandoRoot}/6002/icon.png`,
  ])
  assert.deepEqual(fs.readFileSync(path.join(outputRoot, '6000', 'icon.png')), png)
  assert.deepEqual(fs.readFileSync(path.join(outputRoot, '6001', 'icon.png')), png)
  assert.deepEqual(fs.readFileSync(path.join(outputRoot, '6002', 'icon.png')), png)
  assert.equal(report.invalidAssets, 2)
  assert.equal(report.downloadedAssets, 1)
  assert.equal(report.fetchedAssets, 3)
  assert.equal(report.existingAssets, 0)
  assert.deepEqual(report.assets.map(asset => [asset.relativePath, asset.status]), [
    ['6000/icon.png', 'replaced-invalid'],
    ['6001/icon.png', 'replaced-invalid'],
    ['6002/icon.png', 'downloaded'],
  ])
  assert.equal(report.downloadedAssets, report.assets.filter(asset => asset.status === 'downloaded').length)
  assert.equal(report.invalidAssets, report.assets.filter(asset => asset.status === 'replaced-invalid').length)
  assert.equal(report.existingAssets, report.assets.filter(asset => asset.status === 'existing').length)
  assert.equal(report.fetchedAssets, report.downloadedAssets + report.invalidAssets)
} finally {
  fs.rmSync(invalidRoot, { recursive: true, force: true })
}

for (const [skinId, extension, responseBytes] of [
  [7000, 'png', webp],
  [7001, 'webp', png],
]) {
  const mismatchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-mismatch-'))
  try {
    const fieldUrl = `${fernandoRoot}/${skinId}/icon.${extension}`
    await assert.rejects(
      () => syncShipSkinAssets({
        shipSkinList: [{ gid: skinId, skins: [{ id: skinId, icon: fieldUrl }] }],
        outputRoot: path.join(mismatchRoot, 'images', 'skin'),
        stagingRoot: path.join(mismatchRoot, 'stage'),
        fetchImpl: async () => new Response(responseBytes, { status: 200 }),
      }),
      /extension|format|PNG|WebP/i,
    )
    assert.equal(fs.existsSync(path.join(mismatchRoot, 'images', 'skin', String(skinId))), false)
  } finally {
    fs.rmSync(mismatchRoot, { recursive: true, force: true })
  }
}

const rollbackFailureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-rollback-'))
try {
  const outputRoot = path.join(rollbackFailureRoot, 'images', 'skin')
  const stagingRoot = path.join(rollbackFailureRoot, 'stage')
  const target = path.join(outputRoot, '8000', 'icon.png')
  const backup = path.join(stagingRoot, '.backup', '8000', 'icon.png')
  write(target, 'invalid-original-that-must-be-recoverable')

  await assert.rejects(
    () => syncShipSkinAssets({
      shipSkinList: [{
        gid: 80,
        skins: [{ id: 8000, icon: `${fernandoRoot}/8000/icon.png` }],
      }],
      outputRoot,
      stagingRoot,
      fetchImpl: async () => new Response(png, { status: 200 }),
      renameImpl: () => { throw new Error(`simulated install failure: ${target}`) },
      restoreRenameImpl: () => { throw new Error(`simulated restore failure: ${backup} -> ${target}`) },
    }),
    error => {
      assert.ok(error instanceof AggregateError)
      assert.match(error.message, /8000[\\/]icon\.png/)
      assert.match(error.message, /stage|backup/i)
      return true
    },
  )

  assert.equal(fs.existsSync(target), false)
  assert.equal(fs.existsSync(backup), true)
  assert.equal(fs.readFileSync(backup, 'utf8'), 'invalid-original-that-must-be-recoverable')
} finally {
  fs.rmSync(rollbackFailureRoot, { recursive: true, force: true })
}

const concurrentFailureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-concurrent-'))
try {
  const outputRoot = path.join(concurrentFailureRoot, 'images', 'skin')
  const stagingRoot = path.join(concurrentFailureRoot, 'stage')
  let releaseSlowFetch
  let markSlowStarted
  let syncSettled = false
  let slowFinished = false
  const slowRelease = new Promise(resolve => { releaseSlowFetch = resolve })
  const slowStarted = new Promise(resolve => { markSlowStarted = resolve })

  const syncPromise = syncShipSkinAssets({
    shipSkinList: [{
      gid: 90,
      skins: [{
        id: 9000,
        banner: `${fernandoRoot}/9000/banner.png`,
        painting: `${fernandoRoot}/9000/painting.png`,
      }],
    }],
    outputRoot,
    stagingRoot,
    concurrency: 2,
    fetchImpl: async url => {
      if (url.endsWith('/banner.png')) {
        markSlowStarted()
        await slowRelease
        slowFinished = true
        return new Response(png, { status: 200 })
      }
      await slowStarted
      throw new Error('simulated fast concurrent failure')
    },
  })
  syncPromise.then(
    () => { syncSettled = true },
    () => { syncSettled = true },
  )

  await slowStarted
  await new Promise(resolve => setTimeout(resolve, 20))
  const settledBeforeSlowWorker = syncSettled
  releaseSlowFetch()

  await assert.rejects(syncPromise, /simulated fast concurrent failure/)
  assert.equal(settledBeforeSlowWorker, false, 'sync must wait for every concurrent worker before rejecting')
  assert.equal(slowFinished, true)
  assert.equal(fs.existsSync(stagingRoot), false)
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(fs.existsSync(stagingRoot), false, 'a delayed worker must not recreate the cleaned staging directory')
} finally {
  fs.rmSync(concurrentFailureRoot, { recursive: true, force: true })
}

const firstRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-first-'))
const secondRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azurlane-skin-assets-second-'))
try {
  const firstFetches = []
  const firstReport = await runSuccessfulSync(firstRoot, shipSkinList, firstFetches)
  const secondReport = await runSuccessfulSync(secondRoot, [...shipSkinList].reverse(), [])

  assert.deepEqual(firstReport, secondReport)
  assert.equal(firstReport.checkedShips, 2)
  assert.equal(firstReport.checkedSkins, 2)
  assert.equal(firstReport.declaredAssets, 4)
  assert.equal(firstReport.downloadedAssets, 4)
  assert.equal(firstReport.invalidAssets, 0)
  assert.equal(firstReport.fetchedAssets, 4)
  assert.equal(firstReport.existingAssets, 0)
  assert.deepEqual(firstReport.assets.map(asset => asset.relativePath), [
    '1000/icon.png',
    '1000/painting.png',
    '2000/banner.png',
    '2000/painting.png',
  ])
  assert.equal(firstReport.assets.every(asset => asset.status === 'downloaded'), true)
  assert.equal(firstFetches.length, 4)

  const before = snapshotFiles(path.join(firstRoot, 'images', 'skin'))
  const rerunFetches = []
  const rerunReport = await runSuccessfulSync(firstRoot, [...shipSkinList].reverse(), rerunFetches)
  assert.deepEqual(rerunFetches, [])
  assert.deepEqual(snapshotFiles(path.join(firstRoot, 'images', 'skin')), before)
  assert.equal(rerunReport.downloadedAssets, 0)
  assert.equal(rerunReport.invalidAssets, 0)
  assert.equal(rerunReport.fetchedAssets, 0)
  assert.equal(rerunReport.existingAssets, 4)
  assert.equal(rerunReport.assets.every(asset => asset.status === 'existing'), true)
} finally {
  fs.rmSync(firstRoot, { recursive: true, force: true })
  fs.rmSync(secondRoot, { recursive: true, force: true })
}

console.log('ship skin asset tests passed')

async function runSuccessfulSync(root, list, fetches) {
  return syncShipSkinAssets({
    shipSkinList: list,
    outputRoot: path.join(root, 'images', 'skin'),
    stagingRoot: path.join(root, 'stage'),
    fetchImpl: async url => {
      fetches.push(url)
      return new Response(png, { status: 200 })
    },
  })
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, contents)
}

function snapshotFiles(root) {
  const result = {}
  for (const skinId of fs.readdirSync(root).sort()) {
    const directory = path.join(root, skinId)
    for (const filename of fs.readdirSync(directory).sort()) {
      result[`${skinId}/${filename}`] = fs.readFileSync(path.join(directory, filename)).toString('base64')
    }
  }
  return result
}
