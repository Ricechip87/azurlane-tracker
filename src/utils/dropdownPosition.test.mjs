import assert from 'node:assert/strict'
import { getDropdownMenuPosition } from './dropdownPosition.js'

const viewport = { width: 1280, height: 768 }
const menu = { width: 80, height: 152 }

const nearBottom = getDropdownMenuPosition({
  buttonRect: { left: 920, top: 700, right: 1000, bottom: 724, width: 80 },
  menuRect: menu,
  viewport,
})
assert.equal(nearBottom.placement, 'top')
assert.equal(nearBottom.top, 544)
assert.equal(nearBottom.maxHeight, 152)

const nearTop = getDropdownMenuPosition({
  buttonRect: { left: 920, top: 40, right: 1000, bottom: 64, width: 80 },
  menuRect: menu,
  viewport,
})
assert.equal(nearTop.placement, 'bottom')
assert.equal(nearTop.top, 68)

const cramped = getDropdownMenuPosition({
  buttonRect: { left: 920, top: 90, right: 1000, bottom: 114, width: 80 },
  menuRect: { width: 80, height: 300 },
  viewport: { width: 1024, height: 180 },
})
assert.equal(cramped.placement, 'top')
assert.equal(cramped.maxHeight, 78)
assert.equal(cramped.top, 8)

const rightEdge = getDropdownMenuPosition({
  buttonRect: { left: 990, top: 40, right: 1030, bottom: 64, width: 40 },
  menuRect: { width: 120, height: 80 },
  viewport: { width: 1024, height: 768 },
})
assert.equal(rightEdge.left, 896)
