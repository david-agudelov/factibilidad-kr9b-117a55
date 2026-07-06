import { enforceAnswerPolicy, unsupportedAnswer } from '../../src/rag/answerPolicy'
import { summarizeSpatialFacts } from '../../src/rag/spatialFacts'
import type { ManifestSource, ParcelSpatialFacts, RagAnswer, RagQuery } from '../../src/rag/types'
import { detectIntent } from './intent'
import { keepDeclaredCitations } from './citations'
import { buildDraftAnswer, type Retriever } from './retrieval'

export type RagQueryDependencies = {
  resolveParcel: (query: RagQuery) => ParcelSpatialFacts | undefined
  retrieve: Retriever
  sources: ManifestSource[]
}

export async function answerRagQuery(
  query: RagQuery,
  dependencies: RagQueryDependencies,
): Promise<RagAnswer> {
  const intent = detectIntent(query.question)
  if (intent === 'unsupported') return unsupportedAnswer(intent)

  const parcelFacts = dependencies.resolveParcel(query)
  if (!parcelFacts) return unsupportedAnswer(intent)

  const sourceIds = dependencies.sources
    .filter((source) => source.ragEligible)
    .map((source) => source.id)
  const documents = await dependencies.retrieve({
    question: query.question,
    intent,
    sourceIds,
    spatialSummary: summarizeSpatialFacts(parcelFacts),
  })
  const citations = keepDeclaredCitations(documents, dependencies.sources)

  return enforceAnswerPolicy({
    draftAnswer: citations.length > 0 ? buildDraftAnswer(documents) : '',
    citations,
    spatialFacts: parcelFacts.facts,
    intent,
  })
}
