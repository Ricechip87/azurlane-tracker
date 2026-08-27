import fs from 'node:fs'
import path from 'node:path'
import { detectImageFormat, fetchRemoteImage } from './remote-image.mjs'

export const SHIP_SKIN_ASSET_FIELDS = [
  'banner',
  'chibi',
  'icon',
  'painting',
  'painting_n',
  'qicon',
  'shipyard',
]
export const SHIP_SKIN_BACKGROUND_FIELDS = ['background', 'background2']

const FERNANDO_HOST = 'raw.githubusercontent.com'
const FERNANDO_PREFIX = '/Fernando2603/AzurLane/'

export function buildShipSkinAssetPlan({ shipSkinList }) {
  if (!Array.isArray(shipSkinList)) throw new TypeError('ship skin list must be an array')

  const assets = []
  const skinIds = new Set()
  const shipIds = new Set()
  const relativePaths = new Map()
  const backgroundUrls = new Set()
  const bgmUrls = new Set()
  let declaredBackgroundReferences = 0
  let excludedBgmReferences = 0

  for (const ship of shipSkinList) {
    if (!ship || !Number.isInteger(Number(ship.gid))) throw new Error('ship gid must be numeric')
    if (!Array.isArray(ship.skins)) throw new Error(`ship ${ship.gid} skins must be an array`)
    if (ship.skins.length === 0) throw new Error(`ship ${ship.gid} skins must contain at least one skin`)
    const shipId = String(ship.gid)
    if (shipIds.has(shipId)) throw new Error(`duplicate ship gid: ${shipId}`)
    shipIds.add(shipId)

    for (const skin of ship.skins) {
      const skinId = String(skin?.id ?? '')
      if (!/^\d+$/.test(skinId)) throw new Error(`skin id must be numeric: ${skinId}`)
      skinIds.add(skinId)

      for (const field of SHIP_SKIN_ASSET_FIELDS) {
        const url = skin[field]
        if (url == null || url === '') continue
        if (typeof url !== 'string') throw new Error(`${skinId} ${field} URL must be a string`)

        const parsed = new URL(url)
        if (parsed.protocol !== 'https:' || parsed.hostname !== FERNANDO_HOST) {
          throw new Error(`${skinId} ${field} URL host must be ${FERNANDO_HOST}`)
        }
        if (!parsed.pathname.startsWith(FERNANDO_PREFIX)) {
          throw new Error(`${skinId} ${field} URL path is outside the Fernando repository`)
        }
        const expected = new RegExp(`/images/skin/${skinId}/${field}\\.(png|webp)$`, 'i')
        const match = parsed.pathname.match(expected)
        if (!match) throw new Error(`${skinId} ${field} URL filename or skin id does not match the field`)

        const filename = `${field}.${match[1].toLowerCase()}`
        const relativePath = `${skinId}/${filename}`
        const existingUrl = relativePaths.get(relativePath)
        if (existingUrl) {
          if (existingUrl !== url) throw new Error(`conflicting skin asset URL for ${relativePath}`)
          continue
        }
        relativePaths.set(relativePath, url)
        assets.push({ kind: 'skin', skinId, field, filename, relativePath, url })
      }

      for (const field of SHIP_SKIN_BACKGROUND_FIELDS) {
        const url = skin[field]
        if (url == null || url === '') continue
        if (typeof url !== 'string') throw new Error(`${skinId} ${field} URL must be a string`)
        declaredBackgroundReferences++

        const parsed = new URL(url)
        if (parsed.protocol !== 'https:' || parsed.hostname !== FERNANDO_HOST) {
          throw new Error(`${skinId} ${field} URL host must be ${FERNANDO_HOST}`)
        }
        if (!parsed.pathname.startsWith(FERNANDO_PREFIX)) {
          throw new Error(`${skinId} ${field} URL path is outside the Fernando repository`)
        }
        const match = parsed.pathname.match(/\/images\/background\/([^/]+\.(png|webp))$/i)
        if (!match) throw new Error(`${skinId} ${field} URL is not a supported shared background image`)

        const filename = match[1]
        const relativePath = `background/${filename}`
        const existingUrl = relativePaths.get(relativePath)
        if (existingUrl) {
          if (existingUrl !== url) throw new Error(`conflicting skin asset URL for ${relativePath}`)
          backgroundUrls.add(url)
          continue
        }
        relativePaths.set(relativePath, url)
        backgroundUrls.add(url)
        assets.push({ kind: 'background', skinId, field, filename, relativePath, url })
      }

      const bgm = skin.bgm
      if (bgm != null && bgm !== '') {
        if (typeof bgm !== 'string') throw new Error(`${skinId} bgm URL must be a string`)
        excludedBgmReferences++
        bgmUrls.add(bgm)
      }
    }
  }

  assets.sort((left, right) => left.relativePath.localeCompare(right.relativePath, 'en'))
  return {
    checkedShips: shipIds.size,
    checkedSkins: skinIds.size,
    declaredSkinAssets: assets.length - backgroundUrls.size,
    declaredBackgroundAssets: backgroundUrls.size,
    declaredBackgroundReferences,
    checkedBackgrounds: backgroundUrls.size,
    excludedBgmReferences,
    excludedUniqueBgm: bgmUrls.size,
    assets,
  }
}

export async function syncShipSkinAssets({
  shipSkinList,
  outputRoot,
  backgroundOutputRoot = path.join(path.dirname(outputRoot), 'background'),
  stagingRoot,
  fetchImpl = fetch,
  renameImpl = fs.renameSync,
  restoreRenameImpl = fs.renameSync,
  concurrency = 6,
}) {
  const plan = buildShipSkinAssetPlan({ shipSkinList })
  const resolvedOutput = path.resolve(outputRoot)
  const resolvedBackgroundOutput = path.resolve(backgroundOutputRoot)
  const resolvedStage = path.resolve(stagingRoot)
  if (pathsOverlap(resolvedOutput, resolvedStage)
    || pathsOverlap(resolvedBackgroundOutput, resolvedStage)
    || pathsOverlap(resolvedOutput, resolvedBackgroundOutput)) {
    throw new Error('skin asset staging and output paths must be separate')
  }

  const invalidPaths = new Set()
  const pending = plan.assets.filter(asset => {
    const target = getTargetPath(asset, resolvedOutput, resolvedBackgroundOutput)
    if (!fs.existsSync(target)) return true
    const expectedFormat = path.extname(asset.filename).slice(1).toLowerCase()
    try {
      if (detectImageFormat(fs.readFileSync(target)) === expectedFormat) return false
    } catch {
      // Treat unreadable files as invalid and restore them from the declared source.
    }
    invalidPaths.add(asset.relativePath)
    return true
  })
  const pendingPaths = new Set(pending.map(asset => asset.relativePath))
  const transactions = []
  let preserveStage = false

  fs.rmSync(resolvedStage, { recursive: true, force: true })
  fs.mkdirSync(resolvedStage, { recursive: true })

  try {
    await mapLimit(pending, concurrency, async asset => {
      const remote = await fetchDeclaredImage(asset.url, fetchImpl)
      const expectedFormat = path.extname(asset.filename).slice(1).toLowerCase()
      const actualFormat = detectImageFormat(remote.bytes)
      if (actualFormat !== expectedFormat) {
        throw new Error(`skin asset extension/format mismatch: ${asset.relativePath} is ${actualFormat}`)
      }
      const destination = path.join(resolvedStage, getStageRelativePath(asset))
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, remote.bytes)
    })

    for (const asset of pending) {
      const staged = path.join(resolvedStage, getStageRelativePath(asset))
      const target = getTargetPath(asset, resolvedOutput, resolvedBackgroundOutput)
      const backup = path.join(resolvedStage, '.backup', getStageRelativePath(asset))
      const outputBoundary = asset.kind === 'background' ? resolvedBackgroundOutput : resolvedOutput
      const hadOriginal = fs.existsSync(target)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      if (hadOriginal) {
        fs.mkdirSync(path.dirname(backup), { recursive: true })
        fs.renameSync(target, backup)
      }
      const transaction = { target, backup, outputBoundary, hadOriginal, installed: false }
      transactions.push(transaction)
      renameImpl(staged, target)
      transaction.installed = true
    }
  } catch (error) {
    const rollbackErrors = []
    for (const transaction of transactions.reverse()) {
      try {
        if (transaction.installed && fs.existsSync(transaction.target)) fs.rmSync(transaction.target)
        if (transaction.hadOriginal && fs.existsSync(transaction.backup)) {
          fs.mkdirSync(path.dirname(transaction.target), { recursive: true })
          restoreRenameImpl(transaction.backup, transaction.target)
        } else {
          removeEmptyParents(path.dirname(transaction.target), transaction.outputBoundary)
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError)
      }
    }
    if (rollbackErrors.length) {
      preserveStage = true
      const affected = transactions.map(transaction => path.relative(resolvedOutput, transaction.target).replaceAll('\\', '/'))
      throw new AggregateError(
        [error, ...rollbackErrors],
        `skin asset install and rollback failed; backup preserved at ${path.join(resolvedStage, '.backup')}; targets: ${affected.join(', ')}`,
      )
    }
    throw error
  } finally {
    if (!preserveStage) fs.rmSync(resolvedStage, { recursive: true, force: true })
  }

  const assets = plan.assets.map(asset => ({
    skinId: asset.skinId,
    field: asset.field,
    relativePath: asset.relativePath,
    status: invalidPaths.has(asset.relativePath)
      ? 'replaced-invalid'
      : pendingPaths.has(asset.relativePath) ? 'downloaded' : 'existing',
  }))

  return {
    checkedShips: plan.checkedShips,
    checkedSkins: plan.checkedSkins,
    declaredSkinAssets: plan.declaredSkinAssets,
    declaredBackgroundAssets: plan.declaredBackgroundAssets,
    declaredBackgroundReferences: plan.declaredBackgroundReferences,
    checkedBackgrounds: plan.checkedBackgrounds,
    excludedBgmReferences: plan.excludedBgmReferences,
    excludedUniqueBgm: plan.excludedUniqueBgm,
    declaredAssets: plan.assets.length,
    downloadedAssets: pending.length - invalidPaths.size,
    invalidAssets: invalidPaths.size,
    fetchedAssets: pending.length,
    existingAssets: plan.assets.length - pending.length,
    assets,
  }
}

function getTargetPath(asset, skinOutputRoot, backgroundOutputRoot) {
  return asset.kind === 'background'
    ? path.join(backgroundOutputRoot, asset.filename)
    : path.join(skinOutputRoot, asset.relativePath)
}

function getStageRelativePath(asset) {
  return asset.relativePath
}

function pathsOverlap(left, right) {
  return left === right
    || left.startsWith(`${right}${path.sep}`)
    || right.startsWith(`${left}${path.sep}`)
}

async function fetchDeclaredImage(url, fetchImpl) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const remote = await fetchRemoteImage(url, { fetchImpl, timeoutMs: 90_000 })
      if (!remote.ok) throw new Error(`declared skin asset is unavailable: ${remote.error} (${url})`)
      return remote
    } catch (error) {
      lastError = error
      if (attempt === 3 || !isRetryable(error)) break
      await delay(250 * attempt)
    }
  }
  throw lastError
}

function isRetryable(error) {
  const message = String(error?.message || error)
  return error?.name === 'TimeoutError' || /HTTP (429|5\d\d)\b/.test(message)
}

function removeEmptyParents(directory, boundary) {
  let current = directory
  while (current.startsWith(`${boundary}${path.sep}`) && current !== boundary) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) break
    fs.rmdirSync(current)
    current = path.dirname(current)
  }
}

async function mapLimit(items, limit, worker) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('concurrency must be a positive integer')
  let next = 0
  let firstError
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      try {
        await worker(item)
      } catch (error) {
        if (firstError === undefined) firstError = error
        throw error
      }
    }
  })
  await Promise.allSettled(workers)
  if (firstError !== undefined) throw firstError
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
