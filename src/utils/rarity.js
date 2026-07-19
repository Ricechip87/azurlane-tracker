const RARITY_UPGRADE = {
  N: 'R',
  R: 'SR',
  SR: 'SSR',
  SSR: 'UR',
}

export function isRemodeled(character) {
  return character?.remodeled === 'O' || character?.remodeled === '개장'
}

export function getEffectiveRarity(character) {
  const rarity = character?.rarity || ''
  if (!isRemodeled(character)) return rarity
  return RARITY_UPGRADE[rarity] || rarity
}

export function getResearchRarityLabel(planRarity) {
  if (planRarity === 'DR') return 'DR · UR'
  if (planRarity === 'PR') return 'PR · SSR'
  return planRarity || '-'
}
