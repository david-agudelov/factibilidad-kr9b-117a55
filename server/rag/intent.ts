import type { RagIntent } from '../../src/rag/types'

const normativeTerms = [
  'norma',
  'decreto',
  'edificabilidad',
  'aislamiento',
  'antejardin',
  'retroceso',
  'altura',
  'tratamiento',
  'ice',
  'ecos',
]

const spatialTerms = [
  'predio',
  'chip',
  'direccion',
  'lote',
  'mapa',
  'overlay',
  'riesgo',
  'reserva',
  'bic',
  'aeropuerto',
  'area de actividad',
]

const projectTerms = ['kr9b', '117a', 'factibilidad', 'pdf', 'caso', 'modelo']

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

export function detectIntent(question: string): RagIntent {
  const normalized = question.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const hasNormative = includesAny(normalized, normativeTerms)
  const hasSpatial = includesAny(normalized, spatialTerms)
  const hasProject = includesAny(normalized, projectTerms)

  if (hasNormative && hasSpatial) return 'mixed'
  if (hasNormative) return 'normative'
  if (hasSpatial) return 'spatial'
  if (hasProject) return 'project'

  return 'unsupported'
}
