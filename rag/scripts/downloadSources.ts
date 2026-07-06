import { resolve } from 'node:path'
import { downloadSources, printReportSummary, readManifest } from './ingestionCore.ts'

const workspaceRoot = process.cwd()
const manifestPath = resolve(
  workspaceRoot,
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const ragRoot = resolve(workspaceRoot, process.env.RAG_ROOT ?? 'rag')
const dryRun = process.argv.includes('--dry-run')
const manifest = readManifest(manifestPath)
const ingestedAt = new Date().toISOString()

const report = await downloadSources({
  manifest,
  workspaceRoot,
  ragRoot,
  ingestedAt,
  dryRun,
})

printReportSummary(dryRun ? 'RAG download dry run' : 'RAG download', report)
