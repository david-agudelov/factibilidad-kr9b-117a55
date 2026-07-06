import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { selectRagEligibleSourceIds } from '../../server/rag/fileSearch.ts'
import type { SourceManifest } from '../../src/rag/types.ts'

const manifestPath = resolve(
  process.cwd(),
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as SourceManifest
const chunksDir = resolve(process.cwd(), process.env.RAG_CHUNKS_DIR ?? 'rag/processed/chunks')
const sourceIds = selectRagEligibleSourceIds(manifest.sources, {
  chunkedSourceIds: readChunkedSourceIds(chunksDir),
})

if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_VECTOR_STORE_ID) {
  console.log(
    `Dry run: ${sourceIds.length} document sources ready for File Search ingestion. Set OPENAI_API_KEY and OPENAI_VECTOR_STORE_ID on the server to upload.`,
  )
  console.log(sourceIds.join('\n'))
} else {
  console.log(
    `Ready to ingest ${sourceIds.length} sources into vector store ${process.env.OPENAI_VECTOR_STORE_ID}. Upload execution is intentionally kept server-side and should be reviewed before enabling network writes.`,
  )
}

function readChunkedSourceIds(directory: string): Set<string> | undefined {
  if (!existsSync(directory)) return undefined
  return new Set(
    readdirSync(directory)
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) => basename(name, extname(name))),
  )
}
