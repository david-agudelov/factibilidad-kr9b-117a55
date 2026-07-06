import { SOURCES } from '../data/sources.generated'
import type {
  GeneratedSource,
  NormativeChatResponse,
  NormativeCitation,
  SpatialFactUsed,
} from '../types'
import { normalize } from './intent'

const MANIFEST_SOURCES: readonly GeneratedSource[] = SOURCES

const SPATIAL_ANSWER_RULES: Array<{ patterns: string[]; layerIds: string[]; label: string }> = [
  {
    patterns: ['tratamiento'],
    layerIds: ['tratamiento_urbanistico_pot'],
    label: 'tratamiento urbanístico',
  },
  {
    patterns: ['area de actividad'],
    layerIds: ['area_actividad_pot'],
    label: 'área de actividad',
  },
  {
    patterns: ['antejardin'],
    layerIds: ['antejardin_pot'],
    label: 'antejardín',
  },
  {
    patterns: ['plan parcial'],
    layerIds: ['plan_parcial_pot'],
    label: 'plan parcial',
  },
  {
    patterns: ['hidric'],
    layerIds: ['eep_sistema_hidrico_pot'],
    label: 'sistema hídrico',
  },
  {
    patterns: ['riesgo'],
    layerIds: ['suelo_proteccion_riesgo_pot'],
    label: 'protección por riesgo',
  },
  {
    patterns: ['anden'],
    layerIds: ['idu_anden_bogota'],
    label: 'andén',
  },
  {
    patterns: ['calzada'],
    layerIds: ['idu_calzada_bogota'],
    label: 'calzada',
  },
]

export function answerSpatialFactFromOverlays(
  question: string,
  spatialFactsUsed: SpatialFactUsed[],
): NormativeChatResponse | null {
  const normalizedQuestion = normalize(question)
  const rule = SPATIAL_ANSWER_RULES.find((candidate) =>
    candidate.patterns.some((pattern) => normalizedQuestion.includes(pattern)),
  )

  if (!rule) return null

  const facts = rule.layerIds
    .map((layerId) => spatialFactsUsed.find((fact) => fact.layerId === layerId))
    .filter((fact): fact is SpatialFactUsed => fact !== undefined)
    .filter((fact) => fact.attributes.method !== 'not_computed')

  if (facts.length === 0) return null

  const citations = facts
    .map((fact) => MANIFEST_SOURCES.find((source) => source.id === fact.layerId))
    .filter((source): source is GeneratedSource => source !== undefined)
    .map(toCitation)

  if (citations.length === 0) return null

  return {
    status: 'answered',
    answer: [
      `Hecho espacial calculado: para ${rule.label}, el overlay determinístico reporta ${formatFacts(facts)}.`,
      'Interpretación normativa: este dato ubica dónde aplica la capa; no calcula derechos urbanísticos ni reemplaza el motor normativo determinístico.',
      'Advertencia: verifica la fuente oficial, la fecha del dato y cualquier capa crítica pendiente antes de tomar decisiones de diseño o trámite.',
    ].join(' '),
    spatialFactsUsed,
    citations,
    warnings: ['Respuesta predial generada desde facts espaciales determinísticos y sources.manifest.json.'],
  }
}

function formatFacts(facts: SpatialFactUsed[]): string {
  return facts
    .map((fact) => {
      const value = typeof fact.attributes.value === 'string' ? fact.attributes.value : ''
      const method = typeof fact.attributes.method === 'string' ? fact.attributes.method : ''
      return `${fact.layerTitle}: ${value || (fact.matched ? 'coincidencia' : 'sin coincidencia')}${method ? ` (${method})` : ''}`
    })
    .join('; ')
}

function toCitation(source: GeneratedSource): NormativeCitation {
  return {
    sourceId: source.id,
    documentTitle: source.title,
    sourceFamily: source.sourceFamily,
    section: '',
    article: '',
    page: '',
    officialUrl: source.officialUrl,
    versionDate: source.versionDate || source.dataDate,
    confidence: 'high',
  }
}
