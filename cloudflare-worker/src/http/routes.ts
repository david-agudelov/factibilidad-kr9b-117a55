import { handleIngestRequest } from '../admin/ingest'
import { makeUnsupportedResponse, enforceCitedAnswer } from '../rag/answerPolicy'
import { classifyNormativeIntent, detectSecretRequest, normalize } from '../rag/intent'
import { cloudflareProvider } from '../rag/providers/cloudflareProvider'
import { openAiProvider } from '../rag/providers/openAiProvider'
import { answerSourceTraceFromManifest } from '../rag/sourceTrace'
import { answerSpatialFactFromOverlays } from '../rag/spatialAnswer'
import { handleSpatialContext } from '../rag/spatialContext'
import type { NormativeChatRequest, NormativeChatResponse, SpatialFactUsed, WorkerEnv } from '../types'

export async function routeRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === 'GET' && url.pathname === '/health') {
    return Response.json({
      ok: true,
      provider: getProviderName(env),
      environment: env.RAG_ENV ?? 'local',
    })
  }

  if (request.method === 'POST' && url.pathname === '/api/spatial-context') {
    return Response.json(handleSpatialContext(await readJson(request)))
  }

  if (request.method === 'POST' && url.pathname === '/api/normative-chat') {
    return Response.json(await handleNormativeChat(await readJson(request), env))
  }

  if (request.method === 'POST' && url.pathname === '/admin/ingest') {
    return handleIngestRequest(request, env)
  }

  return Response.json({ status: 'not_found' }, { status: 404 })
}

export async function handleNormativeChat(
  body: unknown,
  env: WorkerEnv,
): Promise<NormativeChatResponse> {
  if (!isNormativeChatRequest(body)) {
    return makeUnsupportedResponse('error', ['Solicitud inválida para chat normativo.'])
  }

  const secretWarning = detectSecretRequest(body.question)
  if (secretWarning) return makeUnsupportedResponse('out_of_scope', [secretWarning])

  const intent = classifyNormativeIntent(body.question)
  if (intent === 'out_of_scope') return makeUnsupportedResponse('out_of_scope')

  const spatialFactsResult = resolveSpatialFactsIfNeeded(body, intent)
  if (spatialFactsResult.status === 'blocked') {
    return makeUnsupportedResponse('insufficient_sources', spatialFactsResult.warnings)
  }

  if (intent === 'source_trace_question') {
    const sourceTraceResponse = answerSourceTraceFromManifest(body.question, spatialFactsResult.facts)
    if (sourceTraceResponse) {
      return enforceCitedAnswer({
        ...sourceTraceResponse,
        warnings: [...spatialFactsResult.warnings, ...sourceTraceResponse.warnings],
      })
    }
  }

  if (intent === 'parcel_specific_question' || intent === 'street_edge_question') {
    const spatialAnswer = answerSpatialFactFromOverlays(body.question, spatialFactsResult.facts)
    if (spatialAnswer) {
      return enforceCitedAnswer({
        ...spatialAnswer,
        warnings: [...spatialFactsResult.warnings, ...spatialAnswer.warnings],
      })
    }
  }

  try {
    const provider = getProviderName(env) === 'openai' ? openAiProvider : cloudflareProvider
    const retrieval = await provider.retrieve(
      {
        question: body.question,
        intent,
        spatialFacts: spatialFactsResult.facts,
        appState: body.appState ?? {},
      },
      env,
    )
    const response = enforceCitedAnswer({
      status: retrieval.answer.trim() && retrieval.citations.length > 0 ? 'answered' : 'insufficient_sources',
      answer: retrieval.answer.trim() || 'No encontré soporte suficiente en los documentos y datos cargados.',
      spatialFactsUsed: spatialFactsResult.facts,
      citations: retrieval.citations,
      warnings: [...spatialFactsResult.warnings, ...retrieval.warnings],
    })

    return response
  } catch (error) {
    return makeUnsupportedResponse(
      'error',
      [error instanceof Error ? error.message : String(error)],
      spatialFactsResult.facts,
    )
  }
}

function resolveSpatialFactsIfNeeded(
  request: NormativeChatRequest,
  intent: string,
): { status: 'ok'; facts: SpatialFactUsed[]; warnings: string[] } | { status: 'blocked'; warnings: string[] } {
  if (intent !== 'parcel_specific_question' && intent !== 'street_edge_question') {
    return { status: 'ok', facts: [], warnings: [] }
  }

  const parcelContext = request.parcelContext ?? {}
  const nested = parcelContext.parcelInput
  const context = handleSpatialContext({
    query: request.question,
    parcelInput: isParcelInput(nested)
      ? nested
      : {
          address: stringValue(parcelContext.address),
          chip: stringValue(parcelContext.chip),
          lotId: stringValue(parcelContext.lotId),
          geometry: 'geometry' in parcelContext ? parcelContext.geometry : null,
        },
  })

  if (context.status !== 'resolved' || context.spatialFacts.length === 0) {
    return {
      status: 'blocked',
      warnings:
        context.warnings.length > 0
          ? context.warnings
          : ['La pregunta requiere facts espaciales, pero el predio no fue resuelto.'],
    }
  }

  const missingComputedLayers = requiredComputedLayersForQuestion(request.question).filter(
    (layerId) => !hasComputedLayer(context.spatialFacts, layerId),
  )
  if (missingComputedLayers.length > 0) {
    return {
      status: 'blocked',
      warnings: [
        `La pregunta requiere overlays espaciales no calculados: ${missingComputedLayers.join(', ')}.`,
      ],
    }
  }

  return { status: 'ok', facts: context.spatialFacts, warnings: context.warnings }
}

function requiredComputedLayersForQuestion(question: string): string[] {
  const normalizedQuestion = normalize(question)
  const required = new Set<string>()

  if (normalizedQuestion.includes('tratamiento')) required.add('tratamiento_urbanistico_pot')
  if (normalizedQuestion.includes('area de actividad')) required.add('area_actividad_pot')
  if (normalizedQuestion.includes('antejardin')) required.add('antejardin_pot')
  if (normalizedQuestion.includes('plan parcial')) required.add('plan_parcial_pot')
  if (normalizedQuestion.includes('reserva')) required.add('suelo_reserva_pot')
  if (normalizedQuestion.includes('hidric')) required.add('eep_sistema_hidrico_pot')
  if (normalizedQuestion.includes('riesgo')) required.add('suelo_proteccion_riesgo_pot')
  if (normalizedQuestion.includes('bic') || normalizedQuestion.includes('patrimonio')) {
    required.add('bic_zona_influencia_pot')
    required.add('bic_bien_interes_cultural_pot')
  }
  if (normalizedQuestion.includes('aeropu') || normalizedQuestion.includes('elevacion')) {
    required.add('area_elevacion_maxima_pot')
    required.add('aeropuerto_influencia_indirecta_pot')
  }
  if (normalizedQuestion.includes('vial') || normalizedQuestion.includes('borde')) {
    required.add('red_infraestructura_vial_pot')
  }
  if (normalizedQuestion.includes('anden')) required.add('idu_anden_bogota')
  if (normalizedQuestion.includes('calzada')) required.add('idu_calzada_bogota')
  if (normalizedQuestion.includes('separador')) required.add('idu_separador_bogota')
  if (normalizedQuestion.includes('cicloruta')) required.add('idu_cicloruta_bogota')
  if (normalizedQuestion.includes('puente')) required.add('idu_puente_bogota')

  return [...required]
}

function hasComputedLayer(facts: SpatialFactUsed[], layerId: string): boolean {
  return facts.some((fact) => {
    if (fact.layerId !== layerId) return false
    const method = typeof fact.attributes.method === 'string' ? fact.attributes.method : ''
    return method !== 'not_computed'
  })
}

function isNormativeChatRequest(body: unknown): body is NormativeChatRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    'question' in body &&
    typeof body.question === 'string' &&
    body.question.trim().length > 0
  )
}

function isParcelInput(value: unknown): value is {
  address: string
  chip: string
  lotId: string
  geometry: unknown
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    typeof value.address === 'string' &&
    'chip' in value &&
    typeof value.chip === 'string' &&
    'lotId' in value &&
    typeof value.lotId === 'string'
  )
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getProviderName(env: WorkerEnv): 'cloudflare' | 'openai' {
  return env.RAG_PROVIDER === 'openai' ? 'openai' : 'cloudflare'
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}
