export const ACQUISITION_STATUSES = ['미획득', '획득', '풀돌', '100', '120', '125']
export const ACQUISITION_FILTER_OPTIONS = ['전체', ...ACQUISITION_STATUSES]

const LEGACY_STATUS_MAP = {
  육성중: '100',
  '육성 완료': '120',
}

export function normalizeAcquisitionStatus(status) {
  const normalized = LEGACY_STATUS_MAP[status] || status || '미획득'
  return ACQUISITION_STATUSES.includes(normalized) ? normalized : '미획득'
}

export function isAcquiredStatus(status) {
  return normalizeAcquisitionStatus(status) !== '미획득'
}

export function isLevel100Status(status) {
  return ['풀돌', '100', '120', '125'].includes(normalizeAcquisitionStatus(status))
}

export function isLevel120Status(status) {
  return ['120', '125'].includes(normalizeAcquisitionStatus(status))
}
