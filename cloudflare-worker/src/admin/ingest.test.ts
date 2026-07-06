import { describe, expect, test, vi } from 'vitest'
import { handleIngestRequest } from './ingest'
import type { WorkerEnv } from '../types'

function makeEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    RAG_PROVIDER: 'cloudflare',
    RAG_ENV: 'local',
    RAG_ALLOWED_ORIGINS: 'http://localhost:5173',
    RAG_GENERATION_MODEL: '@cf/meta/llama-3.1-8b-instruct-fast',
    RAG_EMBEDDING_MODEL: '@cf/baai/bge-m3',
    ADMIN_INGEST_TOKEN: 'dev-local-token',
    ...overrides,
  }
}

describe('handleIngestRequest', () => {
  test('rejects requests with an invalid admin token', async () => {
    const response = await handleIngestRequest(
      new Request('http://worker.test/admin/ingest', {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-token' },
        body: JSON.stringify({ chunks: [] }),
      }),
      makeEnv(),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ status: 'unauthorized' })
  })

  test('embeds chunks with Workers AI and upserts them into Vectorize', async () => {
    const aiRun = vi.fn(async () => ({ data: [[0.1, 0.2, 0.3]] }))
    const upsert = vi.fn(async () => ({ count: 1 }))
    const response = await handleIngestRequest(
      new Request('http://worker.test/admin/ingest', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dev-local-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunks: [
            {
              id: 'chunk-1',
              text: 'Norma común urbanística con cita.',
              metadata: {
                sourceId: 'anexo_05_manual_normas_comunes_2024',
                title: 'Anexo 5',
                officialUrl: 'https://www.sdp.gov.co/',
              },
            },
          ],
        }),
      }),
      makeEnv({
        AI: { run: aiRun },
        VECTORIZE: { query: vi.fn(), upsert },
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ingested', inserted: 1 })
    expect(aiRun).toHaveBeenCalledWith('@cf/baai/bge-m3', {
      text: ['Norma común urbanística con cita.'],
    })
    expect(upsert).toHaveBeenCalledWith([
      {
        id: 'chunk-1',
        values: [0.1, 0.2, 0.3],
        metadata: {
          sourceId: 'anexo_05_manual_normas_comunes_2024',
          title: 'Anexo 5',
          officialUrl: 'https://www.sdp.gov.co/',
          text: 'Norma común urbanística con cita.',
        },
      },
    ])
  })
})
