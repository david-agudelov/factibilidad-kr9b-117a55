import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import { computeFloorLimit } from '../norms/computeFloorLimit'
import { getSliderConfig } from './sliderConfig'

describe('getSliderConfig', () => {
  it('exposes only real editable parametric sliders', () => {
    const sliders = getSliderConfig(computeFloorLimit(DEFAULT_PARAMS))
    const keys = sliders.map((slider) => slider.key)

    expect(keys).toEqual(['floorHeight', 'floors'])
    expect(keys).not.toContain('width')
    expect(keys).not.toContain('depth')
    expect(keys).not.toContain('rearSetback')
    expect(keys).not.toContain('sideSetback')
    expect(keys).not.toContain('courtyardWidth')
    expect(keys).not.toContain('courtyardDepth')
    expect(keys).not.toContain('iceIndex')
    expect(keys).not.toContain('lateralOnsetHeight')
    expect(keys).not.toContain('scale')
  })
})
