import { describe, expect, it } from 'vitest'
import { answerRagQuery } from './query'
import type { RetrievedDocument } from './retrieval'
import type { ParcelSpatialFacts, RagQuery } from '../../src/rag/types'

const parcelFacts: ParcelSpatialFacts = {
  parcelId: 'KR9B_117A55',
  caseId: 'KR9B_117A55',
  resolvedFrom: {
    kind: 'case',
    value: 'KR9B_117A55',
    confidence: 'high',
  },
  generatedAt: '2026-07-04',
  spatialReference: 'EPSG:4686',
  facts: [
    {
      id: 'official_lot_area',
      label: 'Area oficial aproximada del lote',
      value: 326.184,
      unit: 'm2',
      sourceId: 'project_factibilidad_kr9b_117a55_pdf',
      method: 'project_source',
      dataDate: '2026-06-30',
      confidence: 'high',
    },
  ],
}

const source = {
  id: 'decreto_670_2025_dot',
  title: 'Decreto 670 de 2025',
  authority: 'Alcaldia Mayor de Bogota D.C.',
  url: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
  type: 'decreto',
  sourceFamily: 'legal_primary' as const,
  legalStatus: 'vigente',
  formats: ['HTML'],
  priority: 'alta' as const,
  ragEligible: true,
}

const query: RagQuery = {
  question: 'Que norma soporta la edificabilidad del caso KR9B_117A55?',
  caseId: 'KR9B_117A55',
}

describe('answerRagQuery', () => {
  it('returns fallback when retrieval has no cited support', async () => {
    const answer = await answerRagQuery(query, {
      resolveParcel: () => parcelFacts,
      retrieve: () => [],
      sources: [source],
    })

    expect(answer.supported).toBe(false)
    expect(answer.answer).toBe('No encontré soporte suficiente en los documentos y datos cargados.')
  })

  it('returns a cited answer using retrieval documents and deterministic spatial facts', async () => {
    const retrieved: RetrievedDocument[] = [
      {
        sourceId: 'decreto_670_2025_dot',
        title: 'Decreto 670 de 2025',
        url: source.url,
        sourceFamily: 'legal_primary',
        excerpt: 'Expide el Decreto Unico Distrital de Ordenamiento Territorial.',
      },
    ]

    const answer = await answerRagQuery(query, {
      resolveParcel: () => parcelFacts,
      retrieve: () => retrieved,
      sources: [source],
    })

    expect(answer.supported).toBe(true)
    expect(answer.intent).toBe('normative')
    expect(answer.answer).toContain('Decreto 670 de 2025')
    expect(answer.citations).toHaveLength(1)
    expect(answer.spatialFacts).toEqual(parcelFacts.facts)
  })
})
