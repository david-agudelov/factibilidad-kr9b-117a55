import { describe, expect, test } from 'vitest'
import { computeLotHeatScore, computeUrbanHeatScore } from './heatmapScore'
import type { HeatmapParams, MeasuredNeighborhoodLot } from './types'

const params: HeatmapParams = {
  targetWidthM: 13.55,
  targetDepthM: 35,
  targetFloors: 9,
}

function lot(
  overrides: Partial<MeasuredNeighborhoodLot>,
): MeasuredNeighborhoodLot {
  return {
    id: 'lot-1',
    lotCode: '0084150001',
    address: 'KR 9 B 117 A 55',
    isStudyLot: false,
    areaM2: 326,
    perimeterM: 76,
    widthM: 13.55,
    depthM: 35,
    registeredFloors: 9,
    measurementConfidence: 'high',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-74.035, 4.696],
          [-74.034, 4.696],
          [-74.034, 4.697],
          [-74.035, 4.697],
          [-74.035, 4.696],
        ],
      ],
    },
    sourceProperties: {},
    ...overrides,
  }
}

describe('computeLotHeatScore', () => {
  test('marks a lot very similar to the target profile as hot', () => {
    const result = computeLotHeatScore(lot({ widthM: 13.6, depthM: 35.4, registeredFloors: 9 }), params)

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.bucket).toBe('hot')
    expect(result.color).toBe('#d7301f')
    expect(result.reasons).toContain('Muy parecido al perfil objetivo.')
  })

  test('marks a close but different lot as orange', () => {
    const result = computeLotHeatScore(lot({ widthM: 12.8, depthM: 33, registeredFloors: 8 }), params)

    expect(result.bucket).toBe('partial')
    expect(result.reasons).toContain('Se acerca, pero tiene alguna diferencia.')
  })

  test('cools down lots that are much larger than the requested target', () => {
    const result = computeLotHeatScore(lot({ widthM: 20, depthM: 60, registeredFloors: 12 }), params)

    expect(result.score).toBeLessThan(40)
    expect(result.bucket).toBe('low')
    expect(result.reasons).toContain('Lejos del perfil objetivo.')
  })

  test('keeps lots without floor data cold and explicit', () => {
    const result = computeLotHeatScore(lot({ widthM: 13.6, depthM: 35.4, registeredFloors: null }), params)

    expect(result.score).toBeLessThanOrEqual(39)
    expect(result.bucket).toBe('low')
    expect(result.reasons).toContain('Sin dato de pisos; no puede comparar el perfil completo.')
  })

  test('uses Space Syntax score without depending on lot-profile sliders', () => {
    const syntaxLot = lot({
      widthM: 8,
      depthM: 20,
      registeredFloors: 3,
      spaceSyntaxScore: 88,
    })
    const changedParams: HeatmapParams = {
      targetWidthM: 25,
      targetDepthM: 60,
      targetFloors: 12,
    }

    const first = computeUrbanHeatScore(syntaxLot, params, 'syntax')
    const second = computeUrbanHeatScore(syntaxLot, changedParams, 'syntax')

    expect(first.score).toBe(88)
    expect(second.score).toBe(88)
    expect(first.breakdown.spaceSyntaxScore).toBe(88)
    expect(first.breakdown.profileScore).toBeLessThan(40)
  })

  test('mixes Space Syntax with the target profile in combined mode', () => {
    const syntaxLot = lot({
      widthM: 13.6,
      depthM: 35.4,
      registeredFloors: 9,
      spaceSyntaxScore: 70,
    })
    const offTargetParams: HeatmapParams = {
      targetWidthM: 25,
      targetDepthM: 60,
      targetFloors: 12,
    }

    const nearTarget = computeUrbanHeatScore(syntaxLot, params, 'combined')
    const farTarget = computeUrbanHeatScore(syntaxLot, offTargetParams, 'combined')

    expect(nearTarget.breakdown.spaceSyntaxWeight).toBe(0.65)
    expect(nearTarget.breakdown.profileWeight).toBe(0.35)
    expect(nearTarget.score).toBeGreaterThan(farTarget.score)
    expect(nearTarget.reasons).toContain('Mezcla 65% accesibilidad urbana y 35% parecido al perfil objetivo.')
  })
})
