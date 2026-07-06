import { SOURCES } from '../data/sources.generated'
import type { GeneratedSource, NormativeCitation } from '../types'

const sourcesById = new Map<string, GeneratedSource>(SOURCES.map((source) => [source.id, source]))

export function getSource(sourceId: string): GeneratedSource | undefined {
  return sourcesById.get(sourceId)
}

export function toCitation(
  sourceId: string,
  overrides: Partial<NormativeCitation> = {},
): NormativeCitation | undefined {
  const source = getSource(sourceId)
  if (!source) return undefined
  if (
    source.ragRole === 'provenance' ||
    source.ragRole === 'project_context' ||
    source.sourceFamily === 'project_doc' ||
    ['derogado', 'compilado'].includes(source.legalStatus)
  ) {
    return undefined
  }

  return {
    sourceId: source.id,
    documentTitle: source.title,
    sourceFamily: source.sourceFamily,
    section: '',
    article: '',
    page: '',
    officialUrl: source.officialUrl,
    versionDate: source.versionDate,
    confidence: 'medium',
    ...overrides,
  }
}

export function citationFromMetadata(metadata: Record<string, unknown>): NormativeCitation | undefined {
  const sourceId = stringFromMetadata(metadata, 'sourceId')
  if (!sourceId) return undefined
  return toCitation(sourceId, {
    documentTitle: stringFromMetadata(metadata, 'title') || undefined,
    section: stringFromMetadata(metadata, 'section'),
    article: stringFromMetadata(metadata, 'article'),
    page: stringFromMetadata(metadata, 'page'),
    officialUrl: stringFromMetadata(metadata, 'officialUrl') || undefined,
    versionDate: stringFromMetadata(metadata, 'versionDate') || undefined,
    confidence: 'medium',
  })
}

export function uniqueCitations(citations: NormativeCitation[]): NormativeCitation[] {
  const seen = new Set<string>()
  return citations.filter((citation) => {
    const key = `${citation.sourceId}:${citation.section}:${citation.article}:${citation.page}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function stringFromMetadata(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}
