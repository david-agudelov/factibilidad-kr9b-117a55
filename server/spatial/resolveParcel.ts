import type { ParcelResolution, RagQuery } from '../../src/rag/types'

export function resolveParcel(query: RagQuery): ParcelResolution {
  if (query.caseId?.toUpperCase() === 'KR9B_117A55') {
    return {
      kind: 'case',
      value: 'KR9B_117A55',
      confidence: 'high',
    }
  }

  if (query.parcelId) {
    return {
      kind: 'parcel',
      value: query.parcelId,
      confidence: 'medium',
    }
  }

  if (query.chip) {
    return {
      kind: 'chip',
      value: query.chip,
      confidence: 'medium',
    }
  }

  if (query.address) {
    return {
      kind: 'address',
      value: query.address,
      confidence: 'low',
    }
  }

  return {
    kind: 'case',
    value: 'KR9B_117A55',
    confidence: 'medium',
  }
}
