import type { NormativeChatResponse, SpatialFactUsed } from '../types'

export const FALLBACK_ANSWER = 'No encontré soporte suficiente en los documentos y datos cargados.'

export function makeUnsupportedResponse(
  status: NormativeChatResponse['status'] = 'insufficient_sources',
  warnings: string[] = [],
  spatialFactsUsed: SpatialFactUsed[] = [],
): NormativeChatResponse {
  return {
    status,
    answer: FALLBACK_ANSWER,
    spatialFactsUsed,
    citations: [],
    warnings,
  }
}

export function enforceCitedAnswer(response: NormativeChatResponse): NormativeChatResponse {
  if (response.status !== 'answered') return response
  if (
    response.citations.length === 0 ||
    response.answer.trim().length === 0 ||
    admitsInsufficientSupport(response.answer)
  ) {
    return makeUnsupportedResponse(
      'insufficient_sources',
      ['La respuesta fue bloqueada porque no incluyó citas verificables.'],
      response.spatialFactsUsed,
    )
  }

  return response
}

function admitsInsufficientSupport(answer: string): boolean {
  const normalized = normalizeForPolicy(answer)
  return (
    normalized.includes(
      normalizeForPolicy('No encontre soporte suficiente en los documentos y datos cargados'),
    ) ||
    normalized.includes('no hay suficiente informacion') ||
    normalized.includes('no se encontro soporte suficiente')
  )
}

function normalizeForPolicy(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
