import { createUserDataEnvelope, migrateUserDataEnvelope } from './userDataSchema.js'

export function loadUserDataFromStorage(storage, key, now = new Date()) {
  const raw = storage.getItem(key)
  if (raw === null) return { userData: {}, migrated: false, fromVersion: null, notice: '', error: '' }

  try {
    const parsed = JSON.parse(raw)
    const result = migrateUserDataEnvelope(parsed)
    if (result.migrated) {
      preserveRecovery(storage, key, raw)
      storage.setItem(key, JSON.stringify(createUserDataEnvelope(result.envelope.userData, now)))
    }
    return {
      userData: result.envelope.userData,
      migrated: result.migrated,
      fromVersion: result.fromVersion,
      notice: result.migrated
        ? `사용자 데이터를 v${result.fromVersion}에서 v${result.envelope.schemaVersion}로 자동 변환했습니다.`
        : '',
      error: '',
    }
  } catch (error) {
    preserveRecovery(storage, key, raw)
    return {
      userData: {},
      migrated: false,
      fromVersion: null,
      notice: '',
      error: `저장된 사용자 데이터를 읽지 못했습니다. 원본은 ${key}-recovery에 보관했습니다. (${error instanceof Error ? error.message : '알 수 없는 오류'})`,
    }
  }
}

export function saveUserDataToStorage(storage, key, userData, now = new Date()) {
  storage.setItem(key, JSON.stringify(createUserDataEnvelope(userData, now)))
}

function preserveRecovery(storage, key, raw) {
  const recoveryKey = `${key}-recovery`
  if (storage.getItem(recoveryKey) === null) storage.setItem(recoveryKey, raw)
}
