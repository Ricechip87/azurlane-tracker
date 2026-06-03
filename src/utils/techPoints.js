import { normalizeAcquisitionStatus } from './acquisitionStatus.js'

export function calcTechPoints(c) {
  const status = normalizeAcquisitionStatus(c.acquired)
  const tp = c.techPoints || { acquired: 0, maxLB: 0, lv120: 0 }
  if (status === '미획득') return 0
  if (status === '획득') return tp.acquired
  if (status === '풀돌') return tp.acquired + tp.maxLB
  if (status === '100') return tp.acquired + tp.maxLB
  if (status === '120') return tp.acquired + tp.maxLB + tp.lv120
  if (status === '125') return tp.acquired + tp.maxLB + tp.lv120
  return 0
}
