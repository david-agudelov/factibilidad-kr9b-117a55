import type { WorkerEnv } from '../types'

const DEFAULT_ALLOWED_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])

export function getCorsHeaders(request: Request, env: WorkerEnv): Record<string, string> {
  const origin = request.headers.get('Origin') ?? ''
  const allowedOrigins = getAllowedOrigins(env)
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }

  if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin
  return headers
}

export function withCors(response: Response, request: Request, env: WorkerEnv): Response {
  const headers = new Headers(response.headers)
  Object.entries(getCorsHeaders(request, env)).forEach(([key, value]) => {
    if (value) headers.set(key, String(value))
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function makeOptionsResponse(request: Request, env: WorkerEnv): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  })
}

function getAllowedOrigins(env: WorkerEnv): Set<string> {
  const configured = env.RAG_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return configured && configured.length > 0 ? new Set(configured) : DEFAULT_ALLOWED_ORIGINS
}
