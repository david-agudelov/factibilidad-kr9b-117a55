import { describe, expect, it } from 'vitest'
import sourceManifest from '../../rag/sources/sources.manifest.json'
import { buildFileSearchResponsePayload, selectRagEligibleSourceIds } from './fileSearch'
import type { ManifestSource } from '../../src/rag/types'

const sources: ManifestSource[] = [
  {
    id: 'decreto_670_2025_dot',
    title: 'Decreto 670 de 2025',
    authority: 'Alcaldia Mayor de Bogota D.C.',
    url: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
    type: 'decreto',
    sourceFamily: 'legal_primary',
    legalStatus: 'vigente',
    formats: ['HTML'],
    priority: 'alta',
    ragEligible: true,
  },
  {
    id: 'lote_bogota',
    title: 'Lote. Bogota D.C.',
    authority: 'Unidad Administrativa Especial de Catastro Distrital',
    url: 'https://datosabiertos.bogota.gov.co/dataset/lote',
    type: 'geojson',
    sourceFamily: 'spatial_dataset',
    legalStatus: 'vigente',
    formats: ['GeoJSON'],
    priority: 'alta',
    ragEligible: false,
  },
]

describe('file search payload helpers', () => {
  it('selects only document sources eligible for RAG text retrieval', () => {
    expect(selectRagEligibleSourceIds(sources)).toEqual(['decreto_670_2025_dot'])
  })

  it('selects canonical manifest text sources and excludes provenance or missing chunks', () => {
    const chunkedSourceIds = new Set([
      'decreto_670_2025_dot',
      'anexo_05_manual_normas_comunes_2024',
      'manual_espacio_publico_2023',
      'cartilla_mobiliario_urbano',
      'manual_ecourbanismo_2023',
      'cartografia_decreto_componente_urbano',
      'mapa_aeropu_referencia',
      'nsr10_decreto_926_2010',
      'nsr10_titulo_j_proteccion_incendios',
    ])
    const selected = selectRagEligibleSourceIds(
      sourceManifest.sources as ManifestSource[],
      { chunkedSourceIds },
    )

    expect(selected).toContain('decreto_670_2025_dot')
    expect(selected).toContain('nsr10_titulo_j_proteccion_incendios')
    expect(selected).not.toContain('nsr10_titulo_k_requisitos_complementarios')
    expect(selected).not.toContain('nsr10_decreto_945_2017_provenance')
    expect(selected).not.toContain('lote_bogota')
  })

  it('builds a Responses API payload without exposing API keys', () => {
    const payload = buildFileSearchResponsePayload({
      model: 'gpt-4.1-mini',
      vectorStoreId: 'vs_123',
      question: 'Que norma aplica?',
      instructions: 'Responde con citas.',
    })

    expect(JSON.stringify(payload)).not.toContain('OPENAI_API_KEY')
    expect(payload.tools).toEqual([{ type: 'file_search', vector_store_ids: ['vs_123'] }])
    expect(payload.input).toContain('Que norma aplica?')
  })
})
