export type CitationConfidence = 'high' | 'medium' | 'low'

export type NormativeCitation = {
  sourceId: string
  documentTitle: string
  sourceFamily: string
  section: string
  article: string
  page: string
  officialUrl: string
  versionDate: string
  confidence: CitationConfidence
}
