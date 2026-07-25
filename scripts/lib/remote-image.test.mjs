import assert from 'node:assert/strict'
import { fetchRemoteImage } from './remote-image.mjs'

const png = Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
))
const success = await fetchRemoteImage('https://example.test/image.png', {
  fetchImpl: async () => new Response(png, { status: 200 }),
})
assert.equal(success.ok, true)
assert.deepEqual(success.bytes, png)

const missing = await fetchRemoteImage('https://example.test/missing.png', {
  fetchImpl: async () => new Response('', { status: 404 }),
})
assert.equal(missing.ok, false)
assert.match(missing.error, /HTTP 404/)

await assert.rejects(
  () => fetchRemoteImage('https://example.test/not-image.png', {
    fetchImpl: async () => new Response('<html></html>', { status: 200 }),
  }),
  /이미지 형식/,
)
await assert.rejects(
  () => fetchRemoteImage('https://example.test/server-error.png', {
    fetchImpl: async () => new Response('', { status: 500 }),
  }),
  /HTTP 500/,
)
await assert.rejects(
  () => fetchRemoteImage('https://example.test/network-error.png', {
    fetchImpl: async () => { throw new Error('DNS failed') },
  }),
  /DNS failed/,
)

console.log('remote image tests passed')
