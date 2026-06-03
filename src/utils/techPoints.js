export function calcTechPoints(c) {
  const status = c.acquired || '미획득'
  const tp = c.techPoints || { acquired: 0, maxLB: 0, lv120: 0 }
  if (status === '미획득') return 0
  if (status === '획득') return tp.acquired
  if (status === '육성중') return tp.acquired + tp.maxLB
  if (status === '육성 완료') return tp.acquired + tp.maxLB + tp.lv120
  return 0
}
