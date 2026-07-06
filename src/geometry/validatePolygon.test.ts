import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { buildPolygon } from './buildPolygon'
import { hasSelfIntersections, validatePolygon } from './validatePolygon'

describe('validatePolygon', () => {
  it('accepts the default KR9B model as valid', () => {
    const geometry = buildPolygon(DEFAULT_PARAMS)
    const validation = validatePolygon(geometry, DEFAULT_PARAMS)

    expect(validation.isValid).toBe(true)
    expect(validation.severity).toBe('warning')
    expect(validation.messages.join(' ')).toContain('piso 4')
  })

  it('flags heights above the preliminary PDF envelope without throwing', () => {
    const params = {
      ...DEFAULT_PARAMS,
      floors: 9,
      floorHeight: 3.5,
    }
    const geometry = buildPolygon(params)
    const validation = validatePolygon(geometry, params)

    expect(validation.isValid).toBe(false)
    expect(validation.messages.join(' ')).toContain('27 m')
  })

  it('marks threshold crossings inside a floor as conditioned warnings', () => {
    const params = {
      ...DEFAULT_PARAMS,
      floors: 4,
      floorHeight: 3,
      ecosMode: false,
    }
    const geometry = buildPolygon(params)
    const validation = validatePolygon(geometry, params)

    expect(validation.isValid).toBe(true)
    expect(validation.severity).toBe('warning')
    expect(validation.messages.join(' ')).toContain('piso 4')
    expect(validation.messages.join(' ')).toContain('piso completo se modela con aislamiento')
  })

  it('detects self-intersecting polygons', () => {
    const bowTie = [
      { x: 0, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 4, y: 0 },
    ]

    expect(hasSelfIntersections(bowTie)).toBe(true)
  })
})
