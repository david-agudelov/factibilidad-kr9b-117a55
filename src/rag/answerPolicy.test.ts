import { describe, expect, it } from 'vitest'
import { enforceAnswerPolicy, unsupportedAnswer } from './answerPolicy'
import type { RagCitation } from './types'

const citation: RagCitation = {
  sourceId: 'decreto_670_2025_dot',
  title: 'Decreto 670 de 2025',
  url: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
  sourceFamily: 'legal_primary',
  excerpt: 'Fuente legal primaria declarada en manifest.',
}

describe('RAG answer policy', () => {
  it('returns the exact fallback when citations are missing', () => {
    const answer = enforceAnswerPolicy({
      draftAnswer: 'El predio tiene una condicion normativa.',
      citations: [],
      spatialFacts: [],
    })

    expect(answer.supported).toBe(false)
    expect(answer.answer).toBe('No encontré soporte suficiente en los documentos y datos cargados.')
    expect(answer.citations).toEqual([])
  })

  it('allows a cited answer and preserves citations', () => {
    const answer = enforceAnswerPolicy({
      draftAnswer: 'El Decreto 670 de 2025 es la fuente legal primaria declarada.',
      citations: [citation],
      spatialFacts: [],
    })

    expect(answer.supported).toBe(true)
    expect(answer.answer).toContain('Decreto 670 de 2025')
    expect(answer.citations).toEqual([citation])
  })

  it('creates the same unsupported response from the helper', () => {
    expect(unsupportedAnswer().answer).toBe(
      'No encontré soporte suficiente en los documentos y datos cargados.',
    )
  })
})
