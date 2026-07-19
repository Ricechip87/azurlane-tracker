import assert from 'node:assert/strict'
import { getEffectiveRarity, getResearchRarityLabel, isRemodeled } from './rarity.js'

assert.equal(isRemodeled({ remodeled: 'O' }), true)
assert.equal(isRemodeled({ remodeled: '개장' }), true)
assert.equal(isRemodeled({ remodeled: 'X' }), false)
assert.equal(isRemodeled({ remodeled: '없음' }), false)

assert.equal(getEffectiveRarity({ rarity: 'N', remodeled: 'O' }), 'R')
assert.equal(getEffectiveRarity({ rarity: 'R', remodeled: 'O' }), 'SR')
assert.equal(getEffectiveRarity({ rarity: 'SR', remodeled: 'O' }), 'SSR')
assert.equal(getEffectiveRarity({ rarity: 'SSR', remodeled: 'O' }), 'UR')
assert.equal(getEffectiveRarity({ rarity: 'UR', remodeled: 'O' }), 'UR')
assert.equal(getEffectiveRarity({ rarity: 'SR', remodeled: 'X' }), 'SR')
assert.equal(getResearchRarityLabel('DR'), 'DR · UR')
assert.equal(getResearchRarityLabel('PR'), 'PR · SSR')
assert.equal(getResearchRarityLabel(''), '-')
