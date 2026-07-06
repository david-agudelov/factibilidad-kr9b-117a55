import { roundTo } from '../geometry/polygonMath'
import { NORMATIVE_RULES, SITE_CONSTANTS } from '../model/projectSource'
import type { FloorLimit, ModelParams, NormativeEnvelope } from '../model/types'

type FloorLimitOptions = {
  iceIndex?: number
}

export function normativeRearSetback(totalHeight: number) {
  const band = NORMATIVE_RULES.rearSetbackBands.find(
    (rule) => totalHeight <= rule.maxHeight,
  )

  return band?.setback ?? 6
}

export function getLateralOnsetHeight(params: ModelParams) {
  return params.ecosMode
    ? NORMATIVE_RULES.ecosLateralOnsetHeight
    : NORMATIVE_RULES.baseLateralOnsetHeight
}

export function floorsWithoutLateral(params: ModelParams) {
  const onset = getLateralOnsetHeight(params)
  return Math.max(0, Math.floor(onset / params.floorHeight))
}

function lateralHeightSplit(params: ModelParams, totalHeight: number) {
  const onset = getLateralOnsetHeight(params)
  const rawLowerFloors = onset / params.floorHeight
  const crossesOnset = totalHeight > onset
  const lateralOnsetCutsFloor =
    crossesOnset && Math.abs(rawLowerFloors - Math.round(rawLowerFloors)) > 0.0001
  const lowerFloorEquivalent = crossesOnset
    ? Math.min(params.floors, Math.floor(rawLowerFloors))
    : params.floors
  const upperFloorEquivalent = crossesOnset
    ? Math.max(0, params.floors - lowerFloorEquivalent)
    : 0
  const lowerHeight = roundTo(lowerFloorEquivalent * params.floorHeight, 2)
  const upperHeight = roundTo(upperFloorEquivalent * params.floorHeight, 2)

  return {
    lowerHeight,
    upperHeight,
    lowerFloorEquivalent,
    upperFloorEquivalent,
    lateralOnsetCutsFloor,
    lateralTransitionFloor: crossesOnset ? lowerFloorEquivalent + 1 : null,
    lowerFloors: lowerFloorEquivalent,
    upperFloors: upperFloorEquivalent,
  }
}

function sideSetbackForHeight(params: ModelParams, totalHeight: number) {
  if (totalHeight <= getLateralOnsetHeight(params)) return 0

  return Math.max(
    NORMATIVE_RULES.minSideSetback,
    roundTo((totalHeight - getLateralOnsetHeight(params)) / 5, 2),
  )
}

export function effectiveAreaForFloors(
  params: ModelParams,
  floors: number,
  options: FloorLimitOptions = {},
) {
  const totalHeight = roundTo(floors * params.floorHeight, 2)
  const rear = normativeRearSetback(totalHeight)
  const usableDepth = Math.max(0, SITE_CONSTANTS.depth - rear)
  const sideSetback = sideSetbackForHeight(params, totalHeight)
  const lowerArea = Math.max(0, SITE_CONSTANTS.width * usableDepth)
  const upperWidth = Math.max(0, SITE_CONSTANTS.width - sideSetback * 2)
  const upperArea = Math.max(0, upperWidth * usableDepth)
  const split = lateralHeightSplit({ ...params, floors }, totalHeight)
  const iceIndex = options.iceIndex ?? SITE_CONSTANTS.iceIndex

  return {
    totalHeight,
    rear,
    lowerHeight: split.lowerHeight,
    upperHeight: split.upperHeight,
    lowerFloorEquivalent: split.lowerFloorEquivalent,
    upperFloorEquivalent: split.upperFloorEquivalent,
    lateralOnsetCutsFloor: split.lateralOnsetCutsFloor,
    lateralTransitionFloor: split.lateralTransitionFloor,
    lowerFloors: split.lowerFloors,
    upperFloors: split.upperFloors,
    lowerNet: roundTo(lowerArea, 2),
    upperNet: roundTo(upperArea, 2),
    upperWidth,
    sideSetback,
    iceLimit: roundTo(SITE_CONSTANTS.area * iceIndex, 2),
    effectiveArea: roundTo(
      split.lowerFloorEquivalent * lowerArea +
        split.upperFloorEquivalent * upperArea,
      2,
    ),
  }
}

export function computeFloorLimit(
  params: ModelParams,
  options: FloorLimitOptions = {},
): FloorLimit {
  const minFloors = NORMATIVE_RULES.minFloors
  const heightMax = Math.max(
    minFloors,
    Math.floor(NORMATIVE_RULES.preliminaryMaxHeight / params.floorHeight),
  )
  let maxFloors = minFloors
  const limitingFactors = new Set<string>()

  for (let floors = minFloors; floors <= heightMax; floors += 1) {
    const candidate = effectiveAreaForFloors(params, floors, options)
    const hasUsefulLower = candidate.lowerNet > 0
    const hasUsefulUpper =
      candidate.upperFloors === 0 ||
      (candidate.upperNet > 0 &&
        candidate.upperWidth >= NORMATIVE_RULES.minUsefulUpperWidth)
    const fitsIce = candidate.effectiveArea <= candidate.iceLimit

    if (hasUsefulLower && hasUsefulUpper && fitsIce) {
      maxFloors = floors
      continue
    }

    if (!fitsIce) limitingFactors.add('ICe maximo')
    if (!hasUsefulLower || !hasUsefulUpper) {
      limitingFactors.add('Geometria util')
    }
    break
  }

  if (heightMax === maxFloors) {
    limitingFactors.add('Altura normativa preliminar')
  }

  const current = effectiveAreaForFloors(params, params.floors, options)

  return {
    minFloors,
    maxFloors,
    lateralOnsetHeight: getLateralOnsetHeight(params),
    limitingFactors: Array.from(limitingFactors),
    maxEffectiveAreaBeforeLimit: current.effectiveArea,
  }
}

export function computeNormativeEnvelope(params: ModelParams): NormativeEnvelope {
  const totalHeight = roundTo(params.floors * params.floorHeight, 2)
  const floorLimit = computeFloorLimit(params)
  const area = effectiveAreaForFloors(params, params.floors)
  const status =
    params.floors >= 8
      ? 'requiere confirmacion'
      : params.floors >= 6 || params.ecosMode || area.lateralOnsetCutsFloor
        ? 'condicionado'
        : 'preliminar viable'

  return {
    totalHeight,
    rearSetback: area.rear,
    lateralOnsetHeight: floorLimit.lateralOnsetHeight,
    sideSetbackApplied: area.sideSetback,
    lowerHeight: area.lowerHeight,
    upperHeight: area.upperHeight,
    lowerFloorEquivalent: area.lowerFloorEquivalent,
    upperFloorEquivalent: area.upperFloorEquivalent,
    lateralOnsetCutsFloor: area.lateralOnsetCutsFloor,
    lateralTransitionFloor: area.lateralTransitionFloor,
    lowerFloors: area.lowerFloors,
    upperFloors: area.upperFloors,
    maxFloors: floorLimit.maxFloors,
    minFloors: floorLimit.minFloors,
    iceLimit: area.iceLimit,
    sellableEfficiency: params.sellableEfficiency,
    limitingFactors: floorLimit.limitingFactors,
    normativeWarnings: NORMATIVE_RULES.pendingConfirmations,
    status,
  }
}
