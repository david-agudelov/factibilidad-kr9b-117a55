import type {
  HeatBucket,
  HeatmapParams,
  LotHeatBreakdown,
  LotHeatScore,
  MeasuredNeighborhoodLot,
  UrbanHeatMode,
} from './types'

const BUCKET_STYLES: Record<HeatBucket, { color: string; label: string }> = {
  low: { color: '#d9e2ec', label: 'Bajo' },
  near: { color: '#fed976', label: 'Cerca' },
  partial: { color: '#fd8d3c', label: 'Cumple parcial' },
  hot: { color: '#d7301f', label: 'Cumple bien' },
}

const SIMILARITY_TOLERANCE = {
  width: 0.1,
  depth: 0.12,
  floors: 0.18,
}

export function computeLotHeatScore(
  lot: MeasuredNeighborhoodLot,
  params: HeatmapParams,
): LotHeatScore {
  const widthRatio = safeRatio(lot.widthM, params.targetWidthM)
  const depthRatio = safeRatio(lot.depthM, params.targetDepthM)
  const floorValue = lot.registeredFloors
  const hasFloors = floorValue !== null
  const floorRatio = floorValue === null ? null : safeRatio(floorValue, params.targetFloors)
  const widthScore = similarityScore(lot.widthM, params.targetWidthM, SIMILARITY_TOLERANCE.width)
  const depthScore = similarityScore(lot.depthM, params.targetDepthM, SIMILARITY_TOLERANCE.depth)
  const floorScore =
    floorValue === null
      ? 0
      : similarityScore(floorValue, params.targetFloors, SIMILARITY_TOLERANCE.floors)
  const matchedCriteria = [widthScore, depthScore, floorScore].filter(
    (scoreValue) => scoreValue >= 0.65,
  ).length
  let score = Math.round((widthScore * 0.35 + depthScore * 0.35 + floorScore * 0.3) * 100)

  if (!hasFloors) {
    score = Math.min(score, 39)
  }

  const bucket = bucketForScore(score)
  const style = BUCKET_STYLES[bucket]

  return {
    score,
    bucket,
    color: style.color,
    label: style.label,
    matchedCriteria,
    reasons: buildReasons(bucket, hasFloors),
    breakdown: {
      profileScore: score,
      spaceSyntaxScore: normalizedScore(lot.spaceSyntaxScore),
      combinedScore: score,
      profileWeight: 1,
      spaceSyntaxWeight: 0,
    },
    ratios: {
      width: roundTo(widthRatio, 2),
      depth: roundTo(depthRatio, 2),
      floors: floorRatio === null ? null : roundTo(floorRatio, 2),
    },
  }
}

export function computeUrbanHeatScore(
  lot: MeasuredNeighborhoodLot,
  params: HeatmapParams,
  mode: UrbanHeatMode,
): LotHeatScore {
  const profile = computeLotHeatScore(lot, params)
  const spaceSyntaxScore = normalizedScore(lot.spaceSyntaxScore)
  const combinedScore = Math.round(spaceSyntaxScore * 0.65 + profile.score * 0.35)
  const selectedScore =
    mode === 'syntax'
      ? spaceSyntaxScore
      : mode === 'combined'
        ? combinedScore
        : profile.score
  const bucket = bucketForScore(selectedScore)
  const style = BUCKET_STYLES[bucket]
  const breakdown: LotHeatBreakdown = {
    profileScore: profile.score,
    spaceSyntaxScore,
    combinedScore,
    profileWeight: mode === 'combined' ? 0.35 : mode === 'profile' ? 1 : 0,
    spaceSyntaxWeight: mode === 'combined' ? 0.65 : mode === 'syntax' ? 1 : 0,
  }

  return {
    ...profile,
    score: selectedScore,
    mode,
    bucket,
    color: style.color,
    label: labelForUrbanMode(mode, style.label),
    breakdown,
    reasons: buildUrbanReasons(mode, profile, spaceSyntaxScore),
  }
}

export function summarizeHeatScores(
  lots: MeasuredNeighborhoodLot[],
  params: HeatmapParams,
) {
  const scores = lots.map((lot) => computeLotHeatScore(lot, params))

  return {
    total: lots.length,
    hot: scores.filter((score) => score.bucket === 'hot').length,
    partial: scores.filter((score) => score.bucket === 'partial').length,
    near: scores.filter((score) => score.bucket === 'near').length,
    low: scores.filter((score) => score.bucket === 'low').length,
    withoutFloors: lots.filter((lot) => lot.registeredFloors === null).length,
  }
}

export function summarizeUrbanHeatScores(
  lots: MeasuredNeighborhoodLot[],
  params: HeatmapParams,
  mode: UrbanHeatMode,
) {
  const scores = lots.map((lot) => computeUrbanHeatScore(lot, params, mode))

  return {
    total: lots.length,
    hot: scores.filter((score) => score.bucket === 'hot').length,
    partial: scores.filter((score) => score.bucket === 'partial').length,
    near: scores.filter((score) => score.bucket === 'near').length,
    low: scores.filter((score) => score.bucket === 'low').length,
    withoutFloors: lots.filter((lot) => lot.registeredFloors === null).length,
  }
}

function safeRatio(value: number, minimum: number) {
  if (!Number.isFinite(value) || !Number.isFinite(minimum) || minimum <= 0) return 0
  return value / minimum
}

function similarityScore(value: number, target: number, tolerance: number) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return 0
  const relativeDifference = Math.abs(value - target) / target
  return Math.exp(-((relativeDifference / tolerance) ** 2))
}

function bucketForScore(score: number): HeatBucket {
  if (score >= 80) return 'hot'
  if (score >= 60) return 'partial'
  if (score >= 40) return 'near'
  return 'low'
}

function buildReasons(bucket: HeatBucket, hasFloors: boolean) {
  const reasons: string[] = []

  if (!hasFloors) {
    reasons.push('Sin dato de pisos; no puede comparar el perfil completo.')
  }

  if (bucket === 'hot') {
    reasons.push('Muy parecido al perfil objetivo.')
  } else if (bucket === 'partial') {
    reasons.push('Se acerca, pero tiene alguna diferencia.')
  } else if (bucket === 'near') {
    reasons.push('Parecido parcial.')
  } else {
    reasons.push('Lejos del perfil objetivo.')
  }

  return reasons
}

function buildUrbanReasons(
  mode: UrbanHeatMode,
  profile: LotHeatScore,
  spaceSyntaxScore: number,
) {
  if (mode === 'profile') return profile.reasons

  const reasons: string[] = []

  if (mode === 'syntax') {
    reasons.push(
      spaceSyntaxScore >= 70
        ? 'Alta accesibilidad urbana preliminar tipo Space Syntax.'
        : 'Accesibilidad urbana preliminar media o baja.',
    )
    return reasons
  }

  reasons.push('Mezcla 65% accesibilidad urbana y 35% parecido al perfil objetivo.')
  reasons.push(...profile.reasons)
  return reasons
}

function labelForUrbanMode(mode: UrbanHeatMode, bucketLabel: string) {
  if (mode === 'syntax') return `${bucketLabel} por accesibilidad`
  if (mode === 'combined') return `${bucketLabel} combinado`
  return bucketLabel
}

function normalizedScore(value: unknown) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.round(Math.min(Math.max(numericValue, 0), 100))
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}
