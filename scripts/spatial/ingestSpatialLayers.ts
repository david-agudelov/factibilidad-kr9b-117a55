import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SourceManifest } from '../../src/rag/types.ts'

const manifestPath = resolve(
  process.cwd(),
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as SourceManifest
const datasets = manifest.sources.filter((source) => source.sourceFamily === 'spatial_dataset')

console.log(
  `Spatial ingestion plan: ${datasets.length} official datasets declared. Download raw layers outside public/ and export deterministic facts into data/spatial/facts/.`,
)
console.log(datasets.map((source) => `${source.id}: ${source.officialUrl ?? source.url ?? ''}`).join('\n'))
