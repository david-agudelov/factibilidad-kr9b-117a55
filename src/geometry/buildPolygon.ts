import { SITE_CONSTANTS } from '../model/projectSource'
import type { ModelGeometry, ModelParams, Point } from '../model/types'
import { computeNormativeEnvelope } from '../norms/computeFloorLimit'
import {
  boundingBox,
  makeRectangle,
  polygonArea,
  roundTo,
} from './polygonMath'

function makeOfficialLot(): Point[] {
  const rectangleArea = SITE_CONSTANTS.width * SITE_CONSTANTS.depth
  const topLeftInset = Math.max(
    0,
    (2 * (rectangleArea - SITE_CONSTANTS.area)) / SITE_CONSTANTS.depth,
  )

  return [
    { x: 0, y: 0 },
    { x: SITE_CONSTANTS.width, y: 0 },
    { x: SITE_CONSTANTS.width, y: SITE_CONSTANTS.depth },
    { x: topLeftInset, y: SITE_CONSTANTS.depth },
  ]
}

export function buildPolygon(params: ModelParams): ModelGeometry {
  const envelope = computeNormativeEnvelope(params)
  const usableDepth = Math.max(0, SITE_CONSTANTS.depth - envelope.rearSetback)
  const upperWidth = Math.max(
    0,
    SITE_CONSTANTS.width - envelope.sideSetbackApplied * 2,
  )

  const lot = makeOfficialLot()
  const lowerFootprint = makeRectangle(0, 0, SITE_CONSTANTS.width, usableDepth)
  const upperFootprint = makeRectangle(
    envelope.sideSetbackApplied,
    0,
    upperWidth,
    usableDepth,
  )
  const courtyard: Point[] = []
  const grossLowerFootprintArea = polygonArea(lowerFootprint)
  const grossUpperFootprintArea = polygonArea(upperFootprint)
  const netLowerFootprintArea = roundTo(grossLowerFootprintArea, 2)
  const netUpperFootprintArea = roundTo(grossUpperFootprintArea, 2)

  return {
    lot,
    lowerFootprint,
    upperFootprint,
    courtyard,
    boundingBox: boundingBox(lot),
    effectiveRearSetback: envelope.rearSetback,
    lateralOnsetHeight: envelope.lateralOnsetHeight,
    lowerFloors: envelope.lowerFloors,
    upperFloors: envelope.upperFloors,
    grossLowerFootprintArea,
    grossUpperFootprintArea,
    netLowerFootprintArea,
    netUpperFootprintArea,
    builtArea: roundTo(
      envelope.lowerFloors * netLowerFootprintArea +
        envelope.upperFloors * netUpperFootprintArea,
      2,
    ),
  }
}

export function polygonToSvgPoints(points: Point[], scale: number) {
  return points.map((point) => `${point.x * scale},${point.y * scale}`).join(' ')
}
