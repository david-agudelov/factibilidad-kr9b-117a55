import type { NormativeIntent } from '../types'

export function detectSecretRequest(question: string): string {
  const normalized = normalize(question)
  const secretTerms = ['openai api key', 'openai vector store id', 'api key', 'secret', 'secreto']
  return secretTerms.some((term) => normalized.includes(term))
    ? 'La solicitud intenta acceder a secretos server-side.'
    : ''
}

export function classifyNormativeIntent(question: string): NormativeIntent {
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
    'vacio',
    'vacios',
    'ventana',
    'ventanas',
    'ventilacion',
    'iluminacion',
    'ocupacion',
    'ocupantes',
    'nsr',
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

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
