import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const componentPaths = [
  'src/components/GrowthRecommendationPage.jsx',
  'src/components/ResearchRecommendationPage.jsx',
  'src/components/TechPointRecommendationPage.jsx',
  'src/components/AdditionalStatRecommendationPage.jsx',
]

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
assert.doesNotMatch(
  appSource,
  /characters\.json\?url/,
  'App.jsx must not emit a separately hashed character JSON asset',
)
assert.match(
  appSource,
  /characters\.json['"]/,
  'App.jsx must statically include character data',
)

for (const componentPath of componentPaths) {
  const source = await readFile(new URL(`../${componentPath}`, import.meta.url), 'utf8')

  assert.doesNotMatch(
    source,
    /(?:growthRecommendations|shipObtainability)\.json\?url/,
    `${componentPath} must not emit separately hashed recommendation JSON assets`,
  )
  assert.match(
    source,
    /growthRecommendations\.json['"]/,
    `${componentPath} must statically include growth recommendations`,
  )
  assert.match(
    source,
    /shipObtainability\.json['"]/,
    `${componentPath} must statically include ship obtainability data`,
  )
}

console.log('recommendation runtime data audit passed')
