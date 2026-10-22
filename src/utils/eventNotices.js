import { toKstDateKey } from './kstDate.js'

// 점검 시각이 명시되지 않은 공지는 기존 이벤트와 동일하게 KST 종료일을 포함한다.
export function getActiveSelectionNotices(events = [], now = new Date()) {
  const today = toKstDateKey(now)
  if (!today) return []
  return events.filter(event => event.kind === 'selectable-rerun'
    && event.startsAt?.slice(0, 10) <= today
    && event.endsAt?.slice(0, 10) >= today)
}
