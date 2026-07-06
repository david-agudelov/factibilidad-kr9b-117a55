import { describe, expect, test, vi } from 'vitest'
import { cloudflareProvider } from './cloudflareProvider'
import type { WorkerEnv } from '../../types'

describe('cloudflareProvider', () => {
  test('filters Vectorize retrieval by active ingest run id when configured', async () => {
    const aiRun = vi
      .fn()
      .mockResolvedValueOnce({ data: [[0.1, 0.2, 0.3]] })
      .mockResolvedValueOnce({ response: 'Respuesta citada preliminar.' })
    const query = vi.fn(async () => ({
      matches: [
        {
          id: 'chunk-1',
          score: 0.9,
          metadata: {
            sourceId: 'decreto_670_2025_dot',
            title: 'Decreto 670 de 2025',
            officialUrl: 'https://www.alcaldiabogota.gov.co/',
            versionDate: '2025-12-27',
            ingestRunId: 'ingest-20260705-clean',
            text: 'ArtÃ­culo 1. Texto normativo.',
          },
        },
      ],
    }))

    await cloudflareProvider.retrieve(
      {
        question: 'Â¿CuÃ¡l es la fuente legal primaria?',
        intent: 'general_normative_question',
        spatialFacts: [],
        appState: {},
      },
      {
        AI: { run: aiRun },
        VECTORIZE: { query, upsert: vi.fn() },
        RAG_ACTIVE_INGEST_RUN_ID: 'ingest-20260705-clean',
      } as WorkerEnv,
    )

    expect(query).toHaveBeenCalledWith([0.1, 0.2, 0.3], {
      topK: 5,
      returnMetadata: 'all',
      filter: { ingestRunId: 'ingest-20260705-clean' },
    })
  })
})
