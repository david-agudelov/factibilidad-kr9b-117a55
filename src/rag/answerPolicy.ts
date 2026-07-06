import type { RagAnswer, RagCitation, RagIntent, SpatialFact } from './types'

export const UNSUPPORTED_RAG_ANSWER =
  'No encontré soporte suficiente en los documentos y datos cargados.'

type AnswerPolicyInput = {
  draftAnswer: string
  citations: RagCitation[]
  spatialFacts: SpatialFact[]
  intent?: RagIntent
  warnings?: string[]
}

export function unsupportedAnswer(intent: RagIntent = 'unsupported'): RagAnswer {
  return {
    supported: false,
    answer: UNSUPPORTED_RAG_ANSWER,
    intent,
    citations: [],
    spatialFacts: [],
    warnings: [],
  }
}

export function enforceAnswerPolicy(input: AnswerPolicyInput): RagAnswer {
  if (input.citations.length === 0 || input.draftAnswer.trim() === '') {
    return unsupportedAnswer(input.intent)
  }

  return {
    supported: true,
    answer: input.draftAnswer.trim(),
    intent: input.intent ?? 'mixed',
    citations: input.citations,
    spatialFacts: input.spatialFacts,
    warnings: input.warnings ?? [],
  }
}
