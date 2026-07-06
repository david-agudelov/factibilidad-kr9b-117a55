import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

type ChunkRecord = {
  id: string
  text: string
  sourceId: string
  title: string
  authority: string
  officialUrl: string
  sourceFamily: string
  ragRole: string
  legalStatus: string
  versionDate: string
  page: number | null
  section: string
  article: string
  checksum: string
  ingestedAt: string
  extractionMethod?: string
  ingestRunId?: string
}

type ManifestSource = {
  id: string
  indexText: boolean
  ragRole: string
}

type SourceManifest = {
  sources: ManifestSource[]
}

type SourceReport = {
  sourceId: string
  status: string
  chunksPath?: string
}

type CorpusReport = {
  sources: SourceReport[]
}

const workspaceRoot = process.cwd()
const chunksDir = resolve(workspaceRoot, process.env.RAG_CHUNKS_DIR ?? 'rag/processed/chunks')
const manifestPath = resolve(
  workspaceRoot,
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const textCorpusReportPath = resolve(
  workspaceRoot,
  process.env.RAG_TEXT_CORPUS_REPORT_PATH ?? 'rag/processed/reports/text-corpus-status.json',
)
const endpoint = process.env.CLOUDFLARE_RAG_ENDPOINT ?? 'http://localhost:8787/admin/ingest'
const token = process.env.ADMIN_INGEST_TOKEN
const batchSize = Number(process.env.CLOUDFLARE_INGEST_BATCH_SIZE ?? 50)
const ingestRunId = process.env.RAG_INGEST_RUN_ID ?? process.env.RAG_ACTIVE_INGEST_RUN_ID ?? ''

if (!token) {
  console.error('ADMIN_INGEST_TOKEN is required to ingest chunks into Cloudflare Vectorize.')
  process.exitCode = 1
} else if (!existsSync(chunksDir)) {
  console.error(`No chunks directory found at ${chunksDir}. Run npm.cmd run rag:prepare:text first.`)
  process.exitCode = 1
} else {
  const allowedSourceIds = readAllowedSourceIds(manifestPath, textCorpusReportPath)
  const chunks = readChunks(chunksDir).filter((chunk) => allowedSourceIds.has(chunk.sourceId))
  if (chunks.length === 0) {
    console.error(`No chunks found in ${chunksDir}. Run npm.cmd run rag:prepare:text first.`)
    process.exitCode = 1
  } else {
    let inserted = 0
    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunks: batch.map((chunk) => ({
            id: chunk.id,
            text: chunk.text,
            metadata: {
              sourceId: chunk.sourceId,
              title: chunk.title,
              authority: chunk.authority,
              officialUrl: chunk.officialUrl,
              sourceFamily: chunk.sourceFamily,
              ragRole: chunk.ragRole,
              legalStatus: chunk.legalStatus,
              versionDate: chunk.versionDate,
              page: chunk.page ?? '',
              section: chunk.section,
              article: chunk.article,
              checksum: chunk.checksum,
              ingestedAt: chunk.ingestedAt,
              extractionMethod: chunk.extractionMethod ?? '',
              ingestRunId: ingestRunId || chunk.ingestRunId || '',
            },
          })),
        }),
      })

      if (!response.ok) {
        console.error(`Cloudflare ingest failed with HTTP ${response.status}: ${await response.text()}`)
        process.exitCode = 1
        break
      }

      const payload = (await response.json()) as { inserted?: number }
      inserted += payload.inserted ?? batch.length
    }

    if (!process.exitCode) console.log(`Cloudflare Vectorize ingest completed: ${inserted} chunks.`)
  }
}

function readAllowedSourceIds(path: string, reportPath: string): Set<string> {
  if (!existsSync(path)) return new Set()
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as SourceManifest
  const manifestAllowed = new Set(
    manifest.sources
      .filter((source) => source.indexText && source.ragRole !== 'provenance')
      .map((source) => source.id),
  )

  if (!existsSync(reportPath)) return manifestAllowed

  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as CorpusReport
  return new Set(
    report.sources
      .filter(
        (source) =>
          source.status === 'processed' &&
          Boolean(source.chunksPath) &&
          manifestAllowed.has(source.sourceId),
      )
      .map((source) => source.sourceId),
  )
}

function readChunks(directory: string): ChunkRecord[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.jsonl'))
    .sort((left, right) => basename(left, extname(left)).localeCompare(basename(right, extname(right))))
    .flatMap((name) =>
      readFileSync(join(directory, name), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ChunkRecord),
    )
}
