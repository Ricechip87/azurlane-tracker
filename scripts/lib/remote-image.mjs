export async function fetchRemoteImage(url, {
  fetchImpl = fetch,
  timeoutMs = 30_000,
} = {}) {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (response.status === 404 || response.status === 410) {
    return { ok: false, error: `HTTP ${response.status}` }
  }
  if (!response.ok) throw new Error(`원격 이미지 요청 실패: HTTP ${response.status} (${url})`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  validateImageBytes(bytes)
  return { ok: true, bytes }
}

export function validateImageBytes(bytes) {
  if (!detectImageFormat(bytes)) throw new Error('이미지 형식 검증 실패')
}

export function detectImageFormat(bytes) {
  if (isCompletePng(bytes)) return 'png'
  if (isCompleteWebp(bytes)) return 'webp'
  return null
}

function isCompletePng(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < 20 || !signature.every((value, index) => bytes[index] === value)) return false

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset)
    const chunkEnd = offset + 12 + length
    if (chunkEnd > bytes.length) return false
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8))
    offset = chunkEnd
    if (type === 'IEND') return length === 0 && offset === bytes.length
  }
  return false
}

function isCompleteWebp(bytes) {
  if (bytes.length < 20
    || String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF'
    || String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP') return false
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return view.getUint32(4, true) + 8 === bytes.length
}
