import { SOURCES } from '../data/sources.generated'
import { SPATIAL_FACTS } from '../data/spatialFacts.generated'
import type {
  GeneratedSpatialFacts,
  SpatialContextRequest,
  SpatialContextResponse,
  SpatialFactUsed,
} from '../types'
import { normalize } from './intent'

const CASE_ID = 'KR9B_117A55'
const DEFAULT_FACTS_PATH = 'data/spatial/facts/KR9B_117A55.json'
const sourcesById = new Map(SOURCES.map((source) => [source.id, source]))
const spatialFactsData: GeneratedSpatialFacts = SPATIAL_FACTS

export function handleSpatialContext(body: unknown): SpatialContextResponse {
  if (!isSpatialContextRequest(body)) {
    return response('error', emptyParcel(), [], ['Solicitud inválida para contexto espacial.'])
  }

  const normalizedQuery = normalize(body.query)
  const address = body.parcelInput.address.trim()
  const chip = body.parcelInput.chip.trim()
  const lotId = body.parcelInput.lotId.trim()

  if (!address && !chip && !lotId && !body.parcelInput.geometry && !normalizedQuery.includes('kr9b')) {
    return response('not_resolved', emptyParcel(), [], ['No se recibió un identificador predial suficiente.'])
  }

  if (!matchesKnownCase({ normalizedQuery, address, lotId })) {
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

  const spatialFacts = spatialFactsData.facts.map<SpatialFactUsed>((fact) => {
    const source = sourcesById.get(fact.sourceId)
    const matched = typeof fact.matched === 'boolean' ? fact.matched : fact.method !== 'not_computed'
    return {
      layerId: fact.sourceId,
      layerTitle: source?.title ?? fact.label,
      matched,
      attributes: {
        ...(fact.attributes ?? {}),
        factId: fact.id,
        label: fact.label,
        value: fact.value,
        unit: fact.unit ?? '',
        method: fact.method,
        geometryRelation: fact.geometryRelation ?? {},
        spatialReference: spatialFactsData.spatialReference,
      },
      sourceUrl: fact.sourceUrl || source?.officialUrl || '',
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
    [
      ...(spatialFactsData.warnings ?? []),
      ...(spatialFacts.some((fact) => fact.matched === false)
        ? ['Algunas capas no tuvieron coincidencia o quedaron pendientes de overlay.']
        : []),
    ],
  )
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

function emptyParcel(): SpatialContextResponse['parcel'] {
  return {
    address: '',
    chip: '',
    lotId: '',
    geometrySource: '',
  }
}

function response(
  status: SpatialContextResponse['status'],
  parcel: SpatialContextResponse['parcel'],
  spatialFacts: SpatialFactUsed[],
  warnings: string[],
): SpatialContextResponse {
  return {
    status,
    parcel,
    spatialFacts,
    warnings,
  }
}
