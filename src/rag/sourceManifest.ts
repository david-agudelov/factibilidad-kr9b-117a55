import type { ManifestSource, ManifestValidationResult, SourceManifest } from './types'

type ManifestValidationOptions = {
  existingLocalPaths?: string[]
}

export function getManifestSourceById(
  manifest: SourceManifest,
  sourceId: string,
): ManifestSource | undefined {
  return manifest.sources.find((source) => source.id === sourceId)
}

export function validateSourceManifest(
  manifest: SourceManifest,
  options: ManifestValidationOptions = {},
): ManifestValidationResult {
  const errors: string[] = []
  const ids = new Set<string>()
  const duplicateIds = new Set<string>()
  const existingLocalPaths = new Set(options.existingLocalPaths ?? [])

  manifest.sources.forEach((source) => {
    const sourceUrl = getSourceUrl(source)
    const indexesText = source.indexText ?? source.ragEligible ?? false

    if (ids.has(source.id)) duplicateIds.add(source.id)
    ids.add(source.id)

    if (!source.id.trim()) errors.push('Every source must have an id')
    if (!source.title.trim()) errors.push(`Source ${source.id} must have a title`)
    if (!source.authority.trim()) errors.push(`Source ${source.id} must have an authority`)
    if (!sourceUrl.trim() && !source.localPath?.trim()) {
      errors.push(`Source ${source.id} must have a URL or localPath`)
    }
    if (source.formats.length === 0) {
      errors.push(`Source ${source.id} must declare at least one format`)
    }
    if (source.localPath && !existingLocalPaths.has(source.localPath)) {
      errors.push(`Local source ${source.id} is not available at ${source.localPath}`)
    }
    if (source.sourceFamily === 'spatial_dataset' && indexesText) {
      errors.push(`Spatial dataset ${source.id} must produce facts instead of direct RAG text`)
    }
  })

  duplicateIds.forEach((id) => errors.push(`Source ids must be unique: ${id}`))

  if (manifest.fallbackAnswer !== 'No encontré soporte suficiente en los documentos y datos cargados.') {
    errors.push('Manifest fallback answer must match the required unsupported response')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sourceCount: manifest.sources.length,
    ragEligibleCount: manifest.sources.filter((source) => source.indexText ?? source.ragEligible).length,
  }
}

function getSourceUrl(source: ManifestSource): string {
  return source.officialUrl ?? source.url ?? ''
}
