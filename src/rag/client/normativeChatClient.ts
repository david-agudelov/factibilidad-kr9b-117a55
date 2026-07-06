import type { NormativeChatRequest, NormativeChatResponse } from '../types/chat'

const FALLBACK_ANSWER = 'No encontré soporte suficiente en los documentos y datos cargados.'
const DEFAULT_ENDPOINT = '/api/normative-chat'

type NormativeChatClientOptions = {
  endpoint?: string
}

function insufficientSources(warnings: string[] = []): NormativeChatResponse {
  return {
    status: 'insufficient_sources',
    answer: FALLBACK_ANSWER,
    spatialFactsUsed: [],
    citations: [],
    warnings,
  }
}

function normalizeResponse(value: unknown): NormativeChatResponse {
  const response = value as Partial<NormativeChatResponse>
  if (!response || typeof response.answer !== 'string') {
    return insufficientSources()
  }

  return {
    status: response.status ?? 'insufficient_sources',
    answer: response.answer,
    spatialFactsUsed: response.spatialFactsUsed ?? [],
    citations: response.citations ?? [],
    warnings: response.warnings ?? [],
  }
}

export async function askNormativeChat(
  request: NormativeChatRequest,
  options: NormativeChatClientOptions = {},
): Promise<NormativeChatResponse> {
  try {
    const response = await fetch(options.endpoint ?? DEFAULT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      return insufficientSources([`El servidor respondió con estado ${response.status}.`])
    }

    return normalizeResponse(await response.json())
  } catch {
    return insufficientSources(['No fue posible consultar el backend normativo.'])
  }
}
