import { describe, expect, it } from 'vitest'
import { buildPolygon } from '../geometry/buildPolygon'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { computeNormativeEnvelope } from '../norms/computeFloorLimit'
import { compareWithPdfSource } from './compareWithPdfSource'

function compare(params = DEFAULT_PARAMS) {
  const envelope = computeNormativeEnvelope(params)
  const geometry = buildPolygon(params)
  return compareWithPdfSource(params, geometry, envelope)
}

describe('compareWithPdfSource', () => {
  it('evaluates 5 floors at 3.0 m by total height and finds the 5-floor base reference', () => {
    const result = compare({ ...DEFAULT_PARAMS, floors: 5, floorHeight: 3, ecosMode: false })

    expect(result.status).toBe('within-pdf-rules')
    expect(result.ruleChecks.totalHeight.passes).toBe(true)
    expect(result.ruleChecks.rearSetback.actual).toBe(5)
    expect(result.nearestReference?.floors).toBe(5)
    expect(result.nearestReference?.sourcePage).toBe(4)
    expect(result.nearestReference?.effectiveArea).toBe(1145.25)
    expect(result.referenceIsExactStudyHeight).toBe(true)
  })

  it('keeps 5 floors at 3.2 m comparable by PDF height rules', () => {
    const result = compare({ ...DEFAULT_PARAMS, floors: 5, floorHeight: 3.2, ecosMode: false })

    expect(result.status).toBe('within-pdf-rules')
    expect(result.ruleChecks.totalHeight.actual).toBe(16)
    expect(result.ruleChecks.rearSetback.actual).toBe(5)
    expect(result.nearestReference?.floors).toBe(5)
    expect(result.referenceIsExactStudyHeight).toBe(false)
    expect(result.messages.join(' ')).toContain('Modelo parametrico evaluado por altura total')
    expect(result.messages.join(' ')).toContain('3.00 m/piso como supuesto del estudio')
  })

  it('evaluates 7 floors at 3.5 m inside the preliminary height envelope', () => {
    const result = compare({ ...DEFAULT_PARAMS, floors: 7, floorHeight: 3.5, ecosMode: false })

    expect(result.status).toBe('within-pdf-rules')
    expect(result.ruleChecks.totalHeight.actual).toBe(24.5)
    expect(result.ruleChecks.rearSetback.actual).toBe(6)
  })

  it('flags total height above 27 m as outside the preliminary PDF envelope', () => {
    const result = compare({ ...DEFAULT_PARAMS, floors: 8, floorHeight: 3.5, ecosMode: false })

    expect(result.status).toBe('outside-preliminary-envelope')
    expect(result.ruleChecks.totalHeight.passes).toBe(false)
  })

  it('uses ECOS reference scenarios only as contextual references', () => {
    const result = compare({ ...DEFAULT_PARAMS, floors: 8, floorHeight: 3, ecosMode: true })

    expect(result.status).toBe('within-pdf-rules')
    expect(result.nearestReference?.ecosMode).toBe(true)
    expect(result.nearestReference?.sourcePage).toBe(7)
    expect(result.nearestReference?.effectiveArea).toBe(1518.29)
  })
})
