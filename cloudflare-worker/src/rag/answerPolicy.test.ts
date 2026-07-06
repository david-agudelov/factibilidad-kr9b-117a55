import { describe, expect, test } from 'vitest'
import { FALLBACK_ANSWER, enforceCitedAnswer } from './answerPolicy'
import type { NormativeChatResponse } from '../types'

const citedResponse: NormativeChatResponse = {
  status: 'answered',
  answer: 'Respuesta preliminar citada.',
  spatialFactsUsed: [],
  citations: [
    {
      sourceId: 'decreto_670_2025_dot',
      documentTitle: 'Decreto 670 de 2025',
      sourceFamily: 'legal',
      section: '',
      article: '',
      page: '',
      officialUrl: 'https://www.alcaldiabogota.gov.co/',
      versionDate: '2025-12-27',
      confidence: 'medium',
    },
  ],
  warnings: [],
}

describe('answer policy', () => {
  test('blocks answered responses that admit insufficient support', () => {
    const response = enforceCitedAnswer({
      ...citedResponse,
      answer: `${FALLBACK_ANSWER} para determinar salidas de emergencia.`,
    })

    expect(response.status).toBe('insufficient_sources')
    expect(response.answer).toBe(FALLBACK_ANSWER)
    expect(response.citations).toEqual([])
  })

  test('preserves cited answers that do not admit insufficiency', () => {
    expect(enforceCitedAnswer(citedResponse)).toEqual(citedResponse)
  })
})
