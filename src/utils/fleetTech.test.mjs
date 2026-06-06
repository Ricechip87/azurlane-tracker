import assert from 'node:assert/strict'
import { calcMajorFactionTechPoints, MAJOR_TECH_FACTIONS } from './fleetTech.js'

assert.deepEqual(
  MAJOR_TECH_FACTIONS.map(faction => faction.label),
  ['유니온 (USS)', '로열 (HMS)', '중앵 (IJN)', '철혈 (KMS)']
)

const techPoints = { acquired: 2, maxLB: 3, lv120: 5 }

assert.deepEqual(
  calcMajorFactionTechPoints([
    { faction: '유니온', acquired: '획득', techPoints },
    { faction: 'HMS', acquired: '100', techPoints },
    { faction: 'IJN', acquired: '120', techPoints },
    { faction: '철혈', acquired: '125', techPoints },
    { faction: '동황', acquired: '125', techPoints },
    { faction: '칭송받는자', acquired: '125', techPoints },
    { faction: 'META', acquired: '125', techPoints },
    { faction: 'KMS', acquired: '미획득', techPoints },
  ]),
  {
    유니온: 2,
    로열: 5,
    중앵: 10,
    철혈: 10,
  }
)
