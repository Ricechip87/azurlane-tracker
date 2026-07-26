import assert from 'node:assert/strict'
import { getStatDisplayName, normalizeStatName } from './statLabels.js'

assert.equal(getStatDisplayName('뇌격'), '뇌장')
assert.equal(getStatDisplayName('뇌장'), '뇌장')
assert.equal(getStatDisplayName('화력'), '포격')
assert.equal(getStatDisplayName('포격'), '포격')
assert.equal(getStatDisplayName('회피'), '기동')
assert.equal(getStatDisplayName('기동'), '기동')
assert.equal(getStatDisplayName('대공'), '대공')
assert.equal(getStatDisplayName(''), '')
assert.equal(normalizeStatName('뇌장'), '뇌격')
assert.equal(normalizeStatName('포격'), '화력')
assert.equal(normalizeStatName('기동'), '회피')
assert.equal(normalizeStatName('뇌격'), '뇌격')
assert.equal(normalizeStatName(' 뇌격 (뇌장) '), '뇌격')
