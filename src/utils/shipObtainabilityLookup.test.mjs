import assert from 'node:assert/strict'
import { createShipObtainabilityLookup } from './shipObtainabilityLookup.js'

const regularBell = { id: 659, gid: 10152, name: '벨', shipType: '구축' }
const collabBell = { id: 'Z004', gid: 1010004, name: '벨', shipType: '항모' }
const lookup = createShipObtainabilityLookup([regularBell, collabBell, { id: 1, gid: 1001, name: '고유함' }])

assert.equal(lookup.get({ gid: 10152, name: '벨' }), regularBell)
assert.equal(lookup.get({ id: 'Z004', name: '벨' }), collabBell)
assert.equal(lookup.get('벨'), undefined, '동명이인 이름 fallback은 허용하지 않아야 합니다.')
assert.equal(lookup.get('고유함')?.gid, 1001)

console.log('ship obtainability lookup tests passed')
