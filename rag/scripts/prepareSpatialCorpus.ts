import { resolve } from 'node:path'
import { printReportSummary, readManifest, writeSpatialCorpus } from './ingestionCore.ts'

const workspaceRoot = process.cwd()
const manifestPath = resolve(
  workspaceRoot,
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const ragRoot = resolve(workspaceRoot, process.env.RAG_ROOT ?? 'rag')
const manifest = readManifest(manifestPath)
const ingestedAt = new Date().toISOString()

const report = await writeSpatialCorpus({
  manifest,
  workspaceRoot,
  ragRoot,
  ingestedAt,
})

printReportSummary('RAG spatial corpus', report)
