import type { ParcelSpatialFacts, SpatialFact } from './types'

export type SpatialFactsValidationResult = {
  isValid: boolean
  errors: string[]
  factCount: number
}

type SpatialFactsValidationOptions = {
  declaredSourceIds?: Set<string>
}

export function getSpatialFactById(
  parcelFacts: ParcelSpatialFacts,
  factId: string,
): SpatialFact | undefined {
  return parcelFacts.facts.find((fact) => fact.id === factId)
}

export function validateSpatialFacts(
  parcelFacts: ParcelSpatialFacts,
  options: SpatialFactsValidationOptions = {},
): SpatialFactsValidationResult {
  const errors: string[] = []
  const ids = new Set<string>()

  parcelFacts.facts.forEach((fact) => {
    if (ids.has(fact.id)) errors.push(`Spatial fact ids must be unique: ${fact.id}`)
    ids.add(fact.id)

    if (!fact.sourceId.trim()) errors.push(`Spatial fact ${fact.id} must declare a sourceId`)
    if (options.declaredSourceIds && !options.declaredSourceIds.has(fact.sourceId)) {
      errors.push(`Spatial fact ${fact.id} cites missing sourceId ${fact.sourceId}`)
    }
    if (!fact.method.trim()) errors.push(`Spatial fact ${fact.id} must declare a method`)
    if (!fact.dataDate.trim()) errors.push(`Spatial fact ${fact.id} must declare a dataDate`)
  })

  if (!parcelFacts.parcelId.trim()) errors.push('Spatial facts must declare a parcelId')
  if (!parcelFacts.spatialReference.trim()) errors.push('Spatial facts must declare a spatialReference')

  return {
    isValid: errors.length === 0,
    errors,
    factCount: parcelFacts.facts.length,
  }
}

export function summarizeSpatialFacts(parcelFacts: ParcelSpatialFacts): string {
  return parcelFacts.facts
    .map((fact) => {
      const unit = fact.unit ? ` ${fact.unit}` : ''
      return `${fact.label}: ${String(fact.value)}${unit}`
    })
    .join('\n')
}
