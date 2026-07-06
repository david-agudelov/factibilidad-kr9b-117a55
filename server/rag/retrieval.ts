import type { RagCitation, RagIntent, SourceFamily } from '../../src/rag/types'

export type RetrievedDocument = {
  sourceId: string
  title: string
  url: string
  sourceFamily: SourceFamily
  excerpt: string
  page?: number
  section?: string
}

export type RetrievalInput = {
  question: string
  intent: RagIntent
  sourceIds: string[]
  spatialSummary: string
}

export type Retriever = (input: RetrievalInput) => Promise<RetrievedDocument[]> | RetrievedDocument[]

export function documentsToCitations(documents: RetrievedDocument[]): RagCitation[] {
  return documents.map((document) => ({
    sourceId: document.sourceId,
    title: document.title,
    url: document.url,
    sourceFamily: document.sourceFamily,
    page: document.page,
    section: document.section,
    excerpt: document.excerpt,
  }))
}

export function buildDraftAnswer(documents: RetrievedDocument[]): string {
  if (documents.length === 0) return ''

  const primary = documents[0]
  return `${primary.title}: ${primary.excerpt}`
}
