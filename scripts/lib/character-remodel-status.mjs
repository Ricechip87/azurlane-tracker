export function resolveCanRemodel(sheetValue, altoyCharacter) {
  return String(sheetValue ?? '').trim() === 'O' || Boolean(altoyCharacter?.retrofit)
}
