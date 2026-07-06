import { SOURCES } from '../data/sources.generated'
import type {
  GeneratedSource,
  NormativeChatResponse,
  NormativeCitation,
  SpatialFactUsed,
} from '../types'
import { normalize } from './intent'

const MANIFEST_SOURCES: readonly GeneratedSource[] = SOURCES

const SOURCE_RULES: Array<{ patterns: string[]; sourceIds: string[]; note: string }> = [
  {
    patterns: ['retroceso', 'aislamiento'],
    sourceIds: ['anexo_05_manual_normas_comunes_2024', 'decreto_670_2025_dot'],
    note: 'Para retrocesos o aislamientos, revisa el Anexo 5 como fuente operativa y el decreto vigente como marco legal.',
  },
  {
    patterns: ['salida', 'salidas', 'evacuacion', 'escalera', 'escaleras', 'ocupacion'],
    sourceIds: ['nsr10_titulo_k_requisitos_complementarios', 'nsr10_decreto_926_2010'],
    note: 'Para salidas, escaleras, ocupación y medios de evacuación, revisa el Título K de la NSR-10 y su decreto adoptante.',
  },
  {
    patterns: ['incendio', 'incendios', 'titulo j'],
    sourceIds: ['nsr10_titulo_j_proteccion_incendios', 'nsr10_decreto_926_2010'],
    note: 'Para protección contra incendio, revisa el Título J de la NSR-10 y su decreto adoptante.',
  },
  {
    patterns: ['ventilacion', 'iluminacion', 'ventana', 'ventanas', 'vacio', 'vacios'],
    sourceIds: ['nsr10_titulo_k_requisitos_complementarios', 'nsr10_decreto_926_2010'],
    note: 'Para ventilación, iluminación, ventanas o vacíos, empieza por el Título K cuando aplique al requisito arquitectónico consultado.',
  },
  {
    patterns: ['sostenibilidad', 'ecourbanismo'],
    sourceIds: ['manual_ecourbanismo_2023'],
    note: 'Para sostenibilidad, consulta el Manual de Ecourbanismo y Construcción Sostenible.',
  },
  {
    patterns: ['espacio publico'],
    sourceIds: ['manual_espacio_publico_2023'],
    note: 'Para espacio público, consulta el Manual de Espacio Público.',
  },
  {
    patterns: ['mobiliario'],
    sourceIds: ['cartilla_mobiliario_urbano', 'manual_espacio_publico_2023'],
    note: 'Para mobiliario urbano, consulta la Cartilla de Mobiliario Urbano y el Manual de Espacio Público.',
  },
  {
    patterns: ['fuente legal primaria', 'norma rige', 'decreto vigente', 'decreto'],
    sourceIds: ['decreto_670_2025_dot'],
    note: 'Como fuente legal primaria urbana, revisa el decreto vigente marcado así en el manifest.',
  },
  {
    patterns: ['tratamiento'],
    sourceIds: ['tratamiento_urbanistico_pot', 'decreto_670_2025_dot'],
    note: 'Para tratamiento urbanístico, usa el dataset POT como hecho espacial y el decreto vigente para interpretación normativa.',
  },
  {
    patterns: ['area de actividad'],
    sourceIds: ['area_actividad_pot', 'decreto_670_2025_dot'],
    note: 'Para área de actividad, usa el dataset POT como hecho espacial y el decreto vigente para interpretación normativa.',
  },
  {
    patterns: ['aeropuerto', 'aeropu', 'elevacion', 'altura'],
    sourceIds: ['aeropuerto_influencia_indirecta_pot', 'area_elevacion_maxima_pot', 'mapa_aeropu_referencia'],
    note: 'Para afectaciones aeroportuarias o elevación, usa las capas espaciales oficiales y el mapa AEROPU como auditoría visual limitada.',
  },
]

export function answerSourceTraceFromManifest(
  question: string,
  spatialFactsUsed: SpatialFactUsed[] = [],
): NormativeChatResponse | null {
  const normalizedQuestion = normalize(question)
  const rule = SOURCE_RULES.find((candidate) =>
    candidate.patterns.some((pattern) => normalizedQuestion.includes(pattern)),
  )

  if (!rule) return null

  const sources = rule.sourceIds
    .map((sourceId) => MANIFEST_SOURCES.find((source) => source.id === sourceId))
    .filter((source): source is GeneratedSource => source !== undefined)
    .filter((source) => source.legalStatus !== 'derogado' && source.legalStatus !== 'compilado')

  if (sources.length === 0) return null

  const sourceList = sources.map((source) => source.title).join('; ')
  return {
    status: 'answered',
    answer: `${rule.note} Fuentes declaradas en el manifest: ${sourceList}. Esta respuesta solo identifica fuentes; para aplicar una regla al proyecto se requiere consultar el texto citado y, si es predial, los facts espaciales correspondientes.`,
    spatialFactsUsed,
    citations: sources.map(toCitation),
    warnings: ['Respuesta de trazabilidad generada desde sources.manifest.json; no resume artículos ni reemplaza revisión jurídica.'],
  }
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
    confidence: source.ragRole === 'primary_law' ? 'high' : 'medium',
  }
}
