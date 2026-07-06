import { citationFromMetadata, uniqueCitations } from '../citations'
import { FALLBACK_ANSWER } from '../answerPolicy'
import type { RagProvider, RetrievalInput, RetrievalOutput } from './types'
import type { NormativeCitation, VectorizeMatch, WorkerEnv } from '../../types'

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
const DEFAULT_GENERATION_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'

export const cloudflareProvider: RagProvider = {
  async retrieve(input: RetrievalInput, env: WorkerEnv): Promise<RetrievalOutput> {
    if (!env.AI || !env.VECTORIZE) {
      return {
        answer: '',
        citations: [],
        warnings: ['Cloudflare AI o Vectorize no está configurado para retrieval documental.'],
      }
    }

    const vector = await embedQuestion(input.question, env)
    const activeIngestRunId = env.RAG_ACTIVE_INGEST_RUN_ID?.trim()
    const searchResults = await env.VECTORIZE.query(vector, {
      topK: 5,
      returnMetadata: 'all',
      ...(activeIngestRunId ? { filter: { ingestRunId: activeIngestRunId } } : {}),
    })
    const matches = searchResults.matches ?? []
    const citations = uniqueCitations(
      matches
        .map((match) => citationFromMetadata(match.metadata ?? {}))
        .filter((citation): citation is NormativeCitation => Boolean(citation)),
    )

    if (matches.length === 0 || citations.length === 0) {
      return {
        answer: '',
        citations: [],
        warnings: ['Vectorize no devolvió chunks con citas verificables.'],
      }
    }

    const answer = await generateAnswer(input, matches, env)
    return {
      answer,
      citations,
      warnings: [
        'Respuesta preliminar; no reemplaza Curaduría, Aerocivil, topografía ni fuente oficial.',
      ],
    }
  },
}

async function embedQuestion(question: string, env: WorkerEnv): Promise<number[]> {
  const payload = await env.AI?.run(env.RAG_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL, {
    text: [question],
  })
  const vectors = extractEmbeddingVectors(payload)
  if (vectors.length === 0) throw new Error('Workers AI no devolvió embeddings para la consulta.')
  return vectors[0]
}

async function generateAnswer(
  input: RetrievalInput,
  matches: VectorizeMatch[],
  env: WorkerEnv,
): Promise<string> {
  const contexts = matches.map((match, index) => ({
    index: index + 1,
    score: match.score ?? null,
    metadata: match.metadata ?? {},
    text: typeof match.metadata?.text === 'string' ? match.metadata.text : '',
  }))
  const prompt = [
    'Responde en español.',
    'Usa únicamente los contextos, facts espaciales y metadata entregados.',
    `Si no hay soporte suficiente, responde exactamente: ${FALLBACK_ANSWER}`,
    'Incluye interpretación preliminar, nunca concepto legal definitivo.',
    `Pregunta: ${input.question}`,
    `Intención: ${input.intent}`,
    `Facts espaciales: ${JSON.stringify(input.spatialFacts)}`,
    `Estado app: ${JSON.stringify(input.appState)}`,
    `Contextos: ${JSON.stringify(contexts)}`,
  ].join('\n')
  const payload = await env.AI?.run(env.RAG_GENERATION_MODEL ?? DEFAULT_GENERATION_MODEL, {
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente RAG normativo-predial estricto con citas.',
      },
      { role: 'user', content: prompt },
    ],
  })
  const answer = extractGeneratedText(payload).trim()
  return answer && answer !== FALLBACK_ANSWER ? answer : ''
}

export function extractEmbeddingVectors(payload: unknown): number[][] {
  if (typeof payload !== 'object' || payload === null) return []
  const data = 'data' in payload ? payload.data : undefined
  if (!Array.isArray(data)) return []
  return data.filter(
    (item): item is number[] => Array.isArray(item) && item.every((value) => typeof value === 'number'),
  )
}

function extractGeneratedText(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null) {
    if ('response' in payload && typeof payload.response === 'string') return payload.response
    if ('text' in payload && typeof payload.text === 'string') return payload.text
    if ('result' in payload && typeof payload.result === 'string') return payload.result
  }
  return ''
}
