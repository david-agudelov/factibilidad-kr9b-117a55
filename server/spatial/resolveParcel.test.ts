import { describe, expect, it } from 'vitest'
import { resolveParcel } from './resolveParcel'

describe('resolveParcel', () => {
  it('resolves the base case without querying external services', () => {
    const resolution = resolveParcel({ caseId: 'KR9B_117A55', question: 'area del lote?' })

    expect(resolution.kind).toBe('case')
    expect(resolution.value).toBe('KR9B_117A55')
    expect(resolution.confidence).toBe('high')
  })

  it('keeps unresolved addresses explicit', () => {
    const resolution = resolveParcel({ address: 'KR 9B #117A-55', question: 'que aplica?' })

    expect(resolution.kind).toBe('address')
    expect(resolution.confidence).toBe('low')
  })
})
