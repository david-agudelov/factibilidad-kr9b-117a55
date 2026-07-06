export type Confidence = 'high' | 'medium' | 'low'
export type RagProviderName = 'cloudflare' | 'openai'
export type NormativeIntent =
  | 'general_normative_question'
  | 'parcel_specific_question'
  | 'source_trace_question'
  | 'building_code_question'
  | 'street_edge_question'
  | 'out_of_scope'

export type AiBinding = {
  run: (model: string, input: unknown) => Promise<unknown>
}

export type VectorizeVector = {
  id: string
  values: number[]
  metadata: Record<string, unknown>
}

export type VectorizeMatch = {
  id: string
  score?: number
  metadata?: Record<string, unknown>
}

export type VectorizeBinding = {
  query: (
    vector: number[],
    options?: {
      topK?: number
      returnMetadata?: 'all' | boolean
      filter?: Record<string, unknown>
    },
  ) => Promise<{ matches?: VectorizeMatch[] }>
  upsert: (vectors: VectorizeVector[]) => Promise<{ count?: number } | unknown>
}

export type WorkerEnv = {
  RAG_PROVIDER?: RagProviderName | string
  RAG_ENV?: string
  RAG_ALLOWED_ORIGINS?: string
  RAG_GENERATION_MODEL?: string
  RAG_EMBEDDING_MODEL?: string
  RAG_ACTIVE_INGEST_RUN_ID?: string
  ADMIN_INGEST_TOKEN?: string
  OPENAI_API_KEY?: string
  OPENAI_VECTOR_STORE_ID?: string
  RAG_MODEL?: string
  AI?: AiBinding
  VECTORIZE?: VectorizeBinding
}

export type NormativeCitation = {
  sourceId: string
  documentTitle: string
  sourceFamily: string
  section: string
  article: string
  page: string
  officialUrl: string
  versionDate: string
  confidence: Confidence
}

export type SpatialFactUsed = {
  layerId: string
  layerTitle: string
  matched: boolean
  attributes: Record<string, unknown>
  sourceUrl: string
  dataDate: string
  confidence: Confidence
}

export type NormativeChatRequest = {
  question: string
  parcelContext?: Record<string, unknown>
  appState?: Record<string, unknown>
}

export type NormativeChatResponse = {
  status: 'answered' | 'insufficient_sources' | 'out_of_scope' | 'error'
  answer: string
  spatialFactsUsed: SpatialFactUsed[]
  citations: NormativeCitation[]
  warnings: string[]
}

export type SpatialContextRequest = {
  query: string
  parcelInput: {
    address: string
    chip: string
    lotId: string
    geometry: unknown
  }
}

export type SpatialContextResponse = {
  status: 'resolved' | 'not_resolved' | 'ambiguous' | 'error'
  parcel: {
    address: string
    chip: string
    lotId: string
    geometrySource: string
  }
  spatialFacts: SpatialFactUsed[]
  warnings: string[]
}

export type GeneratedSource = {
  id: string
  title: string
  authority: string
  officialUrl: string
  sourceFamily: string
  legalStatus: string
  versionDate: string
  dataDate: string
  ragRole: string
  indexText: boolean
  indexSpatial: boolean
}

export type GeneratedSpatialFacts = {
  parcelId: string
  caseId: string
  resolvedFrom?: {
    kind: string
    value: string
    confidence: Confidence
  }
  generatedAt?: string
  spatialReference: string
  parcel?: Record<string, unknown>
  warnings?: string[]
  facts: Array<{
    id: string
    label: string
    value: string | number | boolean
    unit?: string
    sourceId: string
    matched?: boolean
    method: string
    attributes?: Record<string, unknown>
    geometryRelation?: Record<string, unknown>
    sourceUrl?: string
    dataDate: string
    confidence: Confidence
  }>
}
