import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import {
  buildChunkRecords,
  buildChunkRecordsForPages,
  getRawDirectoryForSource,
  assessTextQuality,
  selectDownloadSources,
  selectSpatialSources,
  writeTextCorpus,
  writeSpatialCorpus,
  type RagSource,
  type SourceManifest,
} from './ingestionCore.ts'

const baseSource: RagSource = {
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
}

const manifest: SourceManifest = {
  schemaVersion: '1.0',
  generatedAt: '2026-07-04',
  jurisdiction: 'Bogota D.C.',
  basis: 'deep_research_report.md',
  fallbackAnswer: 'No encontré soporte suficiente en los documentos y datos cargados.',
  sources: [],
}

let tempRoots: string[] = []

afterEach(() => {
  tempRoots.forEach((root) => rmSync(root, { recursive: true, force: true }))
  tempRoots = []
})

function makeTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'rag-ingestion-'))
  tempRoots.push(root)
  return root
}

describe('RAG ingestion source selection', () => {
  test('selectDownloadSources includes current document sources and excludes provenance and spatial datasets', () => {
    const sources: RagSource[] = [
      baseSource,
      {
        ...baseSource,
        id: 'decreto_466_2024_provenance',
        sourceFamily: 'provenance',
        legalStatus: 'derogado',
        ragRole: 'provenance',
      },
      {
        ...baseSource,
        id: 'lote_bogota',
        sourceFamily: 'spatial_dataset',
        type: 'geojson',
        ragRole: 'spatial_overlay',
        indexText: false,
        indexSpatial: true,
      },
      {
        ...baseSource,
        id: 'project_requirements_md',
        sourceFamily: 'project_doc',
        type: 'otro',
        legalStatus: 'no_aplica',
        ragRole: 'project_context',
      },
    ]

    expect(selectDownloadSources(sources).map((source) => source.id)).toEqual([
      'decreto_670_2025_dot',
      'project_requirements_md',
    ])
  })

  test('getRawDirectoryForSource separates legal, manual, map, and project documents', () => {
    expect(getRawDirectoryForSource({ ...baseSource, sourceFamily: 'legal' })).toBe('legal')
    expect(getRawDirectoryForSource({ ...baseSource, sourceFamily: 'manual' })).toBe('manuals')
    expect(getRawDirectoryForSource({ ...baseSource, sourceFamily: 'annex' })).toBe('manuals')
    expect(getRawDirectoryForSource({ ...baseSource, sourceFamily: 'map' })).toBe('maps')
    expect(getRawDirectoryForSource({ ...baseSource, sourceFamily: 'project_doc' })).toBe(
      'project-docs',
    )
  })

  test('selectSpatialSources includes only spatial sources marked for spatial indexing', () => {
    const sources: RagSource[] = [
      baseSource,
      {
        ...baseSource,
        id: 'lote_bogota',
        sourceFamily: 'spatial_dataset',
        ragRole: 'spatial_overlay',
        indexText: false,
        indexSpatial: true,
      },
      {
        ...baseSource,
        id: 'predios_bogota',
        sourceFamily: 'spatial_dataset',
        ragRole: 'spatial_overlay',
        indexText: false,
        indexSpatial: false,
      },
    ]

    expect(selectSpatialSources(sources).map((source) => source.id)).toEqual(['lote_bogota'])
  })
})

describe('RAG text corpus preparation', () => {
  test('buildChunkRecords adds required citation metadata to each chunk', () => {
    const records = buildChunkRecords({
      source: baseSource,
      text: 'Artículo 1. Este es un texto normativo corto para indexar con citas verificables.',
      checksum: 'abc123',
      ingestedAt: '2026-07-04T00:00:00.000Z',
      maxChars: 48,
    })

    expect(records.length).toBeGreaterThan(0)
    expect(records[0]).toMatchObject({
      sourceId: 'decreto_670_2025_dot',
      title: 'Decreto 670 de 2025',
      authority: 'Alcaldía Mayor de Bogotá D.C.',
      officialUrl: baseSource.officialUrl,
      sourceFamily: 'legal',
      ragRole: 'primary_law',
      legalStatus: 'vigente',
      versionDate: '2025-12-27',
      page: null,
      section: '',
      article: 'Artículo 1',
      checksum: 'abc123',
      ingestedAt: '2026-07-04T00:00:00.000Z',
    })
  })

  test('buildChunkRecords hard-wraps long sentences that exceed the chunk limit', () => {
    const records = buildChunkRecords({
      source: baseSource,
      text: `Articulo 1. ${'texto_normativo_largo '.repeat(20)}`,
      checksum: 'abc123',
      ingestedAt: '2026-07-04T00:00:00.000Z',
      maxChars: 80,
    })

    expect(records.length).toBeGreaterThan(1)
    expect(records.every((record) => record.text.length <= 80)).toBe(true)
  })

  test('buildChunkRecordsForPages preserves PDF page and extraction metadata', () => {
    const records = buildChunkRecordsForPages({
      source: baseSource,
      pages: [
        {
          page: 7,
          text: 'ArtÃ­culo 12. Texto normativo extraÃ­do limpiamente desde PDF.',
          method: 'pdfplumber',
          warnings: [],
        },
        {
          page: 8,
          text: 'Articulo 13. Segundo texto normativo extraido limpiamente desde PDF.',
          method: 'pdfplumber',
          warnings: [],
        },
      ],
      checksum: 'pdf123',
      ingestedAt: '2026-07-05T00:00:00.000Z',
      ingestRunId: 'ingest-20260705-clean',
      maxChars: 80,
    })

    expect(records).toHaveLength(2)
    expect(records[0]).toMatchObject({
      page: 7,
      article: 'ArtÃ­culo 12',
      extractionMethod: 'pdfplumber',
      ingestRunId: 'ingest-20260705-clean',
    })
    expect(records[1]).toMatchObject({
      page: 8,
      article: 'Articulo 13',
      extractionMethod: 'pdfplumber',
      ingestRunId: 'ingest-20260705-clean',
    })
    expect(records.map((record) => record.id)).toEqual([
      'decreto_670_2025_dot#chunk-0001',
      'decreto_670_2025_dot#chunk-0002',
    ])
  })

  test('assessTextQuality rejects binary PDF stream noise', () => {
    const result = assessTextQuality(
      'endstream endobj \u0000\u0001\u0002 Ã°\u000fKÃ¿\u0000Ã¤J Ã¡XxÃ›Ã¾Â‹Ã‡ÂŽ',
    )

    expect(result.ok).toBe(false)
    expect(result.reason).toContain('PDF stream')
  })

  test('writeTextCorpus uses injected PDF extraction and writes page metadata', async () => {
    const root = makeTempRoot()
    const rawPath = join(root, 'rag', 'raw', 'legal', 'nsr10_decreto_926_2010.pdf')
    mkdirSync(join(root, 'rag', 'raw', 'legal'), { recursive: true })
    writeFileSync(rawPath, 'fake-pdf-bytes')

    const result = await writeTextCorpus({
      manifest: {
        ...manifest,
        sources: [
          {
            ...baseSource,
            id: 'nsr10_decreto_926_2010',
            title: 'NSR-10',
            type: 'pdf',
            formats: ['pdf'],
          },
        ],
      },
      workspaceRoot: root,
      ragRoot: join(root, 'rag'),
      ingestedAt: '2026-07-05T00:00:00.000Z',
      ingestRunId: 'ingest-20260705-clean',
      pdfExtractor: async () => ({
        ok: true,
        pages: [
          {
            page: 3,
            text: 'ArtÃ­culo 1. La NSR-10 contiene requisitos para edificaciones.',
            method: 'test-extractor',
            warnings: [],
          },
        ],
        warnings: [],
      }),
    })

    expect(result.sources[0]).toMatchObject({
      sourceId: 'nsr10_decreto_926_2010',
      status: 'processed',
      notes: expect.stringContaining('Prepared 1 chunks'),
    })

    const chunks = readFileSync(
      join(root, 'rag/processed/chunks/nsr10_decreto_926_2010.jsonl'),
      'utf8',
    )
    expect(chunks).toContain('"page":3')
    expect(chunks).toContain('"extractionMethod":"test-extractor"')
    expect(chunks).toContain('"ingestRunId":"ingest-20260705-clean"')
  })

  test('writeTextCorpus marks critical sources partial when expected source signals are missing', async () => {
    const root = makeTempRoot()
    const rawPath = join(root, 'rag', 'raw', 'legal', 'nsr10_titulo_k_requisitos_complementarios.pdf')
    mkdirSync(join(root, 'rag', 'raw', 'legal'), { recursive: true })
    writeFileSync(rawPath, 'fake-pdf-bytes')

    const result = await writeTextCorpus({
      manifest: {
        ...manifest,
        sources: [
          {
            ...baseSource,
            id: 'nsr10_titulo_k_requisitos_complementarios',
            title: 'NSR-10 - Titulo K',
            type: 'pdf',
            legalStatus: 'por_verificar',
            ragRole: 'technical_interpretation',
            formats: ['pdf'],
          },
        ],
      },
      workspaceRoot: root,
      ragRoot: join(root, 'rag'),
      ingestedAt: '2026-07-05T00:00:00.000Z',
      pdfExtractor: async () => ({
        ok: true,
        pages: [
          {
            page: 1,
            text: 'Este documento contiene texto suficiente para pasar calidad general, pero no contiene senales del titulo correcto.',
            method: 'test-extractor',
            warnings: [],
          },
        ],
        warnings: [],
      }),
    })

    expect(result.sources[0]).toMatchObject({
      sourceId: 'nsr10_titulo_k_requisitos_complementarios',
      status: 'partial',
      error: expect.stringContaining('expected source signals'),
    })
    expect(result.sources[0].chunksPath).toBe('')
  })

  test('writeTextCorpus treats HTML downloaded with a PDF extension as HTML text', async () => {
    const root = makeTempRoot()
    const rawPath = join(root, 'rag', 'raw', 'maps', 'mapa_aeropu_referencia.pdf')
    mkdirSync(join(root, 'rag', 'raw', 'maps'), { recursive: true })
    writeFileSync(
      rawPath,
      '<html><body><h1>Mapa AEROPU</h1><p>Referencia textual limitada para auditorÃ­a visual.</p></body></html>',
    )

    const result = await writeTextCorpus({
      manifest: {
        ...manifest,
        sources: [
          {
            ...baseSource,
            id: 'mapa_aeropu_referencia',
            title: 'Mapa AEROPU',
            sourceFamily: 'map',
            type: 'mapa',
            ragRole: 'visual_audit',
            formats: ['pdf', 'html'],
            officialUrl: 'https://www.sdp.gov.co/micrositios/pot/decreto-pot-bogota-2021',
          },
        ],
      },
      workspaceRoot: root,
      ragRoot: join(root, 'rag'),
      ingestedAt: '2026-07-05T00:00:00.000Z',
      pdfExtractor: async () => {
        throw new Error('PDF extractor should not be used for HTML content')
      },
    })

    expect(result.sources[0]).toMatchObject({ status: 'processed' })
    expect(readFileSync(join(root, 'rag/processed/text/mapa_aeropu_referencia.txt'), 'utf8')).toContain(
      'Mapa AEROPU',
    )
  })

  test('writeTextCorpus marks SISJUR-only cartilla HTML as partial instead of complete corpus', async () => {
    const root = makeTempRoot()
    const rawPath = join(root, 'rag', 'raw', 'manuals', 'cartilla_mobiliario_urbano.html')
    mkdirSync(join(root, 'rag', 'raw', 'manuals'), { recursive: true })
    writeFileSync(
      rawPath,
      '<html><body><a href="cartilla.pdf">Descargar documento asociado</a></body></html>',
    )

    const result = await writeTextCorpus({
      manifest: {
        ...manifest,
        sources: [
          {
            ...baseSource,
            id: 'cartilla_mobiliario_urbano',
            title: 'Anexo Cartilla de Mobiliario Urbano',
            sourceFamily: 'annex',
            type: 'anexo',
            ragRole: 'technical_interpretation',
            formats: ['pdf', 'html'],
          },
        ],
      },
      workspaceRoot: root,
      ragRoot: join(root, 'rag'),
      ingestedAt: '2026-07-05T00:00:00.000Z',
    })

    expect(result.sources[0]).toMatchObject({
      sourceId: 'cartilla_mobiliario_urbano',
      status: 'partial',
      error: expect.stringContaining('expected source signals'),
    })
  })

  test('writeTextCorpus extracts local project text and writes processed text plus chunks', async () => {
    const root = makeTempRoot()
    const sourcePath = join(root, 'docs', 'requirements.md')
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(sourcePath, '# Requisitos\n\nArtículo 2. Texto del proyecto.', {
      encoding: 'utf8',
    })

    const result = await writeTextCorpus({
      manifest: {
        ...manifest,
        sources: [
          {
            ...baseSource,
            id: 'project_requirements_md',
            title: 'Requirements',
            officialUrl: '',
            sourceDomain: 'local',
            sourceFamily: 'project_doc',
            type: 'otro',
            legalStatus: 'no_aplica',
            ragRole: 'project_context',
            download: false,
            localPath: 'docs/requirements.md',
            formats: ['md'],
          },
        ],
      },
      workspaceRoot: root,
      ragRoot: join(root, 'rag'),
      ingestedAt: '2026-07-04T00:00:00.000Z',
    })

    expect(result.sources[0]).toMatchObject({
      sourceId: 'project_requirements_md',
      status: 'processed',
      rawPath: 'rag/raw/project-docs/project_requirements_md.md',
    })
    expect(readFileSync(join(root, 'rag/processed/text/project_requirements_md.txt'), 'utf8')).toContain(
      'Texto del proyecto',
    )
    expect(readFileSync(join(root, 'rag/processed/chunks/project_requirements_md.jsonl'), 'utf8')).toContain(
      '"sourceId":"project_requirements_md"',
    )
  })
})

describe('RAG spatial corpus preparation', () => {
  test('writeSpatialCorpus creates metadata records without bundling data into public assets', async () => {
    const root = makeTempRoot()
    const result = await writeSpatialCorpus({
      manifest: {
        ...manifest,
        sources: [
          {
            ...baseSource,
            id: 'lote_bogota',
            title: 'Lote. Bogotá D.C.',
            officialUrl: 'https://datosabiertos.bogota.gov.co/dataset/lote',
            sourceDomain: 'datosabiertos.bogota.gov.co',
            sourceFamily: 'spatial_dataset',
            type: 'geojson',
            legalStatus: 'vigente',
            dataDate: '2026-05-31',
            metadataUpdatedAt: '2026-05-31',
            spatialReference: 'EPSG:4686',
            formats: ['geojson'],
            ragRole: 'spatial_overlay',
            indexText: false,
            indexSpatial: true,
          },
        ],
      },
      workspaceRoot: root,
      ragRoot: join(root, 'rag'),
      ingestedAt: '2026-07-04T00:00:00.000Z',
    })

    expect(result.sources[0]).toMatchObject({
      sourceId: 'lote_bogota',
      status: 'metadata_only',
      normalizedPath: '',
      notes: expect.stringContaining('No local spatial file'),
    })
    expect(
      readFileSync(join(root, 'rag/processed/spatial-index/sources.index.json'), 'utf8'),
    ).toContain('"sourceId": "lote_bogota"')
  })
})
