import { describe, expect, it } from 'vitest'
import { handleRagQueryRequest } from './http'

describe('handleRagQueryRequest', () => {
  it('rejects invalid request bodies', async () => {
    const response = await handleRagQueryRequest({}, {
      answer: async () => {
        throw new Error('should not be called')
      },
    })

    expect(response.status).toBe(400)
    expect(response.body.answer).toBe('No encontré soporte suficiente en los documentos y datos cargados.')
  })

  it('delegates valid questions to the private RAG orchestrator', async () => {
    const response = await handleRagQueryRequest({ question: 'Que norma aplica?' }, {
      answer: async () => ({
        supported: false,
        answer: 'No encontré soporte suficiente en los documentos y datos cargados.',
        intent: 'unsupported',
        citations: [],
        spatialFacts: [],
        warnings: [],
      }),
    })

    expect(response.status).toBe(200)
    expect(response.body.supported).toBe(false)
  })
})
