import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { extractGeoJsonConst } from '../../src/spatial/extractNeighborhoodLots.ts'
import {
  addSpaceSyntaxScores,
  measuredLotsToFeatureCollection,
  measureNeighborhoodLots,
  summarizeMeasuredLots,
} from '../../src/spatial/measureLots.ts'

const inputPath = resolve(process.cwd(), 'public/static/mapa-barrio/index.html')
const outputPath = resolve(
  process.cwd(),
  'public/static/mapa-barrio/neighborhood-lots.measured.geojson',
)
const summaryPath = resolve(
  process.cwd(),
  'public/static/mapa-barrio/neighborhood-lots.summary.json',
)

const html = readFileSync(inputPath, 'utf8')
const sourceLots = extractGeoJsonConst(html, 'lots')
const measuredLots = addSpaceSyntaxScores(measureNeighborhoodLots(sourceLots))
const measuredCollection = measuredLotsToFeatureCollection(measuredLots)
const summary = summarizeMeasuredLots(measuredLots)

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(
  outputPath,
  `${JSON.stringify(measuredCollection)}\n`,
  'utf8',
)
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

console.log(
  `Measured ${summary.totalLots} neighborhood lots. ` +
    `Study lot width/depth: ${
      measuredLots.find((lot) => lot.isStudyLot)?.widthM ?? 'n/a'
    }m x ${measuredLots.find((lot) => lot.isStudyLot)?.depthM ?? 'n/a'}m.`,
)
