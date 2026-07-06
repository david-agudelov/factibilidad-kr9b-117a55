import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateSourceManifest } from '../../src/rag/sourceManifest.ts'
import type { SourceManifest } from '../../src/rag/types.ts'

const manifestPath = resolve(
  process.cwd(),
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as SourceManifest
const existingLocalPaths = manifest.sources
  .map((source) => source.localPath)
  .filter((localPath): localPath is string => Boolean(localPath))
  .filter((localPath) => existsSync(resolve(process.cwd(), localPath)))
const result = validateSourceManifest(manifest, { existingLocalPaths })

if (!result.isValid) {
  console.error(result.errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `Manifest OK: ${result.sourceCount} sources, ${result.ragEligibleCount} RAG document sources.`,
  )
}
