import { makeOptionsResponse, withCors } from './http/cors'
import { routeRequest } from './http/routes'
import type { WorkerEnv } from './types'

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method === 'OPTIONS') return makeOptionsResponse(request, env)

    try {
      return withCors(await routeRequest(request, env), request, env)
    } catch (error) {
      return withCors(
        Response.json(
          {
            status: 'error',
            answer: 'No encontré soporte suficiente en los documentos y datos cargados.',
            spatialFactsUsed: [],
            citations: [],
            warnings: [error instanceof Error ? error.message : String(error)],
          },
          { status: 500 },
        ),
        request,
        env,
      )
    }
  },
}

export default worker
