import { describe, expect, it } from 'vitest'
import { buildPolygon } from '../geometry/buildPolygon'
import { computeFunctionalEnvelope } from '../functionality/computeFunctionalEnvelope'
import { computeMetrics } from '../metrics/computeMetrics'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { computeNormativeEnvelope } from '../norms/computeFloorLimit'
import { buildLiveModelSnapshot } from './liveModelSnapshot'

describe('buildLiveModelSnapshot', () => {
  it('adapts the parametric model outputs into the finance contract', () => {
    const geometry = buildPolygon(DEFAULT_PARAMS)
    const envelope = computeNormativeEnvelope(DEFAULT_PARAMS)
    const functionality = computeFunctionalEnvelope(DEFAULT_PARAMS, geometry, envelope)
    const metrics = computeMetrics(geometry, DEFAULT_PARAMS, envelope, functionality)

    const snapshot = buildLiveModelSnapshot({
      params: DEFAULT_PARAMS,
      envelope,
      geometry,
      metrics,
      validation: {
        isValid: true,
        severity: 'warning',
        messages: ['Confirmar perfil vial.'],
      },
    })

    expect(snapshot.caseId).toBe('KR9B_117A55')
    expect(snapshot.floors).toBe(DEFAULT_PARAMS.floors)
    expect(snapshot.floorHeight).toBe(DEFAULT_PARAMS.floorHeight)
    expect(snapshot.ecosMode).toBe(DEFAULT_PARAMS.ecosMode)
    expect(snapshot.totalHeight).toBe(envelope.totalHeight)
    expect(snapshot.lotArea).toBeCloseTo(326.184, 3)
    expect(snapshot.builtArea).toBeCloseTo(geometry.builtArea, 2)
    expect(snapshot.usableArea).toBeCloseTo(functionality.totalUsableArea, 2)
    expect(snapshot.sellableArea).toBeCloseTo(functionality.adjustedSellableArea, 2)
    expect(snapshot.footprintArea).toBeCloseTo(geometry.netLowerFootprintArea, 2)
    expect(snapshot.occupancy).toBeCloseTo(geometry.netLowerFootprintArea / 326.184, 4)
    expect(snapshot.iceLimit).toBe(envelope.iceLimit)
    expect(snapshot.iceMargin).toBeCloseTo(envelope.iceLimit - geometry.builtArea, 2)
    expect(snapshot.rearSetback).toBe(envelope.rearSetback)
    expect(snapshot.sideSetback).toBe(envelope.sideSetbackApplied)
    expect(snapshot.validationSeverity).toBe('warning')
    expect(snapshot.validationMessages).toEqual(['Confirmar perfil vial.'])
  })
})
