import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { NORMATIVE_RAG_SYSTEM_PROMPT } from '../src/rag/prompts/systemPrompt'
import {
  handleSpatialContextRequest,
  type SpatialContextFact,
  type SpatialContextRequest,
  type SpatialContextResponse,
} from './spatial-context'

type Confidence = 'high' | 'medium' | 'low'
type NormativeChatStatus = 'answered' | 'insufficient_sources' | 'out_of_scope' | 'error'
type NormativeIntent =
  | 'general_normative_question'
  | 'parcel_specific_question'
  | 'source_trace_question'
  | 'building_code_question'
  | 'street_edge_question'
  | 'out_of_scope'

export type NormativeCitation = {
  sourceId: string
  documentTitle: string
  sourceFamily: string
  section: string
  article: string
  page: string
  officialUrl: string
  versionDate: string
  confidence: Confidence
}

export type NormativeChatRequest = {
  question: string
  parcelContext: Record<string, unknown>
  appState: {
    floors: number | null
    floorHeight: number | null
    ecosMode: boolean | null
    metrics: unknown
    envelope: unknown
  }
}

export type NormativeChatResponse = {
  status: NormativeChatStatus
  answer: string
  spatialFactsUsed: SpatialContextFact[]
  citations: NormativeCitation[]
  warnings: string[]
}

export type RetrievalResult = {
  answer: string
  citations: NormativeCitation[]
}

export type DocumentRetriever = (input: {
  question: string
  intent: NormativeIntent
  sourceIds: string[]
  spatialFacts: SpatialContextFact[]
  appState: NormativeChatRequest['appState']
}) => Promise<RetrievalResult>

export type NormativeChatDependencies = {
  resolveSpatialContext?: (request: SpatialContextRequest) => Promise<SpatialContextResponse>
  retrieveDocuments?: DocumentRetriever
  env?: Record<string, string | undefined>
  manifestPath?: string
  workspaceRoot?: string
  chunkedSourceIds?: Set<string>
}

type ManifestSource = {
  id: string
  title: string
  authority: string
  officialUrl: string
  sourceFamily: string
  legalStatus: string
  versionDate: string
  ragRole: string
  indexText: boolean
}

type Manifest = {
  sources: ManifestSource[]
}

const FALLBACK = 'No encontré soporte suficiente en los documentos y datos cargados.'
const DEFAULT_MANIFEST_PATH = 'rag/sources/sources.manifest.json'

export async function handleNormativeChatRequest(
  body: unknown,
  dependencies: NormativeChatDependencies = {},
): Promise<NormativeChatResponse> {
  if (!isNormativeChatRequest(body)) {
    return makeResponse('error', FALLBACK, [], [], ['Solicitud inválida para chat normativo.'])
  }

  const secretWarning = detectSecretRequest(body.question)
  if (secretWarning) {
    return makeResponse('out_of_scope', FALLBACK, [], [], [secretWarning])
  }

  const intent = classifyNormativeIntent(body.question)
  if (intent === 'out_of_scope') return makeResponse('out_of_scope', FALLBACK, [], [], [])

  const env = dependencies.env ?? process.env
  const workspaceRoot = dependencies.workspaceRoot ?? process.cwd()
  const manifest = readManifest(
    resolve(
      workspaceRoot,
      env.RAG_ALLOWED_SOURCE_MANIFEST_PATH ?? dependencies.manifestPath ?? DEFAULT_MANIFEST_PATH,
    ),
  )
  const chunkedSourceIds =
    dependencies.chunkedSourceIds ??
    readChunkedSourceIds(resolve(workspaceRoot, env.RAG_CHUNKS_DIR ?? 'rag/processed/chunks'))
  const spatialFacts = await getSpatialFactsForQuestion(body, intent, dependencies)
  if (spatialFacts.status !== 'ok') {
    return makeResponse('insufficient_sources', FALLBACK, [], [], spatialFacts.warnings)
  }

  const retriever = dependencies.retrieveDocuments ?? createOpenAiFileSearchRetriever(env, manifest)
  if (!retriever) {
    return makeResponse('error', FALLBACK, [], [], [
      'OPENAI_VECTOR_STORE_ID no está configurado en el servidor.',
    ])
  }

  try {
    const result = await retriever({
      question: body.question,
      intent,
      sourceIds: shortlistSourceIds(manifest.sources, intent, spatialFacts.facts, chunkedSourceIds),
      spatialFacts: spatialFacts.facts,
      appState: body.appState,
    })

    if (!result.answer.trim() || result.citations.length === 0) {
      return makeResponse('insufficient_sources', FALLBACK, spatialFacts.facts, [], [
        'La respuesta fue bloqueada porque no incluyó citas verificables.',
      ])
    }

    return makeResponse('answered', result.answer.trim(), spatialFacts.facts, result.citations, [
      ...spatialFacts.warnings,
      'Respuesta preliminar; no reemplaza Curaduría, Aerocivil, topografía ni fuente oficial.',
    ])
  } catch (error) {
    return makeResponse('error', FALLBACK, spatialFacts.facts, [], [
      error instanceof Error ? error.message : String(error),
    ])
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as unknown
  const response = await handleNormativeChatRequest(body)
  return Response.json(response, {
    status: response.status === 'error' ? 500 : 200,
  })
}

function classifyNormativeIntent(question: string): NormativeIntent {
  const normalized = normalize(question)
  const sourceTerms = ['fuente', 'cita', 'manifest', 'trazabilidad', 'documento', 'soporte']
  const parcelTerms = [
    'predio',
    'chip',
    'lote',
    'direccion',
    'tratamiento',
    'area de actividad',
    'antejardin',
    'riesgo',
    'reserva',
    'bic',
    'aeropuerto',
    'kr9b',
    '117a',
  ]
  const streetEdgeTerms = [
    'anden',
    'andene',
    'calzada',
    'separador',
    'cicloruta',
    'puente',
    'borde vial',
    'frente vial',
    'perfil vial',
    'idu',
  ]
  const buildingCodeTerms = [
    'escalera',
    'escaleras',
    'evacuacion',
    'salida',
    'salidas',
    'incendio',
    'proteccion contra incendio',
    'vacio',
    'vacios',
    'ventana',
    'ventanas',
    'ventilacion',
    'iluminacion',
    'ocupacion',
    'ocupantes',
    'nsr',
    'nsr 10',
    'titulo j',
    'titulo k',
  ]
  const normativeTerms = [
    'norma',
    'decreto',
    'edificabilidad',
    'altura',
    'aislamiento',
    'retroceso',
    'ecos',
    'uso',
    'urbanistico',
    'pot',
    'manual',
  ]

  if (streetEdgeTerms.some((term) => normalized.includes(term))) return 'street_edge_question'
  if (buildingCodeTerms.some((term) => normalized.includes(term))) return 'building_code_question'
  if (sourceTerms.some((term) => normalized.includes(term))) return 'source_trace_question'
  if (parcelTerms.some((term) => normalized.includes(term))) return 'parcel_specific_question'
  if (normativeTerms.some((term) => normalized.includes(term))) return 'general_normative_question'
  return 'out_of_scope'
}

async function getSpatialFactsForQuestion(
  request: NormativeChatRequest,
  intent: NormativeIntent,
  dependencies: NormativeChatDependencies,
): Promise<{ status: 'ok'; facts: SpatialContextFact[]; warnings: string[] } | { status: 'blocked'; warnings: string[] }> {
  if (intent !== 'parcel_specific_question' && intent !== 'street_edge_question') {
    return { status: 'ok', facts: [], warnings: [] }
  }

  const parcelInput = getParcelInput(request)
  const resolver = dependencies.resolveSpatialContext ?? handleSpatialContextRequest
  const spatialContext = await resolver({
    query: request.question,
    parcelInput,
  })

  if (spatialContext.status !== 'resolved' || spatialContext.spatialFacts.length === 0) {
    return {
      status: 'blocked',
      warnings:
        spatialContext.warnings.length > 0
          ? spatialContext.warnings
          : ['La pregunta requiere facts espaciales, pero el predio no fue resuelto.'],
    }
  }

  return {
    status: 'ok',
    facts: spatialContext.spatialFacts,
    warnings: spatialContext.warnings,
  }
}

function getParcelInput(request: NormativeChatRequest): SpatialContextRequest['parcelInput'] {
  const parcelContext = request.parcelContext
  const nested = parcelContext.parcelInput
  if (isParcelInput(nested)) return nested

  return {
    address: stringValue(parcelContext.address),
    chip: stringValue(parcelContext.chip),
    lotId: stringValue(parcelContext.lotId),
    geometry: 'geometry' in parcelContext ? parcelContext.geometry : null,
  }
}

function createOpenAiFileSearchRetriever(
  env: Record<string, string | undefined>,
  manifest: Manifest,
): DocumentRetriever | undefined {
  const apiKey = env.OPENAI_API_KEY
  const vectorStoreId = env.OPENAI_VECTOR_STORE_ID
  if (!apiKey || !vectorStoreId) return undefined

  return async (input) => {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.RAG_MODEL ?? 'gpt-4.1-mini',
        instructions: buildInstructions(input.spatialFacts),
        input: buildUserInput(input),
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [vectorStoreId],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI File Search respondió HTTP ${response.status}.`)
    }

    return parseOpenAiResponse(await response.json(), manifest)
  }
}

function buildInstructions(spatialFacts: SpatialContextFact[]): string {
  const spatialInstruction =
    spatialFacts.length > 0
      ? `Facts espaciales disponibles:\n${JSON.stringify(spatialFacts, null, 2)}`
      : 'No hay facts espaciales disponibles para esta pregunta.'
  return `${NORMATIVE_RAG_SYSTEM_PROMPT}\n\n${spatialInstruction}`
}

function buildUserInput(input: {
  question: string
  intent: NormativeIntent
  sourceIds: string[]
  appState: NormativeChatRequest['appState']
}): string {
  return JSON.stringify({
    question: input.question,
    intent: input.intent,
    allowedSourceIds: input.sourceIds,
    appState: input.appState,
    outputContract:
      'Devuelve una respuesta breve en español con citas verificables; no respondas si no hay soporte.',
  })
}

function parseOpenAiResponse(payload: unknown, manifest: Manifest): RetrievalResult {
  const answer = extractText(payload)
  const citationSourceIds = extractSourceIds(payload)
  const citations = citationSourceIds
    .map((sourceId) => manifest.sources.find((source) => source.id === sourceId))
    .filter((source): source is ManifestSource => Boolean(source))
    .map<NormativeCitation>((source) => ({
      sourceId: source.id,
      documentTitle: source.title,
      sourceFamily: source.sourceFamily,
      section: '',
      article: '',
      page: '',
      officialUrl: source.officialUrl,
      versionDate: source.versionDate,
      confidence: 'medium',
    }))

  return { answer, citations }
}

function extractText(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'output_text' in payload) {
    const outputText = payload.output_text
    if (typeof outputText === 'string') return outputText
  }

  return JSON.stringify(payload)
}

function extractSourceIds(payload: unknown): string[] {
  const text = JSON.stringify(payload)
  return Array.from(new Set(Array.from(text.matchAll(/sourceId["':\s]+([a-z0-9_]+)/gi), (match) => match[1])))
}

function shortlistSourceIds(
  sources: ManifestSource[],
  intent: NormativeIntent,
  spatialFacts: SpatialContextFact[],
  chunkedSourceIds?: Set<string>,
): string[] {
  const base = sources.filter(
    (source) =>
      source.indexText &&
      !['derogado', 'compilado'].includes(source.legalStatus) &&
      source.ragRole !== 'provenance' &&
      (!chunkedSourceIds || chunkedSourceIds.has(source.id)),
  )
  if (intent === 'building_code_question') {
    const buildingCodeSourceIds = new Set([
      'nsr10_decreto_926_2010',
      'nsr10_titulo_j_proteccion_incendios',
    ])
    return base
      .filter((source) => buildingCodeSourceIds.has(source.id))
      .map((source) => source.id)
  }

  if (intent === 'street_edge_question') {
    const streetEdgeSourceIds = new Set([
      'decreto_670_2025_dot',
      'anexo_05_manual_normas_comunes_2024',
      'manual_espacio_publico_2023',
      'cartilla_mobiliario_urbano',
      'cartografia_decreto_componente_urbano',
    ])
    return base
      .filter((source) => streetEdgeSourceIds.has(source.id))
      .map((source) => source.id)
  }

  if (intent !== 'parcel_specific_question') return base.map((source) => source.id)

  const spatialLayerIds = new Set(spatialFacts.map((fact) => fact.layerId))
  const preferredFamilies = new Set(['legal', 'manual', 'annex', 'map', 'project_doc'])
  return base
    .filter(
      (source) =>
        preferredFamilies.has(source.sourceFamily) ||
        spatialLayerIds.has(source.id) ||
        source.ragRole === 'technical_interpretation',
    )
    .map((source) => source.id)
}

function readManifest(path: string): Manifest {
  return JSON.parse(readFileSync(path, 'utf8')) as Manifest
}

function readChunkedSourceIds(directory: string): Set<string> | undefined {
  if (!existsSync(directory)) return undefined
  return new Set(
    readdirSync(directory)
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) => basename(name, extname(name))),
  )
}

function isNormativeChatRequest(body: unknown): body is NormativeChatRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    'question' in body &&
    typeof body.question === 'string' &&
    body.question.trim().length > 0 &&
    'parcelContext' in body &&
    typeof body.parcelContext === 'object' &&
    body.parcelContext !== null &&
    'appState' in body &&
    typeof body.appState === 'object' &&
    body.appState !== null
  )
}

function isParcelInput(value: unknown): value is SpatialContextRequest['parcelInput'] {
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

function detectSecretRequest(question: string): string {
  const normalized = normalize(question)
  const secretTerms = ['openai api key', 'openai vector store id', 'api key', 'secret', 'secreto']
  return secretTerms.some((term) => normalized.includes(term))
    ? 'La solicitud intenta acceder a secretos server-side.'
    : ''
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeResponse(
  status: NormativeChatStatus,
  answer: string,
  spatialFactsUsed: SpatialContextFact[],
  citations: NormativeCitation[],
  warnings: string[],
): NormativeChatResponse {
  return {
    status,
    answer,
    spatialFactsUsed,
    citations,
    warnings,
  }
}
