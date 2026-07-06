import type { ParcelResolution, ParcelSpatialFacts } from '../../src/rag/types'

export type SpatialFactsRegistry = Record<string, ParcelSpatialFacts>

export function getFactsForResolution(
  resolution: ParcelResolution,
  registry: SpatialFactsRegistry,
): ParcelSpatialFacts | undefined {
  if (resolution.kind === 'case') return registry[resolution.value]
  return undefined
}
