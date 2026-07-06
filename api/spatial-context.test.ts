import { describe, expect, test } from 'vitest'
import { handleSpatialContextRequest } from './spatial-context'

describe('handleSpatialContextRequest', () => {
  test('resolves the KR9B_117A55 case into deterministic spatial facts', async () => {
    const response = await handleSpatialContextRequest({
      query: 'contexto espacial del caso KR9B_117A55',
      parcelInput: {
        address: 'KR 9B #117A-55',
        chip: '',
        lotId: 'KR9B_117A55',
        geometry: null,
      },
    })

    expect(response.status).toBe('resolved')
    expect(response.parcel.lotId).toBe('KR9B_117A55')
    expect(response.spatialFacts.length).toBeGreaterThan(0)
    expect(response.spatialFacts[0]).toMatchObject({
      matched: true,
      confidence: expect.stringMatching(/high|medium|low/),
    })
  })

  test('returns ambiguous when parcel input is present but cannot be resolved deterministically', async () => {
    const response = await handleSpatialContextRequest({
      query: '¿qué aplica a este predio?',
      parcelInput: {
        address: 'Dirección sin normalizar',
        chip: '',
        lotId: '',
        geometry: null,
      },
    })

    expect(response.status).toBe('ambiguous')
    expect(response.spatialFacts).toEqual([])
    expect(response.warnings.length).toBeGreaterThan(0)
  })
})
