import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { polygonArea } from './polygonMath'
import { buildPolygon } from './buildPolygon'

describe('buildPolygon', () => {
  it('builds the official lot from KR9B PDF source values', () => {
    const geometry = buildPolygon(DEFAULT_PARAMS)

    expect(polygonArea(geometry.lot)).toBeCloseTo(326.184, 2)
    expect(geometry.boundingBox.width).toBeCloseTo(12.992, 3)
    expect(geometry.boundingBox.depth).toBeCloseTo(25.108, 3)
  })

  it('applies rear and lateral setbacks from floors and floor height', () => {
    const geometry = buildPolygon({
      ...DEFAULT_PARAMS,
      floors: 5,
      floorHeight: 3,
      ecosMode: false,
    })

    expect(geometry.lowerFloors).toBe(4)
    expect(geometry.upperFloors).toBe(1)
    expect(polygonArea(geometry.lowerFootprint)).toBeCloseTo(261.24, 2)
    expect(polygonArea(geometry.upperFootprint)).toBeCloseTo(100.38, 2)
  })

  it('does not create a central courtyard in v1', () => {
    const geometry = buildPolygon(DEFAULT_PARAMS)

    expect(geometry.courtyard).toEqual([])
    expect(geometry.netLowerFootprintArea).toBeCloseTo(
      polygonArea(geometry.lowerFootprint),
      2,
    )
  })
})
