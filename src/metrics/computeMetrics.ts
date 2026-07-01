import { roundTo } from '../geometry/polygonMath'
import { SITE_CONSTANTS } from '../model/projectSource'
import type {
  FunctionalEnvelope,
  MetricItem,
  ModelGeometry,
  ModelParams,
  NormativeEnvelope,
} from '../model/types'

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

function metric(
  id: string,
  label: string,
  value: number,
  unit: string,
  description: string,
  tone: MetricItem['tone'] = 'neutral',
): MetricItem {
  return {
    id,
    label,
    value: roundTo(value, 2),
    unit,
    formatted: `${formatNumber(value)} ${unit}`.trim(),
    description,
    tone,
  }
}

export function computeMetrics(
  geometry: ModelGeometry,
  params: ModelParams,
  envelope: NormativeEnvelope,
  functionality: FunctionalEnvelope,
): MetricItem[] {
  const freeSpace = SITE_CONSTANTS.area - geometry.netLowerFootprintArea
  const occupancy = geometry.netLowerFootprintArea / SITE_CONSTANTS.area
  const iceMargin = envelope.iceLimit - geometry.builtArea

  return [
    metric('lotArea', 'Area del lote', SITE_CONSTANTS.area, 'm2', 'Area oficial del poligono catastral.'),
    metric('perimeter', 'Perimetro', SITE_CONSTANTS.officialPerimeter, 'm', 'Perimetro oficial reportado para el lote.'),
    metric('boundingWidth', 'Bounding box ancho', geometry.boundingBox.width, 'm', 'Ancho aproximado del rectangulo minimo.'),
    metric('boundingDepth', 'Bounding box fondo', geometry.boundingBox.depth, 'm', 'Fondo aproximado del rectangulo minimo.'),
    metric('footprint', 'Footprint', geometry.netLowerFootprintArea, 'm2', 'Huella neta en plantas inferiores.'),
    metric('occupancy', 'Ocupacion del lote', occupancy * 100, '%', 'Footprint dividido entre area oficial del lote.'),
    metric('freeSpace', 'Espacio libre', freeSpace, 'm2', 'Area del lote que queda fuera de la huella inferior.'),
    metric('height', 'Altura total', envelope.totalHeight, 'm', 'Numero de pisos por altura entre pisos.'),
    metric('rearSetback', 'Posterior calculado', envelope.rearSetback, 'm', 'Aislamiento posterior derivado de la altura total.'),
    metric('sideSetback', 'Lateral calculado', envelope.sideSetbackApplied, 'm', 'Aislamiento lateral aplicado cuando supera el umbral normativo.'),
    metric('builtArea', 'Area construida total', geometry.builtArea, 'm2', 'Area efectiva derivada de plantas inferiores y superiores.'),
    metric('usableArea', 'Area util despues de nucleo', functionality.totalUsableArea, 'm2', 'Area construida menos el escenario de nucleo seleccionado.'),
    metric('sellableArea', 'Area vendible estimada', functionality.adjustedSellableArea, 'm2', `Area util despues de nucleo por eficiencia vendible asumida (${Math.round(params.sellableEfficiency * 100)}%).`),
    metric('iceLimit', 'Limite ICe', envelope.iceLimit, 'm2', 'Area maxima preliminar por ICe 5.0 del PDF.'),
    metric(
      'iceMargin',
      'Margen ICe',
      iceMargin,
      'm2',
      'Diferencia entre limite ICe y area construida total.',
      iceMargin >= 0 ? 'good' : 'danger',
    ),
  ]
}
