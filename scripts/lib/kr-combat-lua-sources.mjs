import { extractAssignments } from './research-lua-sources.mjs'

// Read only the literal fields required by the app. Never execute downloaded Lua.
export function parseKrAugmentStatsLua(text) {
  return Object.fromEntries(extractAssignments(text, 'spweapon_data_statistics').map(({ id, body }) => {
    const fields = readTopLevelFields(body, new Set(['next', 'base', 'value_1', 'value_2', 'attribute_1', 'attribute_2']))
    const record = { id }
    for (const key of ['next', 'base', 'value_1', 'value_2']) {
      if (!fields.has(key)) continue
      const literal = fields.get(key)
      if (!/^-?\d+$/.test(literal) || !Number.isSafeInteger(Number(literal))) {
        throw new Error(`Invalid augment ${key} for ${id}`)
      }
      record[key] = Number(literal)
    }
    for (const key of ['attribute_1', 'attribute_2']) {
      if (!fields.has(key)) continue
      const match = fields.get(key).match(/^(["'])([a-z]*)\1$/)
      if (!match) throw new Error(`Invalid augment ${key} for ${id}`)
      record[key] = match[2]
    }
    return [String(id), record]
  }))
}

export function parseKrMetaSkillsLua(text) {
  return Object.fromEntries(extractAssignments(text, 'ship_strengthen_meta').map(({ id, body }) => {
    const fields = readTopLevelFields(body, new Set(['buff_list_task']))
    const literal = fields.get('buff_list_task') || ''
    if (!/^\{\s*(?:\d+\s*(?:,\s*\d+\s*)*,?\s*)?\}$/.test(literal)) {
      throw new Error(`Invalid META buff_list_task for ${id}`)
    }
    const skillIds = [...literal.matchAll(/\d+/g)].map(value => Number(value[0]))
    if (!skillIds.every(Number.isSafeInteger)) throw new Error(`Invalid META buff_list_task for ${id}`)
    return [String(id), {
      id,
      buff_list_task: skillIds,
    }]
  }))
}

// General equipment uses the base record plus the explicit +10 base reference.
// Only officially allowlisted pairs are read; unrelated mirror lag stays out.
export function parseKrEquipmentStatsLua(text, baseIds) {
  const wantedIds = new Set(baseIds.flatMap(id => [Number(id), Number(id) + 10]))
  const numericFields = ['id', 'base', 'type', 'rarity', 'value_1', 'value_2', 'value_3']
  const stringFields = ['name', 'icon', 'attribute_1', 'attribute_2', 'attribute_3']
  const wantedFields = new Set([...numericFields, ...stringFields, 'part_main'])
  return Object.fromEntries(extractAssignments(text, 'equip_data_statistics')
    .filter(({ id }) => wantedIds.has(id))
    .map(({ id, body }) => {
      const fields = readTopLevelFields(body, wantedFields)
      const record = { id }
      for (const key of numericFields) {
        if (!fields.has(key)) continue
        const literal = fields.get(key)
        if (!/^-?\d+(?:\.\d+)?$/.test(literal) || !Number.isFinite(Number(literal))) {
          throw new Error(`Invalid equipment ${key} for ${id}`)
        }
        record[key] = Number(literal)
      }
      if (record.id !== id) throw new Error(`Invalid equipment id for ${id}`)
      for (const key of stringFields) {
        if (!fields.has(key)) continue
        const literal = fields.get(key)
        if (!/^"(?:\\.|[^"\\])*"$/.test(literal)) throw new Error(`Invalid equipment ${key} for ${id}`)
        try {
          record[key] = JSON.parse(literal)
        } catch {
          throw new Error(`Invalid equipment ${key} for ${id}`)
        }
      }
      if (fields.has('part_main')) {
        const literal = fields.get('part_main')
        if (!/^\{\s*(?:\d+\s*(?:,\s*\d+\s*)*,?\s*)?\}$/.test(literal)) {
          throw new Error(`Invalid equipment part_main for ${id}`)
        }
        record.part_main = [...literal.matchAll(/\d+/g)].map(value => Number(value[0]))
      }
      return [String(id), record]
    }))
}

export function validateKrEquipmentFallbacks(records, fallbackIds, baseIds) {
  const added = new Set(fallbackIds.map(String))
  const supportedAttributes = new Set([
    'durability', 'cannon', 'torpedo', 'antiaircraft', 'air', 'reload',
    'hit', 'dodge', 'speed', 'luck', 'antisub',
  ])
  for (const baseId of baseIds) {
    const base = records[String(baseId)]
    const level10 = records[String(Number(baseId) + 10)]
    if (!base) throw new Error(`KR equipment missing: ${baseId}`)
    if (!level10 || Number(level10.base) !== Number(baseId)) {
      throw new Error(`Incomplete KR equipment level 10: ${baseId}`)
    }
    if (!added.has(String(baseId)) && !added.has(String(Number(baseId) + 10))) continue
    if (base.base || !base.name || base.name === '0' || !base.icon
      || !Number.isInteger(base.type) || base.type <= 0
      || !Number.isInteger(base.rarity) || base.rarity < 4
      || !Array.isArray(base.part_main) || !base.part_main.length
      || !base.part_main.every(type => Number.isSafeInteger(type) && type > 0)) {
      throw new Error(`Invalid KR equipment base fields: ${baseId}`)
    }
    let directStatCount = 0
    for (const index of [1, 2, 3]) {
      const attribute = base[`attribute_${index}`]
      const valueKey = `value_${index}`
      if (!attribute) continue
      if (!supportedAttributes.has(attribute)) throw new Error(`Invalid KR equipment attribute_${index}: ${baseId}`)
      const value = level10[valueKey] ?? base[valueKey]
      if (!Number.isFinite(value)) throw new Error(`Invalid KR equipment ${valueKey}: ${baseId}`)
      if (value !== 0) directStatCount += 1
    }
    if (!directStatCount) throw new Error(`Missing KR equipment direct stats: ${baseId}`)
  }
}

// Split only at top-level commas. A field-looking string or nested table is not
// an assignment on this record. Unknown fields are skipped, not interpreted.
function readTopLevelFields(body, wanted) {
  const fields = new Map()
  const stack = []
  let quote = ''
  let escaped = false
  let start = 1
  const addField = end => {
    const entry = body.slice(start, end).trim()
    const match = entry.match(/^([a-zA-Z_]\w*)\s*=\s*([\s\S]*)$/)
    if (!match || !wanted.has(match[1])) return
    if (fields.has(match[1])) throw new Error(`Duplicate Lua field ${match[1]}`)
    fields.set(match[1], match[2].trim())
  }
  for (let index = 1; index < body.length - 1; index += 1) {
    const char = body[index]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") quote = char
    else if ('{[('.includes(char)) stack.push(char)
    else if ('}])'.includes(char)) {
      const open = stack.pop()
      if (!open || '{[('.indexOf(open) !== '}])'.indexOf(char)) {
        throw new Error('Unbalanced Lua field delimiters')
      }
    } else if (char === ',' && stack.length === 0) {
      addField(index)
      start = index + 1
    }
  }
  if (quote || stack.length) throw new Error('Unclosed Lua field literal')
  addField(body.length - 1)
  return fields
}

export function mergeMissingSourceRecords(primary, fallback) {
  const records = { ...primary }
  const addedIds = []
  for (const [id, record] of Object.entries(fallback)) {
    if (Object.hasOwn(records, id)) continue
    records[id] = record
    addedIds.push(id)
  }
  return { records, addedIds }
}

// Keep the established JSON-only policy unchanged; new Lua-backed augments
// must have usable base stats and a complete, acyclic enhancement chain.
export function validateKrAugmentFallbacks(ships, records, fallbackIds) {
  const added = new Set(fallbackIds.map(String))
  const supportedAttributes = new Set([
    'durability', 'cannon', 'torpedo', 'antiaircraft', 'air', 'reload',
    'hit', 'dodge', 'speed', 'luck', 'antisub',
  ])
  for (const ship of ships) {
    const source = ship.sp_weapon
    if (!source?.icon) continue
    const firstId = String(source.icon)
    const first = records[firstId]
    if (!first) throw new Error(`KR augment missing: ${firstId} (${ship.gid})`)
    const chain = []
    const visited = new Set()
    let currentId = firstId
    let complete = false
    while (records[currentId] && !visited.has(currentId)) {
      visited.add(currentId)
      const record = records[currentId]
      chain.push({ id: currentId, record })
      if (!Number.isSafeInteger(record.next) || record.next < 0) break
      if (record.next === 0) {
        complete = true
        break
      }
      currentId = String(record.next)
    }
    if (!chain.some(({ id }) => added.has(id))) continue
    for (const index of [1, 2]) {
      const attributeKey = `attribute_${index}`
      const valueKey = `value_${index}`
      const attribute = first[attributeKey]
      const expectedAttribute = source[attributeKey]
      if (index === 2 && !attribute && !expectedAttribute) continue
      if (!supportedAttributes.has(attribute) || (expectedAttribute && expectedAttribute !== attribute)) {
        throw new Error(`Invalid KR augment ${attributeKey}: ${firstId}`)
      }
      if (!Number.isFinite(first[valueKey])) throw new Error(`Invalid KR augment ${valueKey}: ${firstId}`)
      for (const { id, record } of chain) {
        if (Object.hasOwn(record, valueKey) && !Number.isFinite(record[valueKey])) {
          throw new Error(`Invalid KR augment ${valueKey}: ${id}`)
        }
      }
    }
    if (!complete || chain.some(({ id, record }) => String(record.id) !== id)) {
      throw new Error(`Incomplete KR augment chain: ${firstId}`)
    }
  }
}
