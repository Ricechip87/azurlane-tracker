export function parseCsvRecords(text) {
  const records = []
  let record = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      record.push(field)
      field = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && text[index + 1] === '\n') index++
      record.push(field)
      if (record.some(value => value !== '')) records.push(record)
      record = []
      field = ''
      continue
    }

    field += character
  }

  if (inQuotes) throw new Error('CSV에 닫히지 않은 따옴표 필드가 있습니다.')
  record.push(field)
  if (record.some(value => value !== '')) records.push(record)
  return records
}
