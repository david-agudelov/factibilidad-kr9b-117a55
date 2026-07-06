import type { CitationConfidence } from './citations'

export type SpatialFactUsed = {
  layerId: string
  layerTitle: string
  matched: boolean
  attributes: Record<string, unknown>
  sourceUrl: string
  dataDate: string
  confidence: CitationConfidence
}
