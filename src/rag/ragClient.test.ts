import { afterEach, describe, expect, it, vi } from 'vitest'
import { askNormativeRag } from './ragClient'

describe('askNormativeRag', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts only the query payload to the configured backend endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          supported: false,
          answer: 'No encontré soporte suficiente en los documentos y datos cargados.',
          intent: 'unsupported',
          citations: [],
          spatialFacts: [],
          warnings: [],
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await askNormativeRag(
      { question: 'Que norma aplica?', caseId: 'KR9B_117A55' },
      { endpoint: '/api/rag/query' },
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/rag/query',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Que norma aplica?', caseId: 'KR9B_117A55' }),
      }),
    )
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('OPENAI_API_KEY')
  })

  it('returns the required fallback when the backend request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const answer = await askNormativeRag(
      { question: 'Que norma aplica?', caseId: 'KR9B_117A55' },
      { endpoint: '/api/rag/query' },
    )

    expect(answer.supported).toBe(false)
    expect(answer.answer).toBe('No encontré soporte suficiente en los documentos y datos cargados.')
  })
})
