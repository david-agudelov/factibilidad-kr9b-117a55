import { roundTo } from '../geometry/polygonMath'
import { SITE_CONSTANTS } from '../model/projectSource'
import type {
  MetricItem,
  ModelGeometry,
  ModelParams,
  NormativeEnvelope,
  ValidationResult,
} from '../model/types'
import type { LiveModelSnapshot } from './types'

type BuildLiveModelSnapshotInput = {
  params: ModelParams
  envelope: NormativeEnvelope
  geometry: ModelGeometry
  metrics: MetricItem[]
  validation: ValidationResult
}

function metricValue(metrics: MetricItem[], id: string, fallback: number) {
  return metrics.find((metric) => metric.id === id)?.value ?? fallback
}

export function buildLiveModelSnapshot({
  params,
  envelope,
  geometry,
  metrics,
  validation,
}: BuildLiveModelSnapshotInput): LiveModelSnapshot {
  const lotArea = SITE_CONSTANTS.area
  const footprintArea = metricValue(
    metrics,
    'footprint',
    geometry.netLowerFootprintArea,
  )

  return {
    caseId: SITE_CONSTANTS.caseId,
    floors: params.floors,
    floorHeight: params.floorHeight,
    ecosMode: params.ecosMode,
    totalHeight: envelope.totalHeight,
    lotArea,
    builtArea: metricValue(metrics, 'builtArea', geometry.builtArea),
    usableArea: metricValue(metrics, 'usableArea', 0),
    sellableArea: metricValue(metrics, 'sellableArea', 0),
    footprintArea,
    occupancy: lotArea > 0 ? roundTo(footprintArea / lotArea, 4) : 0,
    iceLimit: envelope.iceLimit,
    iceMargin: metricValue(
      metrics,
      'iceMargin',
      envelope.iceLimit - geometry.builtArea,
    ),
    rearSetback: envelope.rearSetback,
    sideSetback: envelope.sideSetbackApplied,
    validationSeverity: validation.severity,
    validationMessages: validation.messages,
  }
}
