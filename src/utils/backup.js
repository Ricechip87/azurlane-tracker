import {
  migrateUserDataEnvelope,
  sanitizeUserData,
  USER_DATA_APP,
  USER_DATA_SCHEMA_VERSION,
} from './userDataSchema.js'

export const BACKUP_SCHEMA_VERSION = USER_DATA_SCHEMA_VERSION

export function createBackup(userData, now = new Date()) {
  return {
    app: USER_DATA_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    userData: sanitizeUserData(userData),
  }
}

export function parseBackup(raw) {
  return parseBackupWithMetadata(raw).userData
}

export function parseBackupWithMetadata(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('JSON 파일 형식이 올바르지 않습니다.')
  }

  const result = migrateUserDataEnvelope(parsed)
  return {
    userData: result.envelope.userData,
    migrated: result.migrated,
    fromVersion: result.fromVersion,
    toVersion: result.envelope.schemaVersion,
    warnings: result.warnings,
  }
}
