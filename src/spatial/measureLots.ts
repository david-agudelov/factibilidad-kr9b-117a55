import type {
  GeoJsonPosition,
  MeasuredLotsSummary,
  MeasuredNeighborhoodLot,
  MeasurementConfidence,
  NeighborhoodFeature,
  NeighborhoodFeatureCollection,
  NeighborhoodGeometry,
  NumericSummary,
} from './types'

type LocalPoint = {
  x: number
  y: number
}

const EARTH_RADIUS_M = 6378137

export function measureNeighborhoodLots(
  collection: NeighborhoodFeatureCollection,
): MeasuredNeighborhoodLot[] {
  return collection.features
    .filter((feature) => isMeasurableGeometry(feature.geometry))
    .map((feature) => measureNeighborhoodLot(feature))
}

export function summarizeMeasuredLots(
  lots: MeasuredNeighborhoodLot[],
): MeasuredLotsSummary {
  return {
    totalLots: lots.length,
    lotsWithoutFloors: lots.filter((lot) => lot.registeredFloors === null).length,
    widthM: summarizeNumbers(lots.map((lot) => lot.widthM)),
    depthM: summarizeNumbers(lots.map((lot) => lot.depthM)),
    floors: summarizeNumbers(
      lots.map((lot) => lot.registeredFloors).filter(isFiniteNumber),
    ),
  }
}

export function addSpaceSyntaxScores(
  lots: MeasuredNeighborhoodLot[],
): MeasuredNeighborhoodLot[] {
  const centroidEntries = lots.map((lot) => ({
    lot,
    lonLat: lot.centroidLonLat ?? getGeometryCentroid(lot.geometry),
  }))
  const origin = getCentroidOrigin(centroidEntries.map((entry) => entry.lonLat))
  const projected = centroidEntries.map((entry) =>
    projectLonLatPoint(entry.lonLat, origin.lon, origin.lat),
  )
  const streetCounts = countStreetKeys(lots)
  const integrationRaw = projected.map((point, index) =>
    inverseAverageDistance(point, projected, index, 24),
  )
  const integrationScores = normalizeScores(integrationRaw)
  const choiceRaw = lots.map((lot, index) => {
    const streetKey = getStreetKey(lot.address)
    const corridorDensity = Math.log1p(streetCounts.get(streetKey) ?? 1)
    return corridorDensity * 0.7 + integrationScores[index] * 0.3
  })
  const choiceScores = normalizeScores(choiceRaw)

  return lots.map((lot, index) => {
    const integrationScore = roundTo(integrationScores[index])
    const choiceScore = roundTo(choiceScores[index])
    const spaceSyntaxScore = roundTo(integrationScore * 0.6 + choiceScore * 0.4)

    return {
      ...lot,
      centroidLonLat: [
        roundTo(centroidEntries[index].lonLat[0], 8),
        roundTo(centroidEntries[index].lonLat[1], 8),
      ],
      integrationScore,
      choiceScore,
      spaceSyntaxScore,
      syntaxConfidence: 'medium',
    }
  })
}

export function measuredLotsToFeatureCollection(
  lots: MeasuredNeighborhoodLot[],
): NeighborhoodFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: lots.map((lot) => ({
      type: 'Feature',
      id: lot.id,
      geometry: lot.geometry,
      properties: {
        sourceObjectId: lot.sourceProperties.OBJECTID ?? null,
        useGroup: lot.sourceProperties.USO_REAL_CATASTRAL_GRUPO ?? 'Sin dato',
        normativeUse: lot.sourceProperties.USO_NORMATIVO_POT ?? 'Sin cruce',
        lotCode: lot.lotCode,
        address: lot.address,
        isStudyLot: lot.isStudyLot,
        areaM2: lot.areaM2,
        perimeterM: lot.perimeterM,
        widthM: roundTo(lot.widthM, 2),
        depthM: roundTo(lot.depthM, 2),
        registeredFloors: lot.registeredFloors,
        measurementConfidence: lot.measurementConfidence,
        centroidLonLat: lot.centroidLonLat ?? null,
        integrationScore: lot.integrationScore ?? null,
        choiceScore: lot.choiceScore ?? null,
        spaceSyntaxScore: lot.spaceSyntaxScore ?? null,
        syntaxConfidence: lot.syntaxConfidence ?? 'medium',
      },
    })),
  }
}

export function measuredLotsFromFeatureCollection(
  collection: NeighborhoodFeatureCollection,
): MeasuredNeighborhoodLot[] {
  return collection.features.map((feature) => {
    const properties = feature.properties
    return {
      id: String(feature.id ?? properties.lotCode ?? properties.CODIGO_LOTE ?? ''),
      lotCode: String(properties.lotCode ?? properties.CODIGO_LOTE ?? ''),
      address: String(properties.address ?? properties.DIRECCION ?? 'Sin direccion'),
      isStudyLot: Boolean(properties.isStudyLot ?? properties.LOTE_ESTUDIO),
      areaM2: nullableNumber(properties.areaM2 ?? properties['SHAPE.AREA']),
      perimeterM: nullableNumber(properties.perimeterM ?? properties['SHAPE.LEN']),
      widthM: numberOrZero(properties.widthM),
      depthM: numberOrZero(properties.depthM),
      registeredFloors: nullableNumber(
        properties.registeredFloors ?? properties.PISOS_CONSTRUIDOS_MAX,
      ),
      measurementConfidence: parseConfidence(properties.measurementConfidence),
      centroidLonLat: parseCentroid(properties.centroidLonLat),
      integrationScore: nullableNumber(properties.integrationScore),
      choiceScore: nullableNumber(properties.choiceScore),
      spaceSyntaxScore: nullableNumber(properties.spaceSyntaxScore),
      syntaxConfidence: parseConfidence(properties.syntaxConfidence),
      geometry: feature.geometry,
      sourceProperties: properties,
    }
  })
}

function measureNeighborhoodLot(feature: NeighborhoodFeature): MeasuredNeighborhoodLot {
  const primaryRing = getPrimaryRing(feature.geometry)
  const dimensions = measureRingDimensions(primaryRing)
  const widthM = roundTo(dimensions.width, 2)
  const depthM = roundTo(dimensions.depth, 2)
  const areaM2 = nullableNumber(feature.properties['SHAPE.AREA'])
  const perimeterM = nullableNumber(feature.properties['SHAPE.LEN'])
  const confidence = getMeasurementConfidence(widthM, depthM, areaM2)

  return {
    id: String(feature.id ?? feature.properties.OBJECTID ?? feature.properties.CODIGO_LOTE ?? ''),
    lotCode: String(feature.properties.CODIGO_LOTE ?? ''),
    address: String(feature.properties.DIRECCION ?? 'Sin direccion'),
    isStudyLot: Boolean(feature.properties.LOTE_ESTUDIO),
    areaM2,
    perimeterM,
    widthM,
    depthM,
    registeredFloors: nullableNumber(feature.properties.PISOS_CONSTRUIDOS_MAX),
    measurementConfidence: confidence,
    centroidLonLat: getGeometryCentroid(feature.geometry),
    geometry: feature.geometry,
    sourceProperties: feature.properties,
  }
}

function measureRingDimensions(ring: GeoJsonPosition[]) {
  const points = removeClosingPoint(ring)
  if (points.length < 3) return { width: 0, depth: 0 }

  const projected = projectLonLatRing(points)
  return minimumRotatedRectangle(projected)
}

function projectLonLatRing(ring: GeoJsonPosition[]): LocalPoint[] {
  const originLon = ring.reduce((total, point) => total + point[0], 0) / ring.length
  const originLat = ring.reduce((total, point) => total + point[1], 0) / ring.length
  const originLatRadians = degreesToRadians(originLat)

  return ring.map(([lon, lat]) => ({
    x: degreesToRadians(lon - originLon) * EARTH_RADIUS_M * Math.cos(originLatRadians),
    y: degreesToRadians(lat - originLat) * EARTH_RADIUS_M,
  }))
}

function projectLonLatPoint(
  [lon, lat]: [number, number],
  originLon: number,
  originLat: number,
): LocalPoint {
  const originLatRadians = degreesToRadians(originLat)

  return {
    x: degreesToRadians(lon - originLon) * EARTH_RADIUS_M * Math.cos(originLatRadians),
    y: degreesToRadians(lat - originLat) * EARTH_RADIUS_M,
  }
}

function minimumRotatedRectangle(points: LocalPoint[]) {
  const hull = convexHull(points)
  if (hull.length < 2) return { width: 0, depth: 0 }

  let best = {
    area: Number.POSITIVE_INFINITY,
    width: 0,
    depth: 0,
  }

  for (let index = 0; index < hull.length; index += 1) {
    const current = hull[index]
    const next = hull[(index + 1) % hull.length]
    const angle = Math.atan2(next.y - current.y, next.x - current.x)
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const point of hull) {
      const x = point.x * cos - point.y * sin
      const y = point.x * sin + point.y * cos
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    const sideA = maxX - minX
    const sideB = maxY - minY
    const area = sideA * sideB

    if (area < best.area) {
      best = {
        area,
        width: Math.min(sideA, sideB),
        depth: Math.max(sideA, sideB),
      }
    }
  }

  return best
}

function convexHull(points: LocalPoint[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const lower: LocalPoint[] = []
  const upper: LocalPoint[] = []

  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop()
    }
    lower.push(point)
  }

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop()
    }
    upper.push(point)
  }

  return lower.slice(0, -1).concat(upper.slice(0, -1))
}

function cross(origin: LocalPoint, a: LocalPoint, b: LocalPoint) {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)
}

function getPrimaryRing(geometry: NeighborhoodGeometry): GeoJsonPosition[] {
  if (geometry.type === 'Polygon') return geometry.coordinates[0] ?? []

  let largestRing: GeoJsonPosition[] = []
  let largestPointCount = 0

  for (const polygon of geometry.coordinates) {
    const ring = polygon[0] ?? []
    if (ring.length > largestPointCount) {
      largestRing = ring
      largestPointCount = ring.length
    }
  }

  return largestRing
}

function getGeometryCentroid(geometry: NeighborhoodGeometry): [number, number] {
  const ring = removeClosingPoint(getPrimaryRing(geometry))
  if (!ring.length) return [0, 0]
  const totals = ring.reduce(
    (current, point) => ({
      lon: current.lon + point[0],
      lat: current.lat + point[1],
    }),
    { lon: 0, lat: 0 },
  )

  return [totals.lon / ring.length, totals.lat / ring.length]
}

function getCentroidOrigin(centroids: Array<[number, number]>) {
  const safeCentroids = centroids.filter(
    ([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat),
  )
  if (!safeCentroids.length) return { lon: 0, lat: 0 }
  const totals = safeCentroids.reduce(
    (current, [lon, lat]) => ({
      lon: current.lon + lon,
      lat: current.lat + lat,
    }),
    { lon: 0, lat: 0 },
  )

  return {
    lon: totals.lon / safeCentroids.length,
    lat: totals.lat / safeCentroids.length,
  }
}

function inverseAverageDistance(
  point: LocalPoint,
  points: LocalPoint[],
  ownIndex: number,
  neighborCount: number,
) {
  const distances = points
    .map((candidate, index) =>
      index === ownIndex
        ? Number.POSITIVE_INFINITY
        : Math.hypot(candidate.x - point.x, candidate.y - point.y),
    )
    .filter((distance) => Number.isFinite(distance) && distance > 0)
    .sort((a, b) => a - b)
  const nearest = distances.slice(0, neighborCount)
  if (!nearest.length) return 0
  const averageDistance =
    nearest.reduce((total, distance) => total + distance, 0) / nearest.length

  return 1 / averageDistance
}

function normalizeScores(values: number[]) {
  const finiteValues = values.filter(isFiniteNumber)
  if (!finiteValues.length) return values.map(() => 0)
  const min = Math.min(...finiteValues)
  const max = Math.max(...finiteValues)
  if (max === min) return values.map(() => 50)

  return values.map((value) => {
    if (!Number.isFinite(value)) return 0
    return ((value - min) / (max - min)) * 100
  })
}

function countStreetKeys(lots: MeasuredNeighborhoodLot[]) {
  const counts = new Map<string, number>()

  lots.forEach((lot) => {
    const key = getStreetKey(lot.address)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  return counts
}

function getStreetKey(address: string) {
  const normalized = address
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replaceAll(/\s+/g, ' ')
    .trim()
  const match = normalized.match(/^(KR|CL|AC|AK|DG|TV|AV)\s+\d+\s?[A-Z]?/)

  return match?.[0] ?? normalized.split(' ').slice(0, 3).join(' ')
}

function removeClosingPoint(ring: GeoJsonPosition[]) {
  if (ring.length < 2) return ring
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) return ring.slice(0, -1)
  return ring
}

function summarizeNumbers(values: number[]): NumericSummary {
  const sorted = values.filter(isFiniteNumber).sort((a, b) => a - b)

  if (!sorted.length) {
    return { min: 0, p10: 0, median: 0, p90: 0, max: 0 }
  }

  return {
    min: roundTo(percentile(sorted, 0), 2),
    p10: roundTo(percentile(sorted, 0.1), 2),
    median: roundTo(percentile(sorted, 0.5), 2),
    p90: roundTo(percentile(sorted, 0.9), 2),
    max: roundTo(percentile(sorted, 1), 2),
  }
}

function percentile(sorted: number[], ratio: number) {
  const safeRatio = Math.min(Math.max(ratio, 0), 1)
  const index = Math.floor((sorted.length - 1) * safeRatio)
  return sorted[index]
}

function getMeasurementConfidence(
  widthM: number,
  depthM: number,
  areaM2: number | null,
): MeasurementConfidence {
  if (widthM > 0 && depthM > 0 && areaM2 !== null) return 'high'
  if (widthM > 0 && depthM > 0) return 'medium'
  return 'low'
}

function isMeasurableGeometry(geometry: NeighborhoodGeometry) {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function numberOrZero(value: unknown) {
  return nullableNumber(value) ?? 0
}

function parseConfidence(value: unknown): MeasurementConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return 'low'
}

function parseCentroid(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined
  const lon = Number(value[0])
  const lat = Number(value[1])
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return undefined
  return [lon, lat]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}
