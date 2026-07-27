import fs from 'node:fs'
import path from 'node:path'

export function syncLocalIconAsset({ sourceSkinDir, outputDir, skinId, publicBase = '/azurlane-tracker/ship-icons' }) {
  fs.mkdirSync(outputDir, { recursive: true })

  for (const extension of ['png', 'webp']) {
    const existing = path.join(outputDir, `${skinId}.${extension}`)
    if (fs.existsSync(existing)) return `${publicBase}/${skinId}.${extension}`
  }

  for (const extension of ['png', 'webp']) {
    const source = path.join(sourceSkinDir, String(skinId), `icon.${extension}`)
    if (!fs.existsSync(source)) continue
    const target = path.join(outputDir, `${skinId}.${extension}`)
    fs.copyFileSync(source, target)
    return `${publicBase}/${skinId}.${extension}`
  }

  return null
}
