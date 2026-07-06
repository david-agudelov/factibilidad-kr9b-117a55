import { describe, expect, test } from 'vitest'
import type { SourceManifest } from './ingestionCore.ts'
import {
  createEvaluationReport,
  evaluateNormativeAnswer,
  evaluateSpatialAnswer,
  type NormativeQaCase,
  type SpatialQaCase,
} from './evaluateRag.ts'

const manifest: SourceManifest = {
  schemaVersion: '1.0',
  generatedAt: '2026-07-04',
  jurisdiction: 'Bogota D.C.',
  basis: 'deep_research_report.md',
  fallbackAnswer: 'No encontré soporte suficiente en los documentos y datos cargados.',
  sources: [
    {
      id: 'decreto_670_2025_dot',
      title: 'Decreto 670 de 2025',
      authority: 'Alcaldía Mayor de Bogotá D.C.',
      officialUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
      sourceDomain: 'www.alcaldiabogota.gov.co',
      sourceFamily: 'legal',
      type: 'decreto',
      legalStatus: 'vigente',
      effectiveDate: '2025-12-27',
      versionDate: '2025-12-27',
      dataDate: '',
      metadataUpdatedAt: '',
      spatialReference: '',
      formats: ['html'],
      localPath: '',
      checksum: '',
      ingestedAt: '',
      priority: 'alta',
      ragRole: 'primary_law',
      download: true,
      indexText: true,
      indexSpatial: false,
      notes: '',
    },
    {
      id: 'anexo_05_manual_normas_comunes_2024',
      title: 'Actualización Anexo No. 5: Manual de Normas Comunes',
      authority: 'Secretaría Distrital de Planeación',
      officialUrl: 'https://www.sdp.gov.co/anexo-5.pdf',
      sourceDomain: 'www.sdp.gov.co',
      sourceFamily: 'annex',
      type: 'anexo',
      legalStatus: 'vigente',
      effectiveDate: '',
      versionDate: '2024-11-20',
      dataDate: '',
      metadataUpdatedAt: '',
      spatialReference: '',
      formats: ['pdf'],
      localPath: '',
      checksum: '',
      ingestedAt: '',
      priority: 'alta',
      ragRole: 'technical_interpretation',
      download: true,
      indexText: true,
      indexSpatial: false,
      notes: '',
    },
    {
      id: 'decreto_466_2024_provenance',
      title: 'Decreto 466 de 2024',
      authority: 'Alcaldía Mayor de Bogotá D.C.',
      officialUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=170937',
      sourceDomain: 'www.alcaldiabogota.gov.co',
      sourceFamily: 'provenance',
      type: 'decreto',
      legalStatus: 'derogado',
      effectiveDate: '2024-12-24',
      versionDate: '2024-12-24',
      dataDate: '',
      metadataUpdatedAt: '',
      spatialReference: '',
      formats: ['html'],
      localPath: '',
      checksum: '',
      ingestedAt: '',
      priority: 'media',
      ragRole: 'provenance',
      download: true,
      indexText: false,
      indexSpatial: false,
      notes: '',
    },
    {
      id: 'lote_bogota',
      title: 'Lote. Bogotá D.C.',
      authority: 'UAECD',
      officialUrl: 'https://datosabiertos.bogota.gov.co/dataset/lote',
      sourceDomain: 'datosabiertos.bogota.gov.co',
      sourceFamily: 'spatial_dataset',
      type: 'geojson',
      legalStatus: 'vigente',
      effectiveDate: '',
      versionDate: '',
      dataDate: '2026-05-31',
      metadataUpdatedAt: '2026-05-31',
      spatialReference: 'EPSG:4686',
      formats: ['geojson'],
      localPath: '',
      checksum: '',
      ingestedAt: '',
      priority: 'alta',
      ragRole: 'spatial_overlay',
      download: true,
      indexText: false,
      indexSpatial: true,
      notes: '',
    },
    {
      id: 'tratamiento_urbanistico_pot',
      title: 'Tratamiento urbanístico. POT Bogotá D.C.',
      authority: 'Secretaría Distrital de Planeación',
      officialUrl: 'https://datosabiertos.bogota.gov.co/dataset/tratamiento-urbanistico-bogota-d-c',
      sourceDomain: 'datosabiertos.bogota.gov.co',
      sourceFamily: 'spatial_dataset',
      type: 'geojson',
      legalStatus: 'vigente',
      effectiveDate: '',
      versionDate: '',
      dataDate: '2026-03-31',
      metadataUpdatedAt: '2026-03-31',
      spatialReference: 'EPSG:4686',
      formats: ['geojson'],
      localPath: '',
      checksum: '',
      ingestedAt: '',
      priority: 'alta',
      ragRole: 'spatial_overlay',
      download: true,
      indexText: false,
      indexSpatial: true,
      notes: '',
    },
  ],
}

const normativeCase: NormativeQaCase = {
  id: 'norm-001',
  question: '¿Qué documento reviso para retrocesos?',
  expectedSourceIds: ['anexo_05_manual_normas_comunes_2024'],
  allowedSpatialSourceIds: [],
  mustMention: ['Anexo 5', 'Normas Comunes'],
  mustNotMention: ['manual de retrocesos autónomo vigente'],
  requiresCitation: true,
  requiresSpatialFacts: false,
  notes: 'El manual autónomo no debe tratarse como fuente vigente.',
}

const spatialCase: SpatialQaCase = {
  id: 'spatial-001',
  question: '¿Qué tratamiento urbanístico aplica al predio?',
  requiredLayerIds: ['tratamiento_urbanistico_pot', 'lote_bogota'],
  requiresParcelResolution: true,
  mustReturnInsufficientIfNoParcel: true,
  requiresCitation: true,
}

describe('RAG evaluation harness', () => {
  test('passes static manifest checks when cases point to declared current sources', () => {
    const report = createEvaluationReport({
      manifest,
      normativeCases: [normativeCase],
      spatialCases: [spatialCase],
    })

    expect(report.status).toBe('passed')
    expect(report.issues).toEqual([])
  })

  test('fails normative answers without citations and with invented articles', () => {
    const issues = evaluateNormativeAnswer(normativeCase, {
      status: 'answered',
      answer:
        'Según el Artículo 999, aplica el manual de retrocesos autónomo vigente sin revisión adicional.',
      citations: [],
      spatialFactsUsed: [],
      warnings: [],
    }, manifest)

    expect(issues.map((issue) => issue.rule)).toEqual(
      expect.arrayContaining(['requiresCitation', 'mustNotMention', 'inventedArticle', 'disclaimer']),
    )
  })

  test('fails when a derogado or provenance source is used as primary law', () => {
    const issues = evaluateNormativeAnswer(normativeCase, {
      status: 'answered',
      answer:
        'El Decreto 466 de 2024 es fuente legal primaria vigente. Consulta preliminar. No reemplaza Curaduría Urbana.',
      citations: [
        {
          sourceId: 'decreto_466_2024_provenance',
          documentTitle: 'Decreto 466 de 2024',
          sourceFamily: 'legal',
          section: '',
          article: '',
          page: '',
          officialUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=170937',
          versionDate: '2024-12-24',
          confidence: 'high',
        },
      ],
      spatialFactsUsed: [],
      warnings: [],
    }, manifest)

    expect(issues.map((issue) => issue.rule)).toContain('deprecatedPrimaryLaw')
  })

  test('fails spatial answers that ignore required overlay facts', () => {
    const issues = evaluateSpatialAnswer(spatialCase, {
      status: 'answered',
      answer: 'Aplica un tratamiento. Consulta preliminar. No reemplaza Curaduría Urbana.',
      citations: [
        {
          sourceId: 'decreto_670_2025_dot',
          documentTitle: 'Decreto 670 de 2025',
          sourceFamily: 'legal',
          section: '',
          article: '',
          page: '',
          officialUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905',
          versionDate: '2025-12-27',
          confidence: 'high',
        },
      ],
      spatialFactsUsed: [],
      warnings: [],
    }, manifest)

    expect(issues.map((issue) => issue.rule)).toEqual(
      expect.arrayContaining(['requiresSpatialFacts', 'requiredLayerIds']),
    )
  })
})
