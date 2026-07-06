import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

export type SourceFamily =
  | 'legal'
  | 'manual'
  | 'annex'
  | 'map'
  | 'spatial_dataset'
  | 'project_doc'
  | 'provenance'

export type SourceType =
  | 'decreto'
  | 'manual'
  | 'anexo'
  | 'mapa'
  | 'geojson'
  | 'gdb'
  | 'gpkg'
  | 'shp'
  | 'csv'
  | 'html'
  | 'pdf'
  | 'otro'

export type LegalStatus = 'vigente' | 'derogado' | 'compilado' | 'por_verificar' | 'no_aplica'
export type SourcePriority = 'alta' | 'media' | 'baja'
export type RagRole =
  | 'primary_law'
  | 'technical_interpretation'
  | 'spatial_overlay'
  | 'visual_audit'
  | 'provenance'
  | 'project_context'

export type RagSource = {
  id: string
  title: string
  authority: string
  officialUrl: string
  sourceDomain: string
  sourceFamily: SourceFamily
  type: SourceType
  legalStatus: LegalStatus
  effectiveDate: string
  versionDate: string
  dataDate: string
  metadataUpdatedAt: string
  spatialReference: string
  formats: string[]
  localPath: string
  checksum: string
  ingestedAt: string
  priority: SourcePriority
  ragRole: RagRole
  download: boolean
  indexText: boolean
  indexSpatial: boolean
  notes: string
}

export type SourceManifest = {
  schemaVersion: string
  generatedAt: string
  jurisdiction: string
  basis: string
  fallbackAnswer: string
  sources: RagSource[]
}

export type ExtractedPage = {
  page: number
  text: string
  method: string
  warnings: string[]
}

export type PdfExtractionResult = {
  ok: boolean
  pages: ExtractedPage[]
  warnings: string[]
  error?: string
}

export type TextQualityResult = {
  ok: boolean
  reason: string
  metrics: Record<string, number>
}

export type SourceProcessingStatus =
  | 'downloaded'
  | 'copied'
  | 'processed'
  | 'partial'
  | 'skipped'
  | 'metadata_only'
  | 'normalized'
  | 'normalization_deferred'
  | 'error'

export type SourceReport = {
  sourceId: string
  title: string
  status: SourceProcessingStatus
  rawPath: string
  processedPath: string
  chunksPath?: string
    normalizedPath?: string
  checksum: string
  ingestedAt: string
  notes: string
  error: string
}

export type CorpusReport = {
  generatedAt: string
  sources: SourceReport[]
}

type TextCorpusOptions = {
  manifest: SourceManifest
  workspaceRoot: string
  ragRoot: string
  ingestedAt: string
  ingestRunId?: string
  pdfExtractor?: PdfExtractor
}

type SpatialCorpusOptions = {
  manifest: SourceManifest
  workspaceRoot: string
  ragRoot: string
  ingestedAt: string
}

type DownloadOptions = {
  manifest: SourceManifest
  workspaceRoot: string
  ragRoot: string
  ingestedAt: string
  dryRun?: boolean
  fetcher?: typeof fetch
}

type BuildChunkOptions = {
  source: RagSource
  text: string
  checksum: string
  ingestedAt: string
  maxChars?: number
  page?: number | null
  extractionMethod?: string
  ingestRunId?: string
}

type BuildChunkPagesOptions = {
  source: RagSource
  pages: ExtractedPage[]
  checksum: string
  ingestedAt: string
  maxChars?: number
  ingestRunId?: string
}

export type ChunkRecord = {
  id: string
  text: string
  sourceId: string
  title: string
  authority: string
  officialUrl: string
  sourceFamily: SourceFamily
  ragRole: RagRole
  legalStatus: LegalStatus
  versionDate: string
  page: number | null
  section: string
  article: string
  checksum: string
  ingestedAt: string
  extractionMethod: string
  ingestRunId: string
}

export type PdfExtractor = (pdfPath: string) => Promise<PdfExtractionResult>

const DOCUMENT_DOWNLOAD_FAMILIES = new Set<SourceFamily>([
  'legal',
  'manual',
  'annex',
  'map',
  'project_doc',
])
const DOWNLOAD_LEGAL_STATUSES = new Set<LegalStatus>(['vigente', 'no_aplica', 'por_verificar'])
const TEXT_SOURCE_FAMILIES = DOCUMENT_DOWNLOAD_FAMILIES
const TEXT_LEGAL_STATUSES = DOWNLOAD_LEGAL_STATUSES
const DEFAULT_CHUNK_CHARS = 1_400
const LARGE_SPATIAL_FILE_BYTES = 50 * 1024 * 1024
const DEFAULT_INGEST_RUN_ID = 'local'
const MIN_TEXT_CHARS = 60

export function readManifest(manifestPath: string): SourceManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as SourceManifest
}

export function selectDownloadSources(sources: RagSource[]): RagSource[] {
  return sources.filter(
    (source) =>
      source.download &&
      DOCUMENT_DOWNLOAD_FAMILIES.has(source.sourceFamily) &&
      DOWNLOAD_LEGAL_STATUSES.has(source.legalStatus),
  )
}

export function selectTextSources(sources: RagSource[]): RagSource[] {
  return sources.filter(
    (source) =>
      source.indexText &&
      TEXT_SOURCE_FAMILIES.has(source.sourceFamily) &&
      TEXT_LEGAL_STATUSES.has(source.legalStatus),
  )
}

export function selectSpatialSources(sources: RagSource[]): RagSource[] {
  return sources.filter(
    (source) => source.sourceFamily === 'spatial_dataset' && source.indexSpatial,
  )
}

export function getRawDirectoryForSource(source: RagSource): string {
  if (source.sourceFamily === 'legal') return 'legal'
  if (source.sourceFamily === 'manual' || source.sourceFamily === 'annex') return 'manuals'
  if (source.sourceFamily === 'map') return 'maps'
  if (source.sourceFamily === 'project_doc') return 'project-docs'
  return 'other'
}

export function computeChecksum(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export function buildChunkRecords(options: BuildChunkOptions): ChunkRecord[] {
  const maxChars = options.maxChars ?? DEFAULT_CHUNK_CHARS
  const normalizedText = normalizeWhitespace(options.text)
  const segments = splitIntoChunks(normalizedText, maxChars)

  return segments.map((text, index) => ({
    id: `${options.source.id}#chunk-${String(index + 1).padStart(4, '0')}`,
    text,
    sourceId: options.source.id,
    title: options.source.title,
    authority: options.source.authority,
    officialUrl: options.source.officialUrl,
    sourceFamily: options.source.sourceFamily,
    ragRole: options.source.ragRole,
    legalStatus: options.source.legalStatus,
    versionDate: options.source.versionDate,
    page: options.page ?? null,
    section: detectSection(text),
    article: detectArticle(text),
    checksum: options.checksum,
    ingestedAt: options.ingestedAt,
    extractionMethod: options.extractionMethod ?? 'text',
    ingestRunId: options.ingestRunId ?? DEFAULT_INGEST_RUN_ID,
  }))
}

export function buildChunkRecordsForPages(options: BuildChunkPagesOptions): ChunkRecord[] {
  let chunkIndex = 0
  return options.pages.flatMap((page) => {
    const records = buildChunkRecords({
      source: options.source,
      text: page.text,
      checksum: options.checksum,
      ingestedAt: options.ingestedAt,
      maxChars: options.maxChars,
      page: page.page,
      extractionMethod: page.method,
      ingestRunId: options.ingestRunId,
    })
    return records.map((record) => {
      chunkIndex += 1
      return {
        ...record,
        id: `${options.source.id}#chunk-${String(chunkIndex).padStart(4, '0')}`,
      }
    })
  })
}

export function assessTextQuality(text: string): TextQualityResult {
  const normalized = normalizeWhitespace(text)
  const length = normalized.length
  const controlCharacters = Array.from(normalized).filter((character) =>
    isDisallowedControlCharacter(character),
  ).length
  const letters = Array.from(normalized).filter((character) => /\p{L}/u.test(character)).length
  const streamMarkers = /\b(?:endstream|endobj|xref|FlateDecode)\b/i.test(normalized) ? 1 : 0
  const letterRatio = length > 0 ? letters / length : 0
  const controlRatio = length > 0 ? controlCharacters / length : 0
  const metrics = { length, controlCharacters, controlRatio, letters, letterRatio, streamMarkers }

  if (streamMarkers > 0) return { ok: false, reason: 'PDF stream markers detected', metrics }
  if (controlRatio > 0.02) return { ok: false, reason: 'Too many control characters', metrics }
  if (length < MIN_TEXT_CHARS) return { ok: false, reason: 'Text too short', metrics }
  if (letterRatio < 0.35) return { ok: false, reason: 'Low letter ratio', metrics }
  return { ok: true, reason: 'ok', metrics }
}

function validateExpectedSourceSignals(
  source: RagSource,
  text: string,
  extractionMethod: string,
): { ok: true; notes: string; error: string } | { ok: false; notes: string; error: string } {
  if (source.id === 'cartilla_mobiliario_urbano' && extractionMethod === 'html-strip') {
    return {
      ok: false,
      notes:
        'Partial source. SISJUR HTML listed the document but did not provide the PDF body used for complete chunking.',
      error: 'Missing expected source signals for Cartilla de Mobiliario Urbano.',
    }
  }

  const normalized = normalizeForSourceValidation(text)
  const expectations: Record<string, { label: string; groups: RegExp[][] }> = {
    nsr10_titulo_k_requisitos_complementarios: {
      label: 'NSR-10 Titulo K',
      groups: [
        [/\btitulo\s+k\b/i, /\btitle\s+k\b/i],
        [
          /evacuacion/i,
          /medios?\s+de\s+evacuacion/i,
          /ocupacion/i,
          /escaleras?/i,
          /salidas?/i,
          /ventilacion/i,
          /iluminacion/i,
        ],
      ],
    },
    nsr10_titulo_j_proteccion_incendios: {
      label: 'NSR-10 Titulo J',
      groups: [
        [/\btitulo\s+j\b/i, /\btitle\s+j\b/i],
        [/incendios?/i, /proteccion\s+contra\s+incendios?/i],
      ],
    },
    cartilla_mobiliario_urbano: {
      label: 'Cartilla de Mobiliario Urbano',
      groups: [[/cartilla/i], [/mobiliario/i], [/urbano/i, /espacio\s+publico/i]],
    },
    cartografia_decreto_componente_urbano: {
      label: 'Cartografia componente urbano',
      groups: [
        [/cartografia/i, /mapas?/i, /planos?/i],
        [/componente\s+urbano/i, /suelo\s+urbano/i, /pot/i],
      ],
    },
  }

  const expectation = expectations[source.id]
  if (!expectation) return { ok: true, notes: '', error: '' }

  const missingGroup = expectation.groups.find(
    (group) => !group.some((pattern) => pattern.test(normalized)),
  )
  if (!missingGroup) return { ok: true, notes: '', error: '' }

  return {
    ok: false,
    notes:
      'Partial source. The local extraction did not include the expected source signals, so chunks were not written for ingestion.',
    error: `Missing expected source signals for ${expectation.label}.`,
  }
}

function normalizeForSourceValidation(text: string): string {
  return normalizeWhitespace(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function isDisallowedControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0)
  return (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31)
}

export async function downloadSources(options: DownloadOptions): Promise<CorpusReport> {
  const reports: SourceReport[] = []
  const fetcher = options.fetcher ?? fetch
  const sources = selectDownloadSources(options.manifest.sources)

  for (const source of sources) {
    const rawPath = getDocumentRawPath(options.ragRoot, source)
    const relativeRawPath = toWorkspaceRelative(options.workspaceRoot, rawPath)

    if (!source.officialUrl.trim()) {
      reports.push(makeReport(source, 'skipped', relativeRawPath, '', '', options.ingestedAt, ''))
      continue
    }

    if (options.dryRun) {
      reports.push(
        makeReport(
          source,
          'skipped',
          relativeRawPath,
          '',
          '',
          options.ingestedAt,
          'Dry run; no network request was made.',
        ),
      )
      continue
    }

    try {
      mkdirSync(resolve(rawPath, '..'), { recursive: true })
      const response = await fetcher(source.officialUrl)
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      await pipeline(Readable.fromWeb(response.body), createWriteStream(rawPath))
      const checksum = computeChecksum(readFileSync(rawPath))
      reports.push(
        makeReport(
          source,
          'downloaded',
          relativeRawPath,
          '',
          checksum,
          options.ingestedAt,
          'Downloaded from officialUrl.',
        ),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (shouldReportPartialOnExtractionError(source, message)) {
        reports.push(
          makeReport(
            source,
            'partial',
            relativeRawPath,
            '',
            '',
            options.ingestedAt,
            'Partial source. Official visual-audit document was downloaded, but clean text extraction failed; do not ingest chunks for this source.',
            message,
          ),
        )
        continue
      }

      reports.push(
        makeReport(
          source,
          'error',
          relativeRawPath,
          '',
          '',
          options.ingestedAt,
          '',
          message,
        ),
      )
    }
  }

  const report = { generatedAt: options.ingestedAt, sources: reports }
  writeReport(options.ragRoot, 'download-status.json', report)
  return report
}

function shouldReportPartialOnExtractionError(source: RagSource, errorMessage: string): boolean {
  if (source.ragRole !== 'visual_audit' && source.sourceFamily !== 'map') return false
  return /pdf|extract|python|eof/i.test(errorMessage)
}

export async function writeTextCorpus(options: TextCorpusOptions): Promise<CorpusReport> {
  const reports: SourceReport[] = []
  const sources = selectTextSources(options.manifest.sources)
  const ingestRunId = options.ingestRunId ?? process.env.RAG_INGEST_RUN_ID ?? options.ingestedAt
  const pdfExtractor = options.pdfExtractor ?? extractPdfWithPython

  for (const source of sources) {
    const rawPath = getDocumentRawPath(options.ragRoot, source)
    const relativeRawPath = toWorkspaceRelative(options.workspaceRoot, rawPath)
    const processedPath = join(options.ragRoot, 'processed', 'text', `${source.id}.txt`)
    const chunksPath = join(options.ragRoot, 'processed', 'chunks', `${source.id}.jsonl`)

    removeFileIfExists(processedPath)
    removeFileIfExists(chunksPath)

    try {
      const sourceFile = findTextInputPath(options.workspaceRoot, options.ragRoot, source)
      if (!sourceFile) {
        reports.push(
          makeReport(
            source,
            'skipped',
            relativeRawPath,
            toWorkspaceRelative(options.workspaceRoot, processedPath),
            '',
            options.ingestedAt,
            'No local raw file or localPath available. Run rag:download or provide localPath.',
          ),
        )
        continue
      }

      mkdirSync(resolve(rawPath, '..'), { recursive: true })
      if (resolve(sourceFile) !== resolve(rawPath)) {
        copyFileSync(sourceFile, rawPath)
      }

      const buffer = readFileSync(rawPath)
      const checksum = computeChecksum(buffer)
      const extension = extname(rawPath).toLowerCase()
      const extraction = await extractSourceText({
        buffer,
        extension,
        rawPath,
        pdfExtractor,
      })
      const text = extraction.text
      const sourceSignalValidation = validateExpectedSourceSignals(source, text, extraction.method)
      if (!sourceSignalValidation.ok) {
        reports.push(
          makeReport(
            source,
            'partial',
            relativeRawPath,
            toWorkspaceRelative(options.workspaceRoot, processedPath),
            checksum,
            options.ingestedAt,
            sourceSignalValidation.notes,
            sourceSignalValidation.error,
          ),
        )
        continue
      }

      const chunks =
        extraction.pages.length > 0
          ? buildChunkRecordsForPages({
              source,
              pages: extraction.pages,
              checksum,
              ingestedAt: options.ingestedAt,
              ingestRunId,
            })
          : buildChunkRecords({
              source,
              text,
              checksum,
              ingestedAt: options.ingestedAt,
              extractionMethod: extraction.method,
              ingestRunId,
            })

      if (chunks.length === 0) {
        throw new Error('No valid chunks were produced for this source.')
      }

      mkdirSync(resolve(processedPath, '..'), { recursive: true })
      mkdirSync(resolve(chunksPath, '..'), { recursive: true })
      writeFileSync(processedPath, text, 'utf8')
      writeFileSync(chunksPath, toJsonLines(chunks), 'utf8')

      reports.push({
        ...makeReport(
          source,
          'processed',
          relativeRawPath,
          toWorkspaceRelative(options.workspaceRoot, processedPath),
          checksum,
          options.ingestedAt,
          `Prepared ${chunks.length} chunks.${extraction.warnings.length ? ` Warnings: ${extraction.warnings.join(' | ')}` : ''}`,
        ),
        chunksPath: toWorkspaceRelative(options.workspaceRoot, chunksPath),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (shouldReportPartialOnExtractionError(source, message)) {
        reports.push(
          makeReport(
            source,
            'partial',
            relativeRawPath,
            toWorkspaceRelative(options.workspaceRoot, processedPath),
            '',
            options.ingestedAt,
            'Partial source. Official visual-audit document was downloaded, but clean text extraction failed; do not ingest chunks for this source.',
            message,
          ),
        )
        continue
      }

      reports.push(
        makeReport(
          source,
          'error',
          relativeRawPath,
          toWorkspaceRelative(options.workspaceRoot, processedPath),
          '',
          options.ingestedAt,
          '',
          message,
        ),
      )
    }
  }

  const report = { generatedAt: options.ingestedAt, sources: reports }
  writeReport(options.ragRoot, 'text-corpus-status.json', report)
  return report
}

export async function writeSpatialCorpus(options: SpatialCorpusOptions): Promise<CorpusReport> {
  const reports: SourceReport[] = []
  const indexRecords: unknown[] = []
  const sources = selectSpatialSources(options.manifest.sources)

  for (const source of sources) {
    const rawPath = getSpatialRawPath(options.ragRoot, source)
    const normalizedPath = join(options.ragRoot, 'processed', 'spatial-index', `${source.id}.geojson`)
    const sourceFile = findSpatialInputPath(options.workspaceRoot, options.ragRoot, source)
    const relativeRawPath = toWorkspaceRelative(options.workspaceRoot, rawPath)
    const relativeNormalizedPath = toWorkspaceRelative(options.workspaceRoot, normalizedPath)
    let report: SourceReport

    try {
      if (!sourceFile) {
        report = makeReport(
          source,
          'metadata_only',
          relativeRawPath,
          '',
          '',
          options.ingestedAt,
          'No local spatial file was found. Download externally or place source under rag/raw/spatial before normalization.',
        )
      } else {
        mkdirSync(resolve(rawPath, '..'), { recursive: true })
        if (resolve(sourceFile) !== resolve(rawPath)) {
          copyFileSync(sourceFile, rawPath)
        }

        const buffer = readFileSync(rawPath)
        const checksum = computeChecksum(buffer)
        const ext = extname(rawPath).toLowerCase()

        if (buffer.byteLength > LARGE_SPATIAL_FILE_BYTES) {
          report = makeReport(
            source,
            'normalization_deferred',
            relativeRawPath,
            '',
            checksum,
            options.ingestedAt,
            getLargeSpatialStrategy(),
          )
        } else if (ext === '.geojson' || ext === '.json') {
          mkdirSync(resolve(normalizedPath, '..'), { recursive: true })
          writeFileSync(normalizedPath, normalizeGeoJson(buffer), 'utf8')
          report = {
            ...makeReport(
              source,
              'normalized',
              relativeRawPath,
              relativeNormalizedPath,
              checksum,
              options.ingestedAt,
              'Normalized to GeoJSON for server-side spatial indexing.',
            ),
            normalizedPath: relativeNormalizedPath,
          }
        } else {
          report = makeReport(
            source,
            'normalization_deferred',
            relativeRawPath,
            '',
            checksum,
            options.ingestedAt,
            getLargeSpatialStrategy(),
          )
        }
      }
    } catch (error) {
      report = makeReport(
        source,
        'error',
        relativeRawPath,
        '',
        '',
        options.ingestedAt,
        '',
        error instanceof Error ? error.message : String(error),
      )
    }

    reports.push(report)
    indexRecords.push({
      sourceId: source.id,
      title: source.title,
      authority: source.authority,
      officialUrl: source.officialUrl,
      dataDate: source.dataDate,
      metadataUpdatedAt: source.metadataUpdatedAt,
      spatialReference: source.spatialReference,
      formats: source.formats,
      checksum: report.checksum,
      ingestedAt: options.ingestedAt,
      rawPath: report.rawPath,
      normalizedPath: report.normalizedPath ?? '',
      status: report.status,
      notes: report.notes,
    })
  }

  const report = { generatedAt: options.ingestedAt, sources: reports }
  const spatialIndexPath = join(options.ragRoot, 'processed', 'spatial-index', 'sources.index.json')
  mkdirSync(resolve(spatialIndexPath, '..'), { recursive: true })
  writeFileSync(spatialIndexPath, `${JSON.stringify(indexRecords, null, 2)}\n`, 'utf8')
  writeReport(options.ragRoot, 'spatial-corpus-status.json', report)
  return report
}

export function printReportSummary(label: string, report: CorpusReport): void {
  const counts = report.sources.reduce<Record<string, number>>((accumulator, source) => {
    accumulator[source.status] = (accumulator[source.status] ?? 0) + 1
    return accumulator
  }, {})
  console.log(`${label}: ${report.sources.length} sources`)
  Object.entries(counts).forEach(([status, count]) => console.log(`- ${status}: ${count}`))
}

async function extractSourceText(options: {
  buffer: Buffer
  extension: string
  rawPath: string
  pdfExtractor: PdfExtractor
}): Promise<{ text: string; pages: ExtractedPage[]; method: string; warnings: string[] }> {
  const effectiveExtension = detectEffectiveTextExtension(options.buffer, options.extension)
  if (effectiveExtension === '.pdf') {
    const result = await options.pdfExtractor(options.rawPath)
    if (!result.ok) throw new Error(result.error || 'PDF text extraction failed.')
    const usablePages = result.pages.filter((page) => assessTextQuality(page.text).ok)
    if (usablePages.length === 0) {
      throw new Error('PDF text extraction did not produce any page that passed quality checks.')
    }
    const rejectedPages = result.pages.length - usablePages.length
    return {
      text: usablePages.map((page) => `--- Page ${page.page} ---\n${page.text}`).join('\n\n'),
      pages: usablePages,
      method: usablePages[0]?.method ?? 'pdf',
      warnings: [
        ...result.warnings,
        ...(rejectedPages > 0 ? [`${rejectedPages} PDF pages failed quality checks.`] : []),
      ],
    }
  }

  return {
    text: extractText(options.buffer, effectiveExtension),
    pages: [],
    method: textMethodForExtension(effectiveExtension),
    warnings: effectiveExtension !== options.extension ? [`Detected ${effectiveExtension} content in ${options.extension} file.`] : [],
  }
}

function detectEffectiveTextExtension(buffer: Buffer, extension: string): string {
  const ext = extension.toLowerCase()
  if (ext !== '.pdf') return ext
  const prefix = buffer.subarray(0, 4096).toString('utf8').trimStart().toLowerCase()
  if (prefix.startsWith('%pdf')) return '.pdf'
  if (prefix.startsWith('<!doctype html') || prefix.startsWith('<html') || prefix.includes('<body')) {
    return '.html'
  }
  return '.pdf'
}

function extractText(buffer: Buffer, extension: string): string {
  const ext = extension.toLowerCase()
  if (ext === '.html' || ext === '.htm') return stripHtml(buffer.toString('utf8'))
  return buffer.toString('utf8')
}

function stripHtml(html: string): string {
  return normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>'),
  )
}

async function extractPdfWithPython(pdfPath: string): Promise<PdfExtractionResult> {
  const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'extractPdfText.py')
  const candidates = getPythonCandidates()
  const errors: string[] = []

  for (const candidate of candidates) {
    try {
      const output = execFileSync(candidate.command, [...candidate.args, scriptPath, pdfPath], {
        encoding: 'utf8',
        maxBuffer: 100 * 1024 * 1024,
      })
      return JSON.parse(output) as PdfExtractionResult
    } catch (error) {
      errors.push(`${candidate.command}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return {
    ok: false,
    pages: [],
    warnings: errors,
    error: 'No Python PDF extractor could be executed. Set RAG_PDF_PYTHON_BIN to a Python with pdfplumber or pypdf.',
  }
}

function getPythonCandidates(): Array<{ command: string; args: string[] }> {
  const configured = process.env.RAG_PDF_PYTHON_BIN || process.env.PYTHON
  return [
    ...(configured ? [{ command: configured, args: [] }] : []),
    { command: 'python', args: [] },
    { command: 'py', args: ['-3'] },
    { command: 'python3', args: [] },
  ]
}

function textMethodForExtension(extension: string): string {
  const ext = extension.toLowerCase()
  if (ext === '.html' || ext === '.htm') return 'html-strip'
  if (ext === '.md') return 'markdown'
  return 'plain-text'
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean)
  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [text]) {
    if (`${current}\n\n${paragraph}`.trim().length <= maxChars) {
      current = `${current}\n\n${paragraph}`.trim()
      continue
    }

    if (current) chunks.push(current)
    if (paragraph.length <= maxChars) {
      current = paragraph
      continue
    }

    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph]
    current = ''
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (trimmedSentence.length > maxChars) {
        if (current) {
          chunks.push(current.trim())
          current = ''
        }
        chunks.push(...splitLongText(trimmedSentence, maxChars))
      } else if (`${current} ${trimmedSentence}`.trim().length > maxChars && current) {
        chunks.push(current.trim())
        current = trimmedSentence
      } else {
        current = `${current} ${trimmedSentence}`.trim()
      }
    }
  }

  if (current) chunks.push(current)
  return chunks.length > 0 ? chunks : ['']
}

function splitLongText(text: string, maxChars: number): string[] {
  const chunks: string[] = []
  let remaining = text.trim()

  while (remaining.length > maxChars) {
    let splitIndex = remaining.lastIndexOf(' ', maxChars)
    if (splitIndex < Math.floor(maxChars * 0.5)) splitIndex = maxChars

    chunks.push(remaining.slice(0, splitIndex).trim())
    remaining = remaining.slice(splitIndex).trim()
  }

  if (remaining) chunks.push(remaining)
  return chunks
}

function detectSection(text: string): string {
  const heading = text.match(/^(#{1,6}\s+.+|(?:cap[ií]tulo|secci[oó]n|tabla)\s+[^.\n]+)/i)
  return heading ? heading[0].replace(/^#{1,6}\s+/, '').trim() : ''
}

function detectArticle(text: string): string {
  const article = text.match(/\bArt(?:\.|[^\s]{0,4}culo)\s+\d+[A-Za-zº°.-]*/i)
  return article ? article[0].trim().replace(/^Art\./i, 'Artículo').replace(/[.,;:]+$/, '') : ''
}

function getDocumentRawPath(ragRoot: string, source: RagSource): string {
  return join(ragRoot, 'raw', getRawDirectoryForSource(source), `${source.id}${getSourceExtension(source)}`)
}

function getSpatialRawPath(ragRoot: string, source: RagSource): string {
  return join(ragRoot, 'raw', 'spatial', `${source.id}${getSourceExtension(source)}`)
}

function getSourceExtension(source: RagSource): string {
  const localExtension = source.localPath ? extname(source.localPath) : ''
  if (localExtension) return localExtension
  if (source.type === 'pdf') return '.pdf'
  if (
    (source.type === 'mapa' || source.type === 'manual' || source.type === 'anexo') &&
    source.formats.some((format) => format.toLowerCase() === 'pdf')
  ) {
    return '.pdf'
  }

  const urlExtension = source.officialUrl ? extname(new URL(source.officialUrl).pathname) : ''
  if (urlExtension === '.jsp' || urlExtension === '.aspx') return '.html'
  if (urlExtension) return urlExtension

  if (source.type === 'decreto' || source.type === 'html') return '.html'
  if (source.type === 'mapa' || source.type === 'manual' || source.type === 'anexo') return '.pdf'
  if (source.type === 'geojson') return '.geojson'
  if (source.type === 'csv') return '.csv'
  if (source.type === 'gdb') return '.gdb'
  if (source.type === 'gpkg') return '.gpkg'
  if (source.type === 'shp') return '.shp'
  return '.txt'
}

function findTextInputPath(workspaceRoot: string, ragRoot: string, source: RagSource): string | undefined {
  if (source.localPath) {
    const localPath = resolve(workspaceRoot, source.localPath)
    if (existsSync(localPath)) return localPath
  }

  const rawDirectory = join(ragRoot, 'raw', getRawDirectoryForSource(source))
  return findRawFile(rawDirectory, source)
}

function findSpatialInputPath(workspaceRoot: string, ragRoot: string, source: RagSource): string | undefined {
  if (source.localPath) {
    const localPath = resolve(workspaceRoot, source.localPath)
    if (existsSync(localPath)) return localPath
  }

  const rawDirectory = join(ragRoot, 'raw', 'spatial')
  return findRawFile(rawDirectory, source)
}

function findRawFile(directory: string, source: RagSource): string | undefined {
  if (!existsSync(directory)) return undefined
  const matches = readdirSync(directory).filter(
    (name) => basename(name, extname(name)) === source.id,
  )
  if (matches.length === 0) return undefined

  const priority = getRawFileExtensionPriority(source)
  const prioritized = priority
    .map((extension) => matches.find((name) => extname(name).toLowerCase() === extension))
    .find(Boolean)

  return join(directory, prioritized ?? matches[0])
}

function getRawFileExtensionPriority(source: RagSource): string[] {
  if (source.sourceFamily === 'spatial_dataset') {
    return ['.geojson', '.json', '.gpkg', '.shp', '.zip', '.csv']
  }
  if (source.sourceFamily === 'project_doc') {
    const localExtension = source.localPath ? extname(source.localPath).toLowerCase() : ''
    return [localExtension, '.md', '.txt', '.html', '.pdf'].filter(Boolean)
  }
  if (source.formats.some((format) => format.toLowerCase() === 'pdf')) {
    return ['.pdf', '.html', '.htm', '.txt']
  }
  return [getSourceExtension(source).toLowerCase(), '.html', '.htm', '.pdf', '.txt']
}

function normalizeGeoJson(buffer: Buffer): string {
  const parsed = JSON.parse(buffer.toString('utf8')) as unknown
  if (isFeatureCollection(parsed)) return `${JSON.stringify(parsed, null, 2)}\n`
  if (isFeature(parsed)) {
    return `${JSON.stringify({ type: 'FeatureCollection', features: [parsed] }, null, 2)}\n`
  }

  throw new Error('GeoJSON input must be a Feature or FeatureCollection')
}

function isFeatureCollection(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'FeatureCollection' &&
    'features' in value &&
    Array.isArray(value.features)
  )
}

function isFeature(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'Feature'
}

function toJsonLines(records: unknown[]): string {
  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`
}

function makeReport(
  source: RagSource,
  status: SourceProcessingStatus,
  rawPath: string,
  processedPath: string,
  checksum: string,
  ingestedAt: string,
  notes: string,
  error = '',
): SourceReport {
  return {
    sourceId: source.id,
    title: source.title,
    status,
    rawPath,
    processedPath,
    chunksPath: '',
    normalizedPath: '',
    checksum,
    ingestedAt,
    notes,
    error,
  }
}

function removeFileIfExists(path: string): void {
  rmSync(path, { force: true })
}

function writeReport(ragRoot: string, filename: string, report: CorpusReport): void {
  const reportPath = join(ragRoot, 'processed', 'reports', filename)
  mkdirSync(resolve(reportPath, '..'), { recursive: true })
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

function toWorkspaceRelative(workspaceRoot: string, path: string): string {
  return relative(workspaceRoot, path).replace(/\\/g, '/')
}

function getLargeSpatialStrategy(): string {
  return [
    'Normalization deferred. For large spatial files use simplification, bbox filtering, clipping to the area of interest, external storage, and lazy loading server-side.',
  ].join(' ')
}
