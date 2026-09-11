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

function hasValidGid(character) {
  const gid = Number(character?.gid)
  return Number.isInteger(gid) && gid > 0
}

export function assertKrRosterSourceReady(characters) {
  if (!Array.isArray(characters) || characters.length === 0
    || characters.some(character => !hasValidGid(character) || !normalizeCharacterSourceName(character.name))) {
    throw new Error('ALtoy KR 함선 원천이 없거나 잘못되었습니다. 원천을 동기화한 뒤 다시 생성하세요. 기존 데이터는 유지합니다.')
  }
}

export function isKrConfirmedCharacter({ existing, altoy }) {
  return hasValidGid(altoy) || hasValidGid(existing)
}

export function assertExistingCharacterIdentitiesPreserved(existing, generated) {
  const generatedByGid = new Map(generated.filter(hasValidGid).map(character => [Number(character.gid), character]))
  const lost = existing.filter(hasValidGid).filter(character => {
    const next = generatedByGid.get(Number(character.gid))
    return !next || normalizeCharacterSourceId(next.id) !== normalizeCharacterSourceId(character.id)
  })
  if (lost.length) {
    throw new Error(`기존 KR 함선 identity가 사라졌습니다. CSV·override를 확인하세요: ${lost.map(character => `${character.name || character.id} (${character.gid})`).join(', ')}`)
  }
}
