import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { resolveParamsForLiveModel } from './modelReducer'

describe('resolveParamsForLiveModel', () => {
  it('clamps floors to the dynamic preliminary maximum', () => {
    const result = resolveParamsForLiveModel({ ...DEFAULT_PARAMS, floors: 99 })

    expect(result.params.floors).toBe(9)
    expect(result.adjustmentMessages.join(' ')).toContain('Pisos ajustados')
  })

  it('keeps the slider minimum at 2 floors', () => {
    const result = resolveParamsForLiveModel({ ...DEFAULT_PARAMS, floors: 1 })

    expect(result.params.floors).toBe(2)
    expect(result.floorLimit.minFloors).toBe(2)
  })

  it('recomputes the maximum when floor height changes', () => {
    const result = resolveParamsForLiveModel({
      ...DEFAULT_PARAMS,
      floors: 9,
      floorHeight: 3.5,
    })

    expect(result.params.floors).toBe(7)
    expect(result.floorLimit.maxFloors).toBe(7)
    expect(result.envelope.totalHeight).toBe(24.5)
  })

  it('clamps floor height to the minimum live-model height', () => {
    const result = resolveParamsForLiveModel({
      ...DEFAULT_PARAMS,
      floorHeight: 2.1,
    })

    expect(result.params.floorHeight).toBe(2.3)
    expect(result.envelope.totalHeight).toBe(11.5)
    expect(result.adjustmentMessages.join(' ')).toContain('Altura entre pisos ajustada')
  })
})
