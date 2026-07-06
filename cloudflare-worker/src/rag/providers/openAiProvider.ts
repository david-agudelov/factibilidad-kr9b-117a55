import { SOURCES } from '../../data/sources.generated'
import { toCitation, uniqueCitations } from '../citations'
import type { RagProvider, RetrievalInput, RetrievalOutput } from './types'
import type { NormativeCitation, WorkerEnv } from '../../types'

export const openAiProvider: RagProvider = {
  async retrieve(input: RetrievalInput, env: WorkerEnv): Promise<RetrievalOutput> {
    if (!env.OPENAI_API_KEY || !env.OPENAI_VECTOR_STORE_ID) {
      throw new Error('OPENAI_API_KEY y OPENAI_VECTOR_STORE_ID deben configurarse como secretos server-side.')
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.RAG_MODEL ?? 'gpt-4.1-mini',
        instructions: [
          'Responde en español con citas verificables.',
          'No inventes artículos, restricciones ni alturas.',
          'Si no hay soporte suficiente, declara insuficiencia.',
          `Facts espaciales disponibles: ${JSON.stringify(input.spatialFacts)}`,
        ].join('\n'),
        input: JSON.stringify({
          question: input.question,
          intent: input.intent,
          appState: input.appState,
          allowedSourceIds: SOURCES.filter(
            (source) =>
              source.indexText &&
              source.ragRole !== 'provenance' &&
              !['derogado', 'compilado'].includes(source.legalStatus),
          ).map((source) => source.id),
        }),
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [env.OPENAI_VECTOR_STORE_ID],
          },
        ],
        include: ['file_search_call.results'],
      }),
    })

    if (!response.ok) throw new Error(`OpenAI File Search respondió HTTP ${response.status}.`)

    const payload = await response.json()
    const answer = extractText(payload)
    const citations = uniqueCitations(
      extractSourceIds(payload)
        .map((sourceId) => toCitation(sourceId))
        .filter((citation): citation is NormativeCitation => Boolean(citation)),
    )

    return {
      answer,
      citations,
      warnings: [
        'Respuesta preliminar; no reemplaza Curaduría, Aerocivil, topografía ni fuente oficial.',
      ],
    }
  },
}

function extractText(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'output_text' in payload) {
    const outputText = payload.output_text
    if (typeof outputText === 'string') return outputText
  }

  return ''
}

function extractSourceIds(payload: unknown): string[] {
  const text = JSON.stringify(payload)
  return Array.from(new Set(Array.from(text.matchAll(/sourceId["':\s]+([a-z0-9_]+)/gi), (match) => match[1])))
}
