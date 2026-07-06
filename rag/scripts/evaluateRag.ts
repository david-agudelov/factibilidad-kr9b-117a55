import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readManifest, type RagSource, type SourceManifest } from './ingestionCore.ts'

type EvaluationCategory = 'all' | 'normative' | 'spatial'
type EvaluationMode = 'static_manifest' | 'answer_contract'
type EvaluationStatus = 'passed' | 'failed'
type AnswerStatus = 'answered' | 'insufficient_sources' | 'out_of_scope' | 'error'
type Confidence = 'high' | 'medium' | 'low'

export type NormativeQaCase = {
  id: string
  question: string
  expectedSourceIds: string[]
  allowedSpatialSourceIds: string[]
  mustMention: string[]
  mustNotMention: string[]
  requiresCitation: boolean
  requiresSpatialFacts: boolean
  notes: string
}

export type SpatialQaCase = {
  id: string
  question: string
  requiredLayerIds: string[]
  requiresParcelResolution: boolean
  mustReturnInsufficientIfNoParcel: boolean
  requiresCitation: boolean
}

export type EvaluationCitation = {
  sourceId: string
  documentTitle: string
  sourceFamily: string
  section: string
  article: string
  page: string
  officialUrl: string
  versionDate: string
  confidence: Confidence
}

export type EvaluationSpatialFact = {
  layerId: string
  layerTitle: string
  matched: boolean
  attributes: Record<string, unknown>
  sourceUrl: string
  dataDate: string
  confidence: Confidence
}

export type EvaluationAnswer = {
  status: AnswerStatus
  answer: string
  citations: EvaluationCitation[]
  spatialFactsUsed: EvaluationSpatialFact[]
  warnings: string[]
}

export type EvaluationIssue = {
  caseId: string
  rule: string
  message: string
}

export type EvaluationAnswers = {
  normative?: Record<string, EvaluationAnswer>
  spatial?: Record<string, EvaluationAnswer>
}

export type EvaluationReport = {
  status: EvaluationStatus
  mode: EvaluationMode
  category: EvaluationCategory
  generatedAt: string
  caseCounts: {
    normative: number
    spatial: number
  }
  issues: EvaluationIssue[]
}

type CreateEvaluationReportOptions = {
  manifest: SourceManifest
  normativeCases: NormativeQaCase[]
  spatialCases: SpatialQaCase[]
  answers?: EvaluationAnswers
  category?: EvaluationCategory
  generatedAt?: string
}

const DEFAULT_MANIFEST_PATH = 'rag/sources/sources.manifest.json'
const DEFAULT_NORMATIVE_CASES_PATH = 'rag/evals/normative-qa-cases.json'
const DEFAULT_SPATIAL_CASES_PATH = 'rag/evals/spatial-qa-cases.json'
const VALID_CONFIDENCE = new Set<Confidence>(['high', 'medium', 'low'])
const DEPRECATED_STATUSES = new Set(['derogado', 'compilado'])
const FALLBACK_ANSWER = 'No encontré soporte suficiente en los documentos y datos cargados.'
const ABSOLUTE_CERTAINTY_PATTERNS = [
  /\bderecho adquirido\b/i,
  /\blicencia asegurada\b/i,
  /\bconcepto legal definitivo\b/i,
  /\bgarantizad[ao]\b/i,
  /\bsin (revisi[oó]n|verificaci[oó]n|validaci[oó]n) (oficial|adicional|jur[ií]dica)\b/i,
]

export function createEvaluationReport(options: CreateEvaluationReportOptions): EvaluationReport {
  const category = options.category ?? 'all'
  const issues: EvaluationIssue[] = []
  const sourceById = buildSourceIndex(options.manifest)

  issues.push(...validateManifestGovernance(options.manifest))

  if (category === 'all' || category === 'normative') {
    options.normativeCases.forEach((qaCase) => {
      issues.push(...validateNormativeCase(qaCase, sourceById))
      const answer = options.answers?.normative?.[qaCase.id]
      if (answer) issues.push(...evaluateNormativeAnswer(qaCase, answer, options.manifest))
    })
  }

  if (category === 'all' || category === 'spatial') {
    options.spatialCases.forEach((qaCase) => {
      issues.push(...validateSpatialCase(qaCase, sourceById))
      const answer = options.answers?.spatial?.[qaCase.id]
      if (answer) issues.push(...evaluateSpatialAnswer(qaCase, answer, options.manifest))
    })
  }

  return {
    status: issues.length === 0 ? 'passed' : 'failed',
    mode: options.answers ? 'answer_contract' : 'static_manifest',
    category,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    caseCounts: {
      normative: category === 'spatial' ? 0 : options.normativeCases.length,
      spatial: category === 'normative' ? 0 : options.spatialCases.length,
    },
    issues,
  }
}

export function evaluateNormativeAnswer(
  qaCase: NormativeQaCase,
  answer: EvaluationAnswer,
  manifest: SourceManifest,
): EvaluationIssue[] {
  const issues = evaluateAnswerBasics(qaCase.id, answer, manifest, qaCase.requiresCitation)
  const normalizedAnswer = normalizeForSearch(answer.answer)

  qaCase.mustMention.forEach((term) => {
    if (!normalizedAnswer.includes(normalizeForSearch(term))) {
      issues.push(issue(qaCase.id, 'mustMention', `La respuesta debe mencionar "${term}".`))
    }
  })

  qaCase.mustNotMention.forEach((term) => {
    if (normalizedAnswer.includes(normalizeForSearch(term))) {
      issues.push(issue(qaCase.id, 'mustNotMention', `La respuesta no debe mencionar "${term}".`))
    }
  })

  if (answer.status === 'answered') {
    const citedSourceIds = new Set(answer.citations.map((citation) => citation.sourceId))
    qaCase.expectedSourceIds.forEach((sourceId) => {
      if (!citedSourceIds.has(sourceId)) {
        issues.push(issue(qaCase.id, 'expectedSourceIds', `Falta cita esperada a ${sourceId}.`))
      }
    })

    if (qaCase.requiresSpatialFacts && answer.spatialFactsUsed.length === 0) {
      issues.push(issue(qaCase.id, 'requiresSpatialFacts', 'La respuesta requiere facts espaciales.'))
    }
  }

  issues.push(...findInventedArticles(qaCase.id, answer))
  issues.push(...findAbsoluteCertainty(qaCase.id, answer))
  return issues
}

export function evaluateSpatialAnswer(
  qaCase: SpatialQaCase,
  answer: EvaluationAnswer,
  manifest: SourceManifest,
): EvaluationIssue[] {
  const issues = evaluateAnswerBasics(qaCase.id, answer, manifest, qaCase.requiresCitation)

  if (answer.status !== 'answered') return issues

  if (qaCase.requiresParcelResolution && answer.spatialFactsUsed.length === 0) {
    issues.push(
      issue(
        qaCase.id,
        'requiresSpatialFacts',
        'La pregunta predial fue respondida sin facts espaciales calculados.',
      ),
    )
  }

  if (qaCase.mustReturnInsufficientIfNoParcel && answer.spatialFactsUsed.length === 0) {
    issues.push(
      issue(
        qaCase.id,
        'parcelResolution',
        'Una pregunta predial sin predio resuelto no debe devolver status answered.',
      ),
    )
  }

  const usedLayerIds = new Set(answer.spatialFactsUsed.map((fact) => fact.layerId))
  const missingLayerIds = qaCase.requiredLayerIds.filter((layerId) => !usedLayerIds.has(layerId))
  if (missingLayerIds.length > 0) {
    issues.push(
      issue(
        qaCase.id,
        'requiredLayerIds',
        `La respuesta no usó las capas requeridas: ${missingLayerIds.join(', ')}.`,
      ),
    )
  }

  issues.push(...findInventedArticles(qaCase.id, answer))
  issues.push(...findAbsoluteCertainty(qaCase.id, answer))
  return issues
}

function evaluateAnswerBasics(
  caseId: string,
  answer: EvaluationAnswer,
  manifest: SourceManifest,
  requiresCitation: boolean,
): EvaluationIssue[] {
  const issues: EvaluationIssue[] = []
  const sourceById = buildSourceIndex(manifest)

  if (requiresCitation && answer.status === 'answered' && answer.citations.length === 0) {
    issues.push(issue(caseId, 'requiresCitation', 'La respuesta answered no incluye citas.'))
  }

  if (answer.status === 'answered' && !hasDisclaimer(answer)) {
    issues.push(issue(caseId, 'disclaimer', 'La respuesta answered no muestra disclaimer.'))
  }

  answer.citations.forEach((citation) => {
    const source = sourceById.get(citation.sourceId)
    if (!source) {
      issues.push(
        issue(caseId, 'manifestContradiction', `La cita usa una fuente no declarada: ${citation.sourceId}.`),
      )
      return
    }

    if (citation.sourceFamily && citation.sourceFamily !== source.sourceFamily) {
      issues.push(
        issue(
          caseId,
          'manifestContradiction',
          `La cita ${citation.sourceId} declara familia ${citation.sourceFamily}, pero el manifest declara ${source.sourceFamily}.`,
        ),
      )
    }

    if (!citation.documentTitle.trim()) {
      issues.push(issue(caseId, 'citationMetadata', `La cita ${citation.sourceId} no incluye título.`))
    }

    if (source.officialUrl && !citation.officialUrl.trim()) {
      issues.push(issue(caseId, 'citationMetadata', `La cita ${citation.sourceId} no incluye URL oficial.`))
    }

    if (!VALID_CONFIDENCE.has(citation.confidence)) {
      issues.push(
        issue(caseId, 'citationMetadata', `La cita ${citation.sourceId} no incluye nivel de confianza válido.`),
      )
    }

    if (
      DEPRECATED_STATUSES.has(source.legalStatus) &&
      (citation.sourceFamily !== 'provenance' || presentsDeprecatedAsPrimary(answer.answer, source))
    ) {
      issues.push(
        issue(
          caseId,
          'deprecatedPrimaryLaw',
          `La fuente ${source.id} está ${source.legalStatus} y no puede usarse como fuente legal primaria.`,
        ),
      )
    }
  })

  if (answer.status === 'insufficient_sources' && answer.answer.trim() !== FALLBACK_ANSWER) {
    issues.push(issue(caseId, 'insufficientFallback', 'La insuficiencia debe usar la frase fallback exacta.'))
  }

  return issues
}

function validateManifestGovernance(manifest: SourceManifest): EvaluationIssue[] {
  const issues: EvaluationIssue[] = []
  const seen = new Set<string>()

  manifest.sources.forEach((source) => {
    if (seen.has(source.id)) {
      issues.push(issue('manifest', 'duplicateSourceId', `Fuente duplicada en manifest: ${source.id}.`))
    }
    seen.add(source.id)

    if (DEPRECATED_STATUSES.has(source.legalStatus) && source.ragRole === 'primary_law') {
      issues.push(
        issue(
          'manifest',
          'deprecatedPrimaryLaw',
          `La fuente ${source.id} está ${source.legalStatus} y no debe tener ragRole primary_law.`,
        ),
      )
    }

    if (source.sourceFamily === 'spatial_dataset' && source.indexText) {
      issues.push(
        issue(
          'manifest',
          'manifestContradiction',
          `El dataset espacial ${source.id} no debe indexarse como texto principal.`,
        ),
      )
    }
  })

  return issues
}

function validateNormativeCase(
  qaCase: NormativeQaCase,
  sourceById: Map<string, RagSource>,
): EvaluationIssue[] {
  const issues: EvaluationIssue[] = []

  qaCase.expectedSourceIds.forEach((sourceId) => {
    const source = sourceById.get(sourceId)
    if (!source) {
      issues.push(issue(qaCase.id, 'manifestContradiction', `expectedSourceIds no existe: ${sourceId}.`))
      return
    }

    if (source.sourceFamily === 'spatial_dataset') {
      issues.push(
        issue(qaCase.id, 'manifestContradiction', `${sourceId} es espacial y no debe ser cita textual esperada.`),
      )
    }

    if (DEPRECATED_STATUSES.has(source.legalStatus) && source.ragRole !== 'provenance') {
      issues.push(
        issue(qaCase.id, 'deprecatedPrimaryLaw', `${sourceId} está ${source.legalStatus} y no debe esperarse como norma vigente.`),
      )
    }
  })

  qaCase.allowedSpatialSourceIds.forEach((sourceId) => {
    const source = sourceById.get(sourceId)
    if (!source) {
      issues.push(issue(qaCase.id, 'manifestContradiction', `allowedSpatialSourceIds no existe: ${sourceId}.`))
      return
    }

    if (source.sourceFamily !== 'spatial_dataset' || !source.indexSpatial) {
      issues.push(issue(qaCase.id, 'manifestContradiction', `${sourceId} no es capa espacial indexable.`))
    }
  })

  return issues
}

function validateSpatialCase(qaCase: SpatialQaCase, sourceById: Map<string, RagSource>): EvaluationIssue[] {
  return qaCase.requiredLayerIds.flatMap((sourceId) => {
    const source = sourceById.get(sourceId)
    if (!source) {
      return [issue(qaCase.id, 'manifestContradiction', `requiredLayerIds no existe: ${sourceId}.`)]
    }

    if (source.sourceFamily !== 'spatial_dataset' || !source.indexSpatial) {
      return [issue(qaCase.id, 'manifestContradiction', `${sourceId} no es capa espacial indexable.`)]
    }

    return []
  })
}

function findInventedArticles(caseId: string, answer: EvaluationAnswer): EvaluationIssue[] {
  const mentionedArticles = Array.from(
    answer.answer.matchAll(/\bArt(?:\.|[ií]culo)\s+\d+[A-Za-zº°.-]*/gi),
    (match) => normalizeArticle(match[0]),
  )
  if (mentionedArticles.length === 0) return []

  const citedArticles = new Set(
    answer.citations
      .map((citation) => normalizeArticle(citation.article))
      .filter((article) => article.length > 0),
  )
  const uncitedArticles = mentionedArticles.filter((article) => !citedArticles.has(article))

  return uncitedArticles.map((article) =>
    issue(caseId, 'inventedArticle', `La respuesta menciona ${article} sin cita con artículo coincidente.`),
  )
}

function findAbsoluteCertainty(caseId: string, answer: EvaluationAnswer): EvaluationIssue[] {
  if (answer.status !== 'answered') return []
  const matchedPattern = ABSOLUTE_CERTAINTY_PATTERNS.find((pattern) => pattern.test(answer.answer))
  return matchedPattern
    ? [issue(caseId, 'absoluteCertainty', `La respuesta usa certeza legal absoluta: ${matchedPattern.source}.`)]
    : []
}

function hasDisclaimer(answer: EvaluationAnswer): boolean {
  const combined = normalizeForSearch(`${answer.answer} ${answer.warnings.join(' ')}`)
  return (
    combined.includes('no reemplaza') &&
    ['curaduria', 'aerocivil', 'topografia', 'fuente oficial', 'licencia'].some((term) =>
      combined.includes(term),
    )
  )
}

function presentsDeprecatedAsPrimary(answer: string, source: RagSource): boolean {
  const normalizedAnswer = normalizeForSearch(answer)
  const mentionsSource =
    normalizedAnswer.includes(normalizeForSearch(source.title)) ||
    normalizedAnswer.includes(normalizeForSearch(source.id))
  if (!mentionsSource) return false

  return (
    /\bes (la )?fuente legal primaria\b/i.test(normalizedAnswer) ||
    /\bcomo fuente legal primaria vigente\b/i.test(normalizedAnswer) ||
    /\bfuente primaria vigente\b/i.test(normalizedAnswer)
  )
}

function buildSourceIndex(manifest: SourceManifest): Map<string, RagSource> {
  return new Map(manifest.sources.map((source) => [source.id, source]))
}

function normalizeArticle(value: string): string {
  return value
    .trim()
    .replace(/^Art\./i, 'Artículo')
    .replace(/[.,;:]+$/, '')
    .toLowerCase()
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function issue(caseId: string, rule: string, message: string): EvaluationIssue {
  return { caseId, rule, message }
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function readAnswers(path: string): EvaluationAnswers {
  const parsed = readJsonFile<unknown>(path)
  if (isEvaluationAnswers(parsed)) return parsed
  if (isAnswerRecord(parsed)) return { normative: parsed, spatial: parsed }
  throw new Error('El archivo de respuestas debe ser un objeto por id o { normative, spatial }.')
}

function isEvaluationAnswers(value: unknown): value is EvaluationAnswers {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('normative' in value || 'spatial' in value)
  )
}

function isAnswerRecord(value: unknown): value is Record<string, EvaluationAnswer> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCategory(value: string | undefined): EvaluationCategory {
  if (value === 'normative' || value === 'spatial' || value === 'all') return value
  return 'all'
}

function getArgValue(args: string[], name: string): string | undefined {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`))
  if (prefixed) return prefixed.slice(name.length + 1)

  const index = args.indexOf(name)
  if (index >= 0) return args[index + 1]
  return undefined
}

function printReport(report: EvaluationReport, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log(`RAG evaluation (${report.mode}): ${report.status}`)
  console.log(`- category: ${report.category}`)
  console.log(`- normative cases: ${report.caseCounts.normative}`)
  console.log(`- spatial cases: ${report.caseCounts.spatial}`)
  console.log(`- issues: ${report.issues.length}`)
  report.issues.forEach((reportIssue) => {
    console.log(`  [${reportIssue.caseId}] ${reportIssue.rule}: ${reportIssue.message}`)
  })
}

async function runCli(): Promise<void> {
  const args = process.argv.slice(2)
  const workspaceRoot = process.cwd()
  const manifestPath = resolve(
    workspaceRoot,
    getArgValue(args, '--manifest') ?? process.env.RAG_SOURCE_MANIFEST_PATH ?? DEFAULT_MANIFEST_PATH,
  )
  const normativeCasesPath = resolve(
    workspaceRoot,
    getArgValue(args, '--normative-cases') ?? DEFAULT_NORMATIVE_CASES_PATH,
  )
  const spatialCasesPath = resolve(workspaceRoot, getArgValue(args, '--spatial-cases') ?? DEFAULT_SPATIAL_CASES_PATH)
  const answersPath = getArgValue(args, '--answers')
  const category = parseCategory(getArgValue(args, '--category'))
  const asJson = args.includes('--json')

  const manifest = readManifest(manifestPath)
  const normativeCases = readJsonFile<NormativeQaCase[]>(normativeCasesPath)
  const spatialCases = readJsonFile<SpatialQaCase[]>(spatialCasesPath)
  const answers =
    answersPath && existsSync(resolve(workspaceRoot, answersPath))
      ? readAnswers(resolve(workspaceRoot, answersPath))
      : undefined

  const report = createEvaluationReport({
    manifest,
    normativeCases,
    spatialCases,
    answers,
    category,
  })

  printReport(report, asJson)
  if (report.status === 'failed') process.exitCode = 1
}

const currentFilePath = fileURLToPath(import.meta.url)
const invokedFilePath = process.argv[1] ? resolve(process.argv[1]) : ''
const isCliRun = invokedFilePath ? pathToFileURL(invokedFilePath).href === pathToFileURL(currentFilePath).href : false

if (isCliRun) {
  await runCli()
}
