import { describe, expect, it } from 'vitest'
import caseFacts from '../../data/spatial/facts/KR9B_117A55.json'
import sourceManifest from '../../rag/sources/sources.manifest.json'
import { getSpatialFactById, summarizeSpatialFacts, validateSpatialFacts } from './spatialFacts'
import type { ParcelSpatialFacts } from './types'

const facts = caseFacts as ParcelSpatialFacts
const declaredSourceIds = new Set(sourceManifest.sources.map((source) => source.id))

describe('spatial facts', () => {
  it('validates deterministic facts for the KR9B_117A55 case', () => {
    const result = validateSpatialFacts(facts, { declaredSourceIds })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.factCount).toBeGreaterThan(4)
  })

  it('rejects facts that cite sources missing from the manifest', () => {
    const result = validateSpatialFacts(
      {
        ...facts,
        facts: [
          {
            ...facts.facts[0],
            sourceId: 'missing_source',
          },
        ],
      },
      { declaredSourceIds },
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'Spatial fact placa_domiciliaria_bogota cites missing sourceId missing_source',
    )
  })

  it('keeps not-computed overlay facts explicit when an official layer is pending', () => {
    const fact = getSpatialFactById(facts, 'predios_bogota')

    expect(fact?.method).toBe('not_computed')
    expect(fact?.confidence).toBe('low')
    expect(String(fact?.value)).toContain('No calculado')
  })

  it('summarizes deterministic overlay facts without inventing old placeholder results', () => {
    const summary = summarizeSpatialFacts(facts)

    expect(summary).toContain('Placa domiciliaria: KR 9B 117A 55')
    expect(summary).toContain('Lote catastral: 008415053027')
    expect(summary).toMatch(/Predios\..*No calculado/)
    expect(summary).not.toContain('Estado de overlays oficiales')
  })
})
