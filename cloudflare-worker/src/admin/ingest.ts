import { extractEmbeddingVectors } from '../rag/providers/cloudflareProvider'
import type { VectorizeVector, WorkerEnv } from '../types'

type IngestChunk = {
  id: string
  text: string
  metadata: Record<string, unknown>
}

type IngestBody = {
  chunks: IngestChunk[]
}

export async function handleIngestRequest(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ status: 'method_not_allowed' }, { status: 405 })
  }

  if (!isAuthorized(request, env)) {
    return Response.json({ status: 'unauthorized' }, { status: 401 })
  }

  if (!env.AI || !env.VECTORIZE) {
    return Response.json(
      { status: 'error', error: 'Cloudflare AI y Vectorize deben estar configurados.' },
      { status: 503 },
    )
  }

  const body = await readJson(request)
  if (!isIngestBody(body)) {
    return Response.json({ status: 'invalid_request' }, { status: 400 })
  }

  if (body.chunks.length === 0) {
    return Response.json({ status: 'ingested', inserted: 0 })
  }

  const texts = body.chunks.map((chunk) => chunk.text)
  const embeddings = extractEmbeddingVectors(
    await env.AI.run(env.RAG_EMBEDDING_MODEL ?? '@cf/baai/bge-m3', {
      text: texts,
    }),
  )

  if (embeddings.length !== body.chunks.length) {
    return Response.json(
      { status: 'error', error: 'Workers AI no devolvió un embedding por chunk.' },
      { status: 502 },
    )
  }

  const vectors: VectorizeVector[] = body.chunks.map((chunk, index) => ({
    id: chunk.id,
    values: embeddings[index],
    metadata: {
      ...chunk.metadata,
      text: chunk.text,
    },
  }))

  const result = await env.VECTORIZE.upsert(vectors)
  const inserted = extractInsertedCount(result, vectors.length)
  return Response.json({ status: 'ingested', inserted })
}

function isAuthorized(request: Request, env: WorkerEnv): boolean {
  const expected = env.ADMIN_INGEST_TOKEN
  if (!expected) return false
  return request.headers.get('Authorization') === `Bearer ${expected}`
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

function isIngestBody(value: unknown): value is IngestBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'chunks' in value &&
    Array.isArray(value.chunks) &&
    value.chunks.every(isIngestChunk)
  )
}

function isIngestChunk(value: unknown): value is IngestChunk {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'text' in value &&
    typeof value.text === 'string' &&
    'metadata' in value &&
    typeof value.metadata === 'object' &&
    value.metadata !== null
  )
}

function extractInsertedCount(result: unknown, fallback: number): number {
  if (typeof result === 'object' && result !== null && 'count' in result && typeof result.count === 'number') {
    return result.count
  }
  return fallback
}
