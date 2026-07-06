import type {
  NormativeCitation,
  NormativeIntent,
  SpatialFactUsed,
  WorkerEnv,
} from '../../types'

export type RetrievalInput = {
  question: string
  intent: NormativeIntent
  spatialFacts: SpatialFactUsed[]
  appState: Record<string, unknown>
}

export type RetrievalOutput = {
  answer: string
  citations: NormativeCitation[]
  warnings: string[]
}

export type RagProvider = {
  retrieve: (input: RetrievalInput, env: WorkerEnv) => Promise<RetrievalOutput>
}
