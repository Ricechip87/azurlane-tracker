export function createShipObtainabilityLookup(ships = []) {
  const byGid = new Map()
  const byId = new Map()
  const nameGroups = new Map()

  for (const ship of ships) {
    if (ship?.gid != null) byGid.set(String(ship.gid), ship)
    if (ship?.id != null) byId.set(String(ship.id), ship)
    if (!ship?.name) continue
    const group = nameGroups.get(ship.name) || []
    group.push(ship)
    nameGroups.set(ship.name, group)
  }

  return {
    get(characterOrName) {
      if (characterOrName && typeof characterOrName === 'object') {
        if (characterOrName.gid != null && byGid.has(String(characterOrName.gid))) {
          return byGid.get(String(characterOrName.gid))
        }
        if (characterOrName.id != null && byId.has(String(characterOrName.id))) {
          return byId.get(String(characterOrName.id))
        }
        return uniqueNameMatch(nameGroups, characterOrName.name)
      }
      return uniqueNameMatch(nameGroups, characterOrName)
    },
  }
}

export function getShipObtainability(lookup, character) {
  if (!lookup || !character) return undefined
  return lookup.get(character) || lookup.get(character.name)
}

function uniqueNameMatch(nameGroups, name) {
  const matches = nameGroups.get(name) || []
  return matches.length === 1 ? matches[0] : undefined
}
