import type { MetricItem, NormativeEnvelope } from '../../model/types'
import type { NormativeCitation } from './citations'
import type { SpatialFactUsed } from './spatial'

export type NormativeChatStatus =
  | 'answered'
  | 'insufficient_sources'
  | 'out_of_scope'
  | 'error'

export type NormativeChatAppState = {
  floors?: number | null
  floorHeight?: number | null
  ecosMode?: boolean | null
  metrics?: MetricItem[] | null
  envelope?: Partial<NormativeEnvelope> | null
  validationWarnings?: string[] | null
}

export type NormativeChatRequest = {
  question: string
  parcelContext?: Record<string, unknown>
  appState: NormativeChatAppState
}

export type NormativeChatResponse = {
  status: NormativeChatStatus
  answer: string
  spatialFactsUsed: SpatialFactUsed[]
  citations: NormativeCitation[]
  warnings: string[]
}

export type NormativeChatMessage =
  | {
      id: string
      role: 'user'
      content: string
    }
  | {
      id: string
      role: 'assistant'
      content: string
      status: NormativeChatStatus
      citations: NormativeCitation[]
      spatialFactsUsed: SpatialFactUsed[]
      warnings: string[]
    }
