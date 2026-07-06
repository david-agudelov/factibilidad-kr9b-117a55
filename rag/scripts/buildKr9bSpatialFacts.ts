import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const workspaceRoot = process.cwd()
const configPath = resolve(workspaceRoot, 'rag/spatial/layers.config.json')
const manifestPath = resolve(
  workspaceRoot,
  process.env.RAG_SOURCE_MANIFEST_PATH ?? 'rag/sources/sources.manifest.json',
)
const outputPath = resolve(
  workspaceRoot,
  process.env.RAG_SPATIAL_FACTS_PATH ?? 'data/spatial/facts/KR9B_117A55.json',
)
const enginePath = resolve(workspaceRoot, 'rag/spatial/overlayEngine.py')

const python = findPython()

const output = execFileSync(
  python.command,
  [
    ...python.args,
    enginePath,
    '--config',
    configPath,
    '--manifest',
    manifestPath,
    '--output',
    outputPath,
  ],
  {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  },
)

console.log(output.trim())

function findPython(): { command: string; args: string[] } {
  const configured = process.env.RAG_SPATIAL_PYTHON_BIN || process.env.PYTHON
  const candidates = [
    ...(configured ? [{ command: configured, args: [] as string[] }] : []),
    { command: 'python', args: [] as string[] },
    { command: 'py', args: ['-3'] },
    { command: 'python3', args: [] as string[] },
  ]
  const errors: string[] = []

  for (const candidate of candidates) {
    try {
      execFileSync(candidate.command, [...candidate.args, '--version'], {
        cwd: workspaceRoot,
        stdio: 'ignore',
      })
      if (!existsSync(enginePath)) {
        throw new Error(`Missing spatial engine: ${enginePath}`)
      }
      return candidate
    } catch (error) {
      errors.push(`${candidate.command}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new Error(`No Python executable found for spatial facts.\n${errors.join('\n')}`)
}
