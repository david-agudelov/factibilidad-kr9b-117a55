import type { ManifestSource, RagCitation } from '../../src/rag/types'
import type { RetrievedDocument } from './retrieval'

export function keepDeclaredCitations(
  documents: RetrievedDocument[],
  sources: ManifestSource[],
): RagCitation[] {
  const declaredIds = new Set(sources.map((source) => source.id))

  return documents
    .filter((document) => declaredIds.has(document.sourceId))
    .map((document) => ({
      sourceId: document.sourceId,
      title: document.title,
      url: document.url,
      sourceFamily: document.sourceFamily,
      page: document.page,
      section: document.section,
      excerpt: document.excerpt,
    }))
}
