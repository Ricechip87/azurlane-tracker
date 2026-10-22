import assert from 'node:assert/strict'
import activeEvents from '../../scripts/data/kr-active-events.json' with { type: 'json' }
import { getActiveSelectionNotices } from './eventNotices.js'

const notices = activeEvents.informationalEvents
assert.equal(getActiveSelectionNotices(notices, new Date('2026-10-21T23:59:59+09:00')).length, 0)
const [notice] = getActiveSelectionNotices(notices, new Date('2026-10-22T16:00:00+09:00'))
assert.equal(notice.name, '선택형 경량화 복각')
assert.equal(notice.selectionCount, 1)
assert.equal(notice.options.length, 7)
assert.match(notice.note, /변경할 수 없/)
assert.match(notice.note, /다시 선택할 수 없/)
assert.equal(getActiveSelectionNotices(notices, new Date('2026-10-29T23:59:59+09:00')).length, 1)
assert.equal(getActiveSelectionNotices(notices, new Date('2026-10-30T00:00:00+09:00')).length, 0)
assert.equal(getActiveSelectionNotices([], new Date()).length, 0)
assert.ok(!activeEvents.events.some(event => event.name === notice.name), '선택형 복각은 전체 함선의 현재 입수 상태를 덮어쓰지 않는다')
console.log('event notice tests passed')
