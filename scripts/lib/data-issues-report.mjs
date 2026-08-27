export function classifyAppMissingFleetTech({ gids, krRosterGids, altoyGids }) {
  return gids.map(gid => {
    const numericGid = Number(gid)
    const inKrRoster = krRosterGids.has(numericGid)
    const inAltoy = altoyGids.has(numericGid)
    let status = 'cn-only'
    if (inKrRoster && inAltoy) status = 'kr-altoy-app-pending'
    else if (inKrRoster) status = 'kr-app-pending'
    else if (inAltoy) status = 'altoy-app-pending'
    return { gid: numericGid, status }
  })
}
