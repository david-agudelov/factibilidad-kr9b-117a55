import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateSpatialFacts } from '../../src/rag/spatialFacts.ts'
import type { ParcelSpatialFacts } from '../../src/rag/types.ts'

const caseId = process.argv[2] ?? 'KR9B_117A55'
const factsPath = resolve(
  process.cwd(),
  process.env.RAG_SPATIAL_FACTS_PATH ?? 'data/spatial/facts',
  `${caseId}.json`,
)
const manifestPath = resolve(
  process.cwd(),
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const facts = JSON.parse(readFileSync(factsPath, 'utf8')) as ParcelSpatialFacts
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { sources: Array<{ id: string }> }
const result = validateSpatialFacts(facts, {
  declaredSourceIds: new Set(manifest.sources.map((source) => source.id)),
})

if (!result.isValid) {
  console.error(result.errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Spatial facts OK for ${facts.parcelId}: ${result.factCount} facts.`)
}
