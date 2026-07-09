import type { NeighborhoodFeatureCollection } from './types'

export function extractGeoJsonConst(
  sourceText: string,
  constName: string,
): NeighborhoodFeatureCollection {
  const startToken = `const ${constName} = `
  const start = sourceText.indexOf(startToken)

  if (start < 0) {
    throw new Error(`Could not find const ${constName} in source text.`)
  }

  const objectStart = start + startToken.length
  let depth = 0
  let inString = false
  let escaped = false
  let end = -1

  for (let index = objectStart; index < sourceText.length; index += 1) {
    const char = sourceText[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{' || char === '[') {
      depth += 1
    } else if (char === '}' || char === ']') {
      depth -= 1
      if (depth === 0) {
        end = index + 1
        break
      }
    }
  }

  if (end < 0) {
    throw new Error(`Could not parse const ${constName}; object was not closed.`)
  }

  const parsed = JSON.parse(sourceText.slice(objectStart, end)) as unknown

  if (!isFeatureCollection(parsed)) {
    throw new Error(`Const ${constName} is not a GeoJSON FeatureCollection.`)
  }

  return parsed
}

function isFeatureCollection(value: unknown): value is NeighborhoodFeatureCollection {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<NeighborhoodFeatureCollection>
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features)
}
