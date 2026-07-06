import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Confidence = 'high' | 'medium' | 'low'
type SpatialStatus = 'resolved' | 'not_resolved' | 'ambiguous' | 'error'

export type SpatialContextRequest = {
  query: string
  parcelInput: {
    address: string
    chip: string
    lotId: string
    geometry: unknown
  }
}

export type SpatialContextFact = {
  layerId: string
  layerTitle: string
  matched: boolean
  attributes: Record<string, unknown>
  sourceUrl: string
  dataDate: string
  confidence: Confidence
}

export type SpatialContextResponse = {
  status: SpatialStatus
  parcel: {
    address: string
    chip: string
    lotId: string
    geometrySource: string
  }
  spatialFacts: SpatialContextFact[]
  warnings: string[]
}

type ProjectSpatialFacts = {
  parcelId: string
  caseId: string
  spatialReference: string
  facts: Array<{
    id: string
    label: string
    value: string | number | boolean
    unit?: string
    sourceId: string
    method: string
    dataDate: string
    confidence: Confidence
  }>
}

type Manifest = {
  sources: Array<{
    id: string
    title: string
    officialUrl?: string
    url?: string
    dataDate?: string
  }>
}

const CASE_ID = 'KR9B_117A55'
const DEFAULT_FACTS_PATH = 'data/spatial/facts/KR9B_117A55.json'
const DEFAULT_MANIFEST_PATH = 'rag/sources/sources.manifest.json'

export async function handleSpatialContextRequest(
  body: unknown,
  options: {
    factsPath?: string
    manifestPath?: string
    workspaceRoot?: string
  } = {},
): Promise<SpatialContextResponse> {
  if (!isSpatialContextRequest(body)) {
    return response('error', emptyParcel(), [], ['Solicitud inválida para contexto espacial.'])
  }

  const workspaceRoot = options.workspaceRoot ?? process.cwd()
  const normalizedQuery = normalize(body.query)
  const address = body.parcelInput.address.trim()
  const chip = body.parcelInput.chip.trim()
  const lotId = body.parcelInput.lotId.trim()

  if (!address && !chip && !lotId && !body.parcelInput.geometry && !normalizedQuery.includes('kr9b')) {
    return response('not_resolved', emptyParcel(), [], ['No se recibió un identificador predial suficiente.'])
  }

  if (!matchesKnownCase({ normalizedQuery, address, chip, lotId })) {
    return response(
      'ambiguous',
      {
        address,
        chip,
        lotId,
        geometrySource: '',
      },
      [],
      ['No se pudo resolver el predio de forma determinística con los facts locales disponibles.'],
    )
  }

  try {
    const factsPath = resolve(workspaceRoot, options.factsPath ?? DEFAULT_FACTS_PATH)
    const manifestPath = resolve(
      workspaceRoot,
      process.env.RAG_ALLOWED_SOURCE_MANIFEST_PATH ?? options.manifestPath ?? DEFAULT_MANIFEST_PATH,
    )
    const facts = JSON.parse(readFileSync(factsPath, 'utf8')) as ProjectSpatialFacts
    const manifest = readManifestSafe(manifestPath)
    const sourceById = new Map(manifest.sources.map((source) => [source.id, source]))
    const spatialFacts = facts.facts.map<SpatialContextFact>((fact) => {
      const source = sourceById.get(fact.sourceId)
      return {
        layerId: fact.sourceId,
        layerTitle: source?.title ?? fact.label,
        matched: fact.method !== 'not_computed',
        attributes: {
          factId: fact.id,
          label: fact.label,
          value: fact.value,
          unit: fact.unit ?? '',
          method: fact.method,
          spatialReference: facts.spatialReference,
        },
        sourceUrl: source?.officialUrl ?? source?.url ?? '',
        dataDate: fact.dataDate || source?.dataDate || '',
        confidence: fact.confidence,
      }
    })

    return response(
      'resolved',
      {
        address: address || 'KR 9B #117A-55',
        chip,
        lotId: CASE_ID,
        geometrySource: DEFAULT_FACTS_PATH,
      },
      spatialFacts,
      spatialFacts.some((fact) => fact.matched === false)
        ? ['Existen overlays oficiales pendientes; algunos facts provienen del documento del proyecto.']
        : [],
    )
  } catch (error) {
    return response('error', emptyParcel(), [], [error instanceof Error ? error.message : String(error)])
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as unknown
  const response = await handleSpatialContextRequest(body)
  return Response.json(response, {
    status: response.status === 'error' ? 400 : 200,
  })
}

function isSpatialContextRequest(body: unknown): body is SpatialContextRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    'query' in body &&
    typeof body.query === 'string' &&
    'parcelInput' in body &&
    typeof body.parcelInput === 'object' &&
    body.parcelInput !== null
  )
}

function matchesKnownCase(input: {
  normalizedQuery: string
  address: string
  chip: string
  lotId: string
}): boolean {
  const normalizedAddress = normalize(input.address)
  const normalizedLot = normalize(input.lotId)
  return (
    normalizedLot === normalize(CASE_ID) ||
    input.normalizedQuery.includes('kr9b') ||
    normalizedAddress.includes('kr 9b') ||
    normalizedAddress.includes('117a-55') ||
    normalizedAddress.includes('117a 55')
  )
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

function readManifestSafe(path: string): Manifest {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Manifest
  } catch {
    return { sources: [] }
  }
}

function emptyParcel(): SpatialContextResponse['parcel'] {
  return {
    address: '',
    chip: '',
    lotId: '',
    geometrySource: '',
  }
}

function response(
  status: SpatialStatus,
  parcel: SpatialContextResponse['parcel'],
  spatialFacts: SpatialContextFact[],
  warnings: string[],
): SpatialContextResponse {
  return {
    status,
    parcel,
    spatialFacts,
    warnings,
  }
}
