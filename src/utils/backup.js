export const BACKUP_SCHEMA_VERSION = 1

export function createBackup(userData, now = new Date()) {
  return {
    app: 'azurlane-growth-optimizer',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    userData: sanitizeUserData(userData),
  }
}

export function parseBackup(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('JSON 파일 형식이 올바르지 않습니다.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('백업 데이터가 객체 형식이 아닙니다.')
  }

  if (parsed.app !== 'azurlane-growth-optimizer') {
    throw new Error('이 앱에서 만든 백업 파일이 아닙니다.')
  }

  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('지원하지 않는 백업 버전입니다.')
  }

  if (!isPlainObject(parsed.userData)) {
    throw new Error('사용자 데이터가 올바르지 않습니다.')
  }

  return sanitizeUserData(parsed.userData)
}

function sanitizeUserData(userData) {
  if (!isPlainObject(userData)) return {}

  return Object.fromEntries(
    Object.entries(userData)
      .filter(([, value]) => isPlainObject(value))
      .map(([id, value]) => [id, { ...value }])
  )
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
