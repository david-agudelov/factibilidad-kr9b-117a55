import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { buildPolygon } from '../geometry/buildPolygon'
import { computeNormativeEnvelope } from '../norms/computeFloorLimit'
import { computeFunctionalEnvelope } from '../functionality/computeFunctionalEnvelope'
import { computeMetrics } from './computeMetrics'

function metricValue(id: string, metrics: ReturnType<typeof computeMetrics>) {
  const metric = metrics.find((item) => item.id === id)
  if (!metric) {
    throw new Error(`Missing metric ${id}`)
  }
  return metric.value
}

describe('computeMetrics', () => {
  it('computes renderable metrics from derived geometry and PDF constants', () => {
    const geometry = buildPolygon(DEFAULT_PARAMS)
    const envelope = computeNormativeEnvelope(DEFAULT_PARAMS)
    const functionality = computeFunctionalEnvelope(DEFAULT_PARAMS, geometry, envelope)
    const metrics = computeMetrics(geometry, DEFAULT_PARAMS, envelope, functionality)

    expect(metricValue('lotArea', metrics)).toBeCloseTo(326.184, 2)
    expect(metricValue('perimeter', metrics)).toBeCloseTo(76.187, 2)
    expect(metricValue('footprint', metrics)).toBeCloseTo(261.24, 2)
    expect(metricValue('builtArea', metrics)).toBeCloseTo(geometry.builtArea, 2)
    expect(metricValue('builtArea', metrics)).toBeCloseTo(
      geometry.netLowerFootprintArea * 3 +
        geometry.netUpperFootprintArea * 2,
      2,
    )
    expect(metricValue('iceLimit', metrics)).toBeCloseTo(1630.92, 2)
    expect(metricValue('rearSetback', metrics)).toBeCloseTo(5, 2)
    expect(metricValue('sideSetback', metrics)).toBeCloseTo(4, 2)
  })

  it('derives built area from floors instead of hardcoded scenario rows', () => {
    const params = { ...DEFAULT_PARAMS, floors: 2 }
    const geometry = buildPolygon(params)
    const envelope = computeNormativeEnvelope(params)
    const functionality = computeFunctionalEnvelope(params, geometry, envelope)
    const metrics = computeMetrics(geometry, params, envelope, functionality)

    expect(metricValue('builtArea', metrics)).toBeCloseTo(
      geometry.netLowerFootprintArea * 2,
      3,
    )
  })

  it('uses sellable efficiency only for sellable area', () => {
    const params = { ...DEFAULT_PARAMS, sellableEfficiency: 0.65 }
    const geometry = buildPolygon(params)
    const envelope = computeNormativeEnvelope(params)
    const functionality = computeFunctionalEnvelope(params, geometry, envelope)
    const metrics = computeMetrics(geometry, params, envelope, functionality)

    expect(metricValue('sellableArea', metrics)).toBeCloseTo(
      functionality.totalUsableArea * 0.65,
      2,
    )
  })

  it('separates gross built area from usable area after the selected core option', () => {
    const params = { ...DEFAULT_PARAMS, coreOption: 'standard' as const }
    const geometry = buildPolygon(params)
    const envelope = computeNormativeEnvelope(params)
    const functionality = computeFunctionalEnvelope(params, geometry, envelope)
    const metrics = computeMetrics(geometry, params, envelope, functionality)

    expect(metricValue('builtArea', metrics)).toBeCloseTo(geometry.builtArea, 2)
    expect(metricValue('usableArea', metrics)).toBeCloseTo(
      functionality.totalUsableArea,
      2,
    )
    expect(metricValue('sellableArea', metrics)).toBeCloseTo(
      functionality.adjustedSellableArea,
      2,
    )
  })
})
