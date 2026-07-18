import assert from 'node:assert/strict'
import { shouldShowBackToTop } from './backToTop.js'

assert.equal(shouldShowBackToTop({ scrollY: 399, viewportHeight: 900, documentHeight: 2400 }), false)
assert.equal(shouldShowBackToTop({ scrollY: 400, viewportHeight: 900, documentHeight: 2400 }), true)
assert.equal(shouldShowBackToTop({ scrollY: 900, viewportHeight: 900, documentHeight: 900 }), false)
assert.equal(shouldShowBackToTop({ scrollY: 900, viewportHeight: 900, documentHeight: 899 }), false)
