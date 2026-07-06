import type { ManifestSource } from '../../src/rag/types'

type SourceSelectionOptions = {
  chunkedSourceIds?: Set<string>
}

type FileSearchPayloadInput = {
  model: string
  vectorStoreId: string
  question: string
  instructions: string
}

export type FileSearchResponsePayload = {
  model: string
  input: string
  instructions: string
  tools: Array<{
    type: 'file_search'
    vector_store_ids: string[]
  }>
}

export function selectRagEligibleSourceIds(
  sources: ManifestSource[],
  options: SourceSelectionOptions = {},
): string[] {
  return sources
    .filter((source) => isTextRetrievalSource(source, options))
    .map((source) => source.id)
}

function isTextRetrievalSource(
  source: ManifestSource,
  options: SourceSelectionOptions,
): boolean {
  const indexesText = source.indexText ?? source.ragEligible ?? false
  if (!indexesText) return false
  if (source.sourceFamily === 'spatial_dataset') return false
  if (source.ragRole === 'provenance') return false
  if (['derogado', 'compilado'].includes(source.legalStatus)) return false
  if (options.chunkedSourceIds && !options.chunkedSourceIds.has(source.id)) return false
  return true
}

export function buildFileSearchResponsePayload(
  input: FileSearchPayloadInput,
): FileSearchResponsePayload {
  return {
    model: input.model,
    input: input.question,
    instructions: input.instructions,
    tools: [
      {
        type: 'file_search',
        vector_store_ids: [input.vectorStoreId],
      },
    ],
  }
}
