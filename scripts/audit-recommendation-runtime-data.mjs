import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const componentPaths = [
  'src/components/GrowthRecommendationPage.jsx',
  'src/components/ResearchRecommendationPage.jsx',
  'src/components/TechPointRecommendationPage.jsx',
  'src/components/AdditionalStatRecommendationPage.jsx',
]
const fleetComponentPath = 'src/components/FleetRecommendationPage.jsx'

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

const fleetSource = await readFile(new URL(`../${fleetComponentPath}`, import.meta.url), 'utf8')
for (const dataFile of [
  'shipCombatData.json',
  'equipmentDirectStats.json',
  'stageRequirements.json',
]) {
  assert.doesNotMatch(
    fleetSource,
    new RegExp(`${dataFile.replace('.', '\\.')}\\?url`),
    `${fleetComponentPath} must not emit ${dataFile} as a fetch-only asset`,
  )
  assert.match(
    fleetSource,
    new RegExp(`${dataFile.replace('.', '\\.')}['"]`),
    `${fleetComponentPath} must statically include ${dataFile}`,
  )
}

const recommendationPageSource = await readFile(
  new URL('../src/components/RecommendationPage.jsx', import.meta.url),
  'utf8',
)
assert.match(
  recommendationPageSource,
  /lazy\(\(\) => import\('\.\/FleetRecommendationPage\.jsx'\)\)/,
  'large fleet recommendation data must load only when the fleet tab is opened',
)

console.log('recommendation runtime data audit passed')
