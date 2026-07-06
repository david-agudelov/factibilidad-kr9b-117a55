import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { SITE_CONSTANTS } from '../model/projectSource'
import {
  computeFloorLimit,
  computeNormativeEnvelope,
  normativeRearSetback,
} from './computeFloorLimit'

describe('normativeRearSetback', () => {
  it('uses 4, 5, and 6 meter rear setbacks by total height band from the PDF', () => {
    expect(normativeRearSetback(12)).toBe(4)
    expect(normativeRearSetback(12.01)).toBe(5)
    expect(normativeRearSetback(18)).toBe(5)
    expect(normativeRearSetback(18.01)).toBe(6)
    expect(normativeRearSetback(27)).toBe(6)
  })
})

describe('computeFloorLimit', () => {
  it('starts the floor slider at 2 and finds a preliminary default maximum', () => {
    const limit = computeFloorLimit(DEFAULT_PARAMS)

    expect(limit.minFloors).toBe(2)
    expect(limit.maxFloors).toBe(9)
    expect(limit.limitingFactors).toContain('Altura normativa preliminar')
  })

  it('reduces the maximum when floor height increases', () => {
    const limit = computeFloorLimit({ ...DEFAULT_PARAMS, floorHeight: 3.5 })

    expect(limit.maxFloors).toBe(7)
    expect(limit.limitingFactors).toContain('Altura normativa preliminar')
  })

  it('can be limited by effective construction index before height', () => {
    const limit = computeFloorLimit(DEFAULT_PARAMS, { iceIndex: 3 })

    expect(limit.maxFloors).toBe(4)
    expect(limit.limitingFactors).toContain('ICe maximo')
  })

  it('uses ECOS lateral onset when ECOS mode is enabled', () => {
    const base = computeFloorLimit({ ...DEFAULT_PARAMS, floors: 8, ecosMode: false })
    const ecos = computeFloorLimit({ ...DEFAULT_PARAMS, floors: 8, ecosMode: true })

    expect(ecos.lateralOnsetHeight).toBe(15.7)
    expect(ecos.maxEffectiveAreaBeforeLimit).toBeGreaterThan(
      base.maxEffectiveAreaBeforeLimit,
    )
  })
})

describe('computeNormativeEnvelope', () => {
  it('absorbs the full floor when the base lateral onset cuts a floor', () => {
    const envelope = computeNormativeEnvelope({
      ...DEFAULT_PARAMS,
      floors: 4,
      floorHeight: 3,
      ecosMode: false,
    })

    expect(envelope.totalHeight).toBe(12)
    expect(envelope.lateralOnsetHeight).toBe(11.4)
    expect(envelope.lowerHeight).toBe(9)
    expect(envelope.upperHeight).toBe(3)
    expect(envelope.lowerFloorEquivalent).toBe(3)
    expect(envelope.upperFloorEquivalent).toBe(1)
    expect(envelope.lateralOnsetCutsFloor).toBe(true)
    expect(envelope.lateralTransitionFloor).toBe(4)
    expect(envelope.sideSetbackApplied).toBe(4)
    expect(envelope.status).toBe('condicionado')
  })

  it('absorbs the full floor when the ECOS lateral onset cuts a floor', () => {
    const envelope = computeNormativeEnvelope({
      ...DEFAULT_PARAMS,
      floors: 5,
      floorHeight: 3.2,
      ecosMode: true,
    })

    expect(envelope.totalHeight).toBe(16)
    expect(envelope.lateralOnsetHeight).toBe(15.7)
    expect(envelope.lowerHeight).toBe(12.8)
    expect(envelope.upperHeight).toBe(3.2)
    expect(envelope.lowerFloorEquivalent).toBe(4)
    expect(envelope.upperFloorEquivalent).toBe(1)
    expect(envelope.lateralOnsetCutsFloor).toBe(true)
    expect(envelope.lateralTransitionFloor).toBe(5)
    expect(envelope.sideSetbackApplied).toBe(4)
    expect(envelope.status).toBe('condicionado')
  })

  it('absorbs a minimum-height floor instead of creating a tiny lateral cap', () => {
    const envelope = computeNormativeEnvelope({
      ...DEFAULT_PARAMS,
      floors: 5,
      floorHeight: 2.3,
      ecosMode: false,
    })

    expect(envelope.totalHeight).toBe(11.5)
    expect(envelope.lowerHeight).toBe(9.2)
    expect(envelope.upperHeight).toBe(2.3)
    expect(envelope.lowerFloorEquivalent).toBe(4)
    expect(envelope.upperFloorEquivalent).toBe(1)
    expect(envelope.lateralOnsetCutsFloor).toBe(true)
    expect(envelope.lateralTransitionFloor).toBe(5)
    expect(envelope.sideSetbackApplied).toBe(4)
  })

  it('does not apply ECOS lateral setback before the ECOS onset height', () => {
    const envelope = computeNormativeEnvelope({
      ...DEFAULT_PARAMS,
      floors: 5,
      floorHeight: 3,
      ecosMode: true,
    })

    expect(envelope.totalHeight).toBe(15)
    expect(envelope.upperHeight).toBe(0)
    expect(envelope.upperFloorEquivalent).toBe(0)
    expect(envelope.lateralOnsetCutsFloor).toBe(false)
    expect(envelope.sideSetbackApplied).toBe(0)
  })

  it('derives total height from floors and floor height', () => {
    const envelope = computeNormativeEnvelope({
      ...DEFAULT_PARAMS,
      floors: 6,
      floorHeight: 3.2,
    })

    expect(envelope.totalHeight).toBe(19.2)
    expect(envelope.rearSetback).toBe(6)
  })

  it('uses the PDF source values for ICe and site data', () => {
    const envelope = computeNormativeEnvelope(DEFAULT_PARAMS)

    expect(SITE_CONSTANTS.source.document).toContain('factibilidad_KR9B_117A55.pdf')
    expect(SITE_CONSTANTS.area).toBe(326.184)
    expect(SITE_CONSTANTS.iceIndex).toBe(5)
    expect(envelope.iceLimit).toBe(1630.92)
  })

  it('keeps sellable efficiency as a metric assumption, not a geometry input', () => {
    const envelope = computeNormativeEnvelope({
      ...DEFAULT_PARAMS,
      sellableEfficiency: 0.65,
    })

    expect(envelope.sellableEfficiency).toBe(0.65)
    expect(envelope.lateralOnsetHeight).toBe(11.4)
  })
})
