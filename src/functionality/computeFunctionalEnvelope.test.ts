import { describe, expect, it } from 'vitest'
import { buildPolygon } from '../geometry/buildPolygon'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { computeNormativeEnvelope } from '../norms/computeFloorLimit'
import { computeFunctionalEnvelope } from './computeFunctionalEnvelope'

describe('computeFunctionalEnvelope', () => {
  it('does not discount area when the selected core option is none', () => {
    const params = { ...DEFAULT_PARAMS, coreOption: 'none' as const }
    const geometry = buildPolygon(params)
    const envelope = computeNormativeEnvelope(params)
    const functionality = computeFunctionalEnvelope(params, geometry, envelope)

    expect(functionality.coreAreaPerFloor).toBe(0)
    expect(functionality.totalUsableArea).toBeCloseTo(geometry.builtArea, 2)
    expect(functionality.adjustedSellableArea).toBeCloseTo(
      geometry.builtArea * params.sellableEfficiency,
      2,
    )
  })

  it('discounts different usable areas for compact, standard, and complete core scenarios', () => {
    const compact = { ...DEFAULT_PARAMS, coreOption: 'compact' as const }
    const standard = { ...DEFAULT_PARAMS, coreOption: 'standard' as const }
    const complete = { ...DEFAULT_PARAMS, coreOption: 'complete' as const }

    const compactFunctional = computeFunctionalEnvelope(
      compact,
      buildPolygon(compact),
      computeNormativeEnvelope(compact),
    )
    const standardFunctional = computeFunctionalEnvelope(
      standard,
      buildPolygon(standard),
      computeNormativeEnvelope(standard),
    )
    const completeFunctional = computeFunctionalEnvelope(
      complete,
      buildPolygon(complete),
      computeNormativeEnvelope(complete),
    )

    expect(compactFunctional.coreAreaPerFloor).toBeLessThan(standardFunctional.coreAreaPerFloor)
    expect(standardFunctional.coreAreaPerFloor).toBeLessThan(completeFunctional.coreAreaPerFloor)
    expect(compactFunctional.totalUsableArea).toBeGreaterThan(standardFunctional.totalUsableArea)
    expect(standardFunctional.totalUsableArea).toBeGreaterThan(completeFunctional.totalUsableArea)
  })

  it('warns when the useful upper plate is narrow after lateral setback applies', () => {
    const params = {
      ...DEFAULT_PARAMS,
      floors: 8,
      floorHeight: 3.2,
      coreOption: 'complete' as const,
    }
    const geometry = buildPolygon(params)
    const envelope = computeNormativeEnvelope(params)
    const functionality = computeFunctionalEnvelope(params, geometry, envelope)

    expect(functionality.status).not.toBe('viable')
    expect(functionality.messages.join(' ')).toContain('planta superior')
  })
})
