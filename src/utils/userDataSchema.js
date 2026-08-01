import { normalizeAcquisitionStatus } from './acquisitionStatus.js'
import { normalizeAffectionStatus } from './affection.js'

export const USER_DATA_APP = 'azurlane-tracker'
export const LEGACY_USER_DATA_APP = 'azurlane-growth-optimizer'
export const USER_DATA_SCHEMA_VERSION = 3

const REMODEL_STATUS_MAP = {
  O: '개장',
  X: '미개장',
}

export function createUserDataEnvelope(userData, now = new Date()) {
  return {
    app: USER_DATA_APP,
    schemaVersion: USER_DATA_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    userData: sanitizeUserData(userData),
  }
}

export function migrateUserDataEnvelope(input) {
  if (!isPlainObject(input)) {
    throw new Error('사용자 데이터가 객체 형식이 아닙니다.')
  }

  const isEnvelope = 'schemaVersion' in input || 'userData' in input || 'app' in input
  if (!isEnvelope) {
    return {
      envelope: createMigratedEnvelope(input),
      fromVersion: 0,
      migrated: true,
      warnings: [],
    }
  }

  if (input.app !== USER_DATA_APP && input.app !== LEGACY_USER_DATA_APP) {
    throw new Error('이 앱에서 만든 백업 파일 또는 사용자 데이터가 아닙니다.')
  }
  if (!Number.isInteger(input.schemaVersion) || input.schemaVersion < 1) {
    throw new Error('사용자 데이터 버전이 올바르지 않습니다.')
  }
  if (input.schemaVersion > USER_DATA_SCHEMA_VERSION) {
    throw new Error('현재 웹보다 더 최신 버전에서 만든 데이터입니다. 최신 웹에서 다시 시도해 주세요.')
  }
  if (!isPlainObject(input.userData)) {
    throw new Error('사용자 데이터가 올바르지 않습니다.')
  }

  const fromVersion = input.schemaVersion
  const userData = migrateUserData(input.userData, fromVersion)
  const migrated = fromVersion !== USER_DATA_SCHEMA_VERSION || input.app !== USER_DATA_APP
  const envelope = {
    ...input,
    app: USER_DATA_APP,
    schemaVersion: USER_DATA_SCHEMA_VERSION,
    userData,
  }

  return { envelope, fromVersion, migrated, warnings: [] }
}

export function sanitizeUserData(userData) {
  if (!isPlainObject(userData)) return {}

  return Object.fromEntries(
    Object.entries(userData)
      .filter(([, value]) => isPlainObject(value))
      .map(([id, value]) => [id, sanitizeUserRecord(value)])
  )
}

function migrateUserData(userData, fromVersion) {
  let current = sanitizeUserData(userData)
  for (let version = fromVersion; version < USER_DATA_SCHEMA_VERSION; version++) {
    if (version === 1) current = migrateV1ToV2(current)
    if (version === 2) current = migrateV2ToV3(current)
  }
  return current
}

function migrateV1ToV2(userData) {
  return sanitizeUserData(userData)
}

function migrateV2ToV3(userData) {
  return sanitizeUserData(userData)
}

function createMigratedEnvelope(userData) {
  return {
    app: USER_DATA_APP,
    schemaVersion: USER_DATA_SCHEMA_VERSION,
    userData: sanitizeUserData(userData),
  }
}

function sanitizeUserRecord(record) {
  const sanitized = { ...record }
  if ('acquired' in sanitized) sanitized.acquired = normalizeAcquisitionStatus(sanitized.acquired)
  if ('affection' in sanitized) sanitized.affection = normalizeAffectionStatus(sanitized.affection)
  if ('remodeled' in sanitized) sanitized.remodeled = REMODEL_STATUS_MAP[sanitized.remodeled] || sanitized.remodeled
  return sanitized
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
