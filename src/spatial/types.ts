export type GeoJsonPosition = [number, number] | [number, number, number]

export type PolygonGeometry = {
  type: 'Polygon'
  coordinates: GeoJsonPosition[][]
}

export type MultiPolygonGeometry = {
  type: 'MultiPolygon'
  coordinates: GeoJsonPosition[][][]
}

export type NeighborhoodGeometry = PolygonGeometry | MultiPolygonGeometry

export type NeighborhoodFeature = {
  type: 'Feature'
  id?: string | number
  geometry: NeighborhoodGeometry
  properties: Record<string, unknown>
}

export type NeighborhoodFeatureCollection = {
  type: 'FeatureCollection'
  features: NeighborhoodFeature[]
}

export type MeasurementConfidence = 'high' | 'medium' | 'low'

export type MeasuredNeighborhoodLot = {
  id: string
  lotCode: string
  address: string
  isStudyLot: boolean
  areaM2: number | null
  perimeterM: number | null
  widthM: number
  depthM: number
  registeredFloors: number | null
  measurementConfidence: MeasurementConfidence
  centroidLonLat?: [number, number]
  integrationScore?: number | null
  choiceScore?: number | null
  spaceSyntaxScore?: number | null
  syntaxConfidence?: MeasurementConfidence
  geometry: NeighborhoodGeometry
  sourceProperties: Record<string, unknown>
}

export type HeatmapParams = {
  targetWidthM: number
  targetDepthM: number
  targetFloors: number
}

export type HeatBucket = 'low' | 'near' | 'partial' | 'hot'

export type UrbanHeatMode = 'syntax' | 'profile' | 'combined'

export type LotHeatBreakdown = {
  profileScore: number
  spaceSyntaxScore: number
  combinedScore: number
  profileWeight: number
  spaceSyntaxWeight: number
}

export type LotHeatScore = {
  score: number
  mode?: UrbanHeatMode
  bucket: HeatBucket
  color: string
  label: string
  matchedCriteria: number
  reasons: string[]
  breakdown: LotHeatBreakdown
  ratios: {
    width: number
    depth: number
    floors: number | null
  }
}

export type NumericSummary = {
  min: number
  p10: number
  median: number
  p90: number
  max: number
}

export type MeasuredLotsSummary = {
  totalLots: number
  lotsWithoutFloors: number
  widthM: NumericSummary
  depthM: NumericSummary
  floors: NumericSummary
}
