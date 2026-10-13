import { isAcquiredStatus, normalizeAcquisitionStatus } from './acquisitionStatus.js'

// This is a read-only source comparison, not a battle-performance calculation.
export function compareFormationExample(example, characters) {
  const byId = new Map(characters.map(character => [String(character.id), character]))
  const compareSlot = slot => {
    const candidates = (slot.candidates || []).map(candidate => {
      const character = byId.get(String(candidate.id))
      const status = normalizeAcquisitionStatus(character?.acquired)
      return {
        ...candidate,
        character,
        registered: Boolean(character),
        owned: isAcquiredStatus(status),
        progressLabel: /^\d+$/.test(status) ? `Lv${status}` : status,
        retrofitMissing: Boolean(candidate.retrofitRequired && character?.remodeled !== '개장'),
      }
    })
    return { ...slot, candidates, hasOwnedCandidate: candidates.some(candidate => candidate.owned) }
  }
  const main = (example.main || []).map(compareSlot)
  const vanguard = (example.vanguard || []).map(compareSlot)
  const slots = [...main, ...vanguard]
  const required = slots.filter(slot => slot.type !== 'training')
  return {
    ...example, main, vanguard,
    summary: {
      requiredSlots: required.length,
      ownedSlots: required.filter(slot => slot.hasOwnedCandidate).length,
      trainingSlots: slots.filter(slot => slot.type === 'training').length,
    },
  }
}
