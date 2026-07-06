import { afterEach, describe, expect, it, vi } from 'vitest'
import { askNormativeChat } from './normativeChatClient'

describe('askNormativeChat', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts the chat request only to the server-side normative endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'answered',
          answer: 'Respuesta con soporte documental.',
          spatialFactsUsed: [],
          citations: [
            {
              sourceId: 'decreto_670_2025_dot',
              documentTitle: 'Decreto 670 de 2025',
              sourceFamily: 'legal',
              section: 'Tratamientos urbanisticos',
              article: '1',
              page: '12',
              officialUrl: 'https://www.alcaldiabogota.gov.co/',
              versionDate: '2025-01-01',
              confidence: 'high',
            },
          ],
          warnings: [],
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await askNormativeChat({
      question: 'Que soporte tiene el aislamiento lateral?',
      appState: {
        floors: 5,
        floorHeight: 3,
        ecosMode: false,
        metrics: [],
        envelope: { totalHeight: 15 },
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/normative-chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const [, init] = fetchMock.mock.calls[0]
    const body = String(init.body)
    expect(body).toContain('Que soporte tiene el aislamiento lateral?')
    expect(body).not.toContain('OPENAI')
    expect(body).not.toContain('API_KEY')
    expect(body).not.toContain('VECTOR_STORE')
  })

  it('returns insufficient_sources when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const response = await askNormativeChat({
      question: 'Que norma aplica?',
      appState: {},
    })

    expect(response.status).toBe('insufficient_sources')
    expect(response.answer).toBe('No encontré soporte suficiente en los documentos y datos cargados.')
    expect(response.citations).toEqual([])
  })
})
