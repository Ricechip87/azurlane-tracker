export function parseResearchBlueprintLua(text) {
  return extractAssignments(text, 'ship_data_blueprint').map(({ id: assignmentId, body }) => ({
    id: numberField(body, 'id') || assignmentId,
    blueprint_version: numberField(body, 'blueprint_version'),
    unlock_word: stringField(body, 'unlock_word'),
    is_pursuing: numberField(body, 'is_pursuing'),
    unlock_task: numberPairs(tableField(body, 'unlock_task')),
  }))
}

export function parseResearchTasksLua(text, wantedIds = null) {
  const wanted = wantedIds ? new Set([...wantedIds].map(Number)) : null
  return Object.fromEntries(extractAssignments(text, 'task_data_template')
    .filter(({ id }) => !wanted || wanted.has(id))
    .map(({ id: assignmentId, body }) => {
      const id = numberField(body, 'id') || assignmentId
      return [String(id), {
        id,
        sub_type: numberField(body, 'sub_type'),
        target_num: numberField(body, 'target_num'),
        target_id: numberPairs(tableField(body, 'target_id')),
        desc: stringField(body, 'desc'),
      }]
    }))
}

export function parseShipDataGroupAllLua(text) {
  const marker = 'pg.ship_data_group.all'
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) throw new Error('ship_data_group.all not found')
  const open = text.indexOf('{', markerIndex)
  const body = balancedTable(text, open)
  return [...body.matchAll(/\d+/g)].map(match => Number(match[0]))
}

export function parseShipDataGroupGidsLua(text) {
  const gids = [...text.matchAll(/\bgroup_type\s*=\s*(\d+)/g)].map(match => Number(match[1]))
  if (!gids.length) throw new Error('ship_data_group group_type records not found')
  return gids
}

function extractAssignments(text, tableName) {
  const pattern = new RegExp(`(?:_G\\.)?pg\\.base\\.${tableName}\\[(\\d+)\\]\\s*=\\s*\\{`, 'g')
  const result = []
  for (const match of text.matchAll(pattern)) {
    const open = match.index + match[0].lastIndexOf('{')
    result.push({ id: Number(match[1]), body: balancedTable(text, open) })
  }
  if (!result.length) throw new Error(`${tableName} assignments not found`)
  return result
}

function balancedTable(text, openIndex) {
  if (openIndex < 0 || text[openIndex] !== '{') throw new Error('Lua table opening brace not found')
  let depth = 0
  let quote = ''
  let escaped = false
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") quote = char
    else if (char === '{') depth += 1
    else if (char === '}' && --depth === 0) return text.slice(openIndex, index + 1)
  }
  throw new Error('Unclosed Lua table')
}

function numberField(body, field) {
  return Number(body.match(new RegExp(`\\b${field}\\s*=\\s*(-?\\d+)`))?.[1] || 0)
}

function stringField(body, field) {
  const match = body.match(new RegExp(`\\b${field}\\s*=\\s*("(?:\\\\.|[^"\\\\])*")`))
  if (match) return JSON.parse(match[1])
  const longString = body.match(new RegExp(`\\b${field}\\s*=\\s*\\[\\[([\\s\\S]*?)\\]\\]`))
  return longString?.[1] || ''
}

function tableField(body, field) {
  const match = new RegExp(`\\b${field}\\s*=\\s*\\{`).exec(body)
  if (!match) return '{}'
  return balancedTable(body, match.index + match[0].lastIndexOf('{'))
}

function numberPairs(table) {
  return [...table.matchAll(/\{\s*(\d+)\s*,\s*(\d+)\s*\}/g)]
    .map(match => [Number(match[1]), Number(match[2])])
}
