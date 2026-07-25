export function normalizeCharacterSourceId(value) {
  const id = String(value || '').trim()
  return /^\d+$/.test(id) ? String(Number.parseInt(id, 10)) : id
}

export function normalizeCharacterSourceName(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/[·・]\s*META$/i, '(META)')
    .replace(/\s+/g, '')
}

export function buildExistingCharacterIndexes(characters) {
  return {
    byId: new Map(characters.map(character => [normalizeCharacterSourceId(character.id), character])),
    byName: new Map(characters.map(character => [normalizeCharacterSourceName(character.name), character])),
  }
}

export function selectExistingCharacter(indexes, source) {
  const sourceName = normalizeCharacterSourceName(source.name)
  const idMatch = indexes.byId.get(normalizeCharacterSourceId(source.id))
  if (idMatch && normalizeCharacterSourceName(idMatch.name) === sourceName) return idMatch
  return indexes.byName.get(sourceName) || {}
}
