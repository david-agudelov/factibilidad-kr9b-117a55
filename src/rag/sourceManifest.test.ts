import { describe, expect, it } from 'vitest'
import sourceManifest from '../../rag/sources/sources.manifest.json'
import { getManifestSourceById, validateSourceManifest } from './sourceManifest'
import type { SourceManifest } from './types'

const manifest = sourceManifest as SourceManifest
const manifestLocalPaths = manifest.sources
  .map((source) => source.localPath)
  .filter((localPath): localPath is string => Boolean(localPath))

describe('source manifest validation', () => {
  it('accepts the declared RAG manifest with official and project sources', () => {
    const result = validateSourceManifest(manifest, {
      existingLocalPaths: manifestLocalPaths,
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.sourceCount).toBeGreaterThan(20)
    expect(result.ragEligibleCount).toBeGreaterThan(5)
  })

  it('keeps the legal primary source and project PDF addressable by id', () => {
    expect(getManifestSourceById(manifest, 'decreto_670_2025_dot')?.ragRole)
      .toBe('primary_law')
    expect(getManifestSourceById(manifest, 'project_factibilidad_kr9b_117a55_pdf')?.localPath)
      .toBe('public/static/factibilidad_KR9B_117A55.pdf')
  })

  it('keeps spatial datasets out of text retrieval', () => {
    const spatialSources = manifest.sources.filter((source) => source.sourceFamily === 'spatial_dataset')

    expect(spatialSources.length).toBeGreaterThan(10)
    expect(spatialSources.every((source) => source.indexSpatial === true)).toBe(true)
    expect(spatialSources.every((source) => source.indexText === false)).toBe(true)
  })

  it('rejects duplicate source ids and missing local project files', () => {
    const duplicate = {
      ...manifest,
      sources: [...manifest.sources, manifest.sources[0]],
    }

    const result = validateSourceManifest(duplicate, { existingLocalPaths: [] })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Source ids must be unique: decreto_670_2025_dot')
    expect(result.errors).toContain(
      'Local source project_factibilidad_kr9b_117a55_pdf is not available at public/static/factibilidad_KR9B_117A55.pdf',
    )
  })
})
