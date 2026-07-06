export type SourcePriority = 'alta' | 'media' | 'baja'

export type SourceFamily =
  | 'legal_primary'
  | 'technical_manual'
  | 'cartography'
  | 'spatial_dataset'
  | 'project'
  | 'legal'
  | 'manual'
  | 'annex'
  | 'map'
  | 'project_doc'
  | 'provenance'

export type RagRole =
  | 'primary_law'
  | 'technical_interpretation'
  | 'spatial_overlay'
  | 'visual_audit'
  | 'provenance'
  | 'project_context'

export type ManifestSource = {
  id: string
  title: string
  authority: string
  url?: string
  officialUrl?: string
  sourceDomain?: string
  type: string
  sourceFamily: SourceFamily
  legalStatus: string
  effectiveDate?: string
  versionDate?: string
  dataDate?: string
  metadataUpdatedAt?: string
  formats: string[]
  priority: SourcePriority
  ragRole?: RagRole
  download?: boolean
  indexText?: boolean
  indexSpatial?: boolean
  ragEligible?: boolean
  localPath?: string
  spatialReference?: string
  license?: string
  checksum?: string
  ingestedAt?: string
  notes?: string
}

export type SourceManifest = {
  version?: string
  schemaVersion?: string
  generatedAt: string
  jurisdiction: string
  basis?: string
  fallbackAnswer: string
  notes?: string[]
  sources: ManifestSource[]
}

export type ManifestValidationResult = {
  isValid: boolean
  errors: string[]
  sourceCount: number
  ragEligibleCount: number
}

export type SpatialFactConfidence = 'high' | 'medium' | 'low'

export type SpatialFact = {
  id: string
  label: string
  value: string | number | boolean
  unit?: string
  sourceId: string
  method: string
  dataDate: string
  confidence: SpatialFactConfidence
}

export type ParcelResolution = {
  kind: 'case' | 'chip' | 'address' | 'parcel'
  value: string
  confidence: SpatialFactConfidence
}

export type ParcelSpatialFacts = {
  parcelId: string
  caseId: string
  resolvedFrom: ParcelResolution
  generatedAt: string
  spatialReference: string
  facts: SpatialFact[]
}

export type RagIntent = 'normative' | 'spatial' | 'project' | 'mixed' | 'unsupported'

export type RagCitation = {
  sourceId: string
  title: string
  url: string
  sourceFamily: SourceFamily
  page?: number
  section?: string
  excerpt?: string
}

export type RagQuery = {
  question: string
  caseId?: string
  parcelId?: string
  chip?: string
  address?: string
}

export type RagAnswer = {
  supported: boolean
  answer: string
  intent: RagIntent
  citations: RagCitation[]
  spatialFacts: SpatialFact[]
  warnings: string[]
}
