import { boundingBox, roundTo } from '../geometry/polygonMath'
import type {
  FunctionalEnvelope,
  FunctionalStatus,
  ModelGeometry,
  ModelParams,
  NormativeEnvelope,
} from '../model/types'
import { FUNCTIONAL_RULES, getCoreOption } from '../config/coreOptions'

function usableAreaPerFloor(footprintArea: number, coreArea: number) {
  return roundTo(Math.max(0, footprintArea - coreArea), 2)
}

function resolveStatus(messages: string[], hasError: boolean): FunctionalStatus {
  if (hasError) return 'no-viable'
  if (messages.length > 0) return 'condicionado'
  return 'viable'
}

export function computeFunctionalEnvelope(
  params: ModelParams,
  geometry: ModelGeometry,
  envelope: NormativeEnvelope,
): FunctionalEnvelope {
  const selectedCore = getCoreOption(params.coreOption)
  const coreAreaPerFloor = selectedCore.areaPerFloor
  const lowerUsableAreaPerFloor = usableAreaPerFloor(
    geometry.netLowerFootprintArea,
    coreAreaPerFloor,
  )
  const upperUsableAreaPerFloor = envelope.upperHeight > 0
    ? usableAreaPerFloor(geometry.netUpperFootprintArea, coreAreaPerFloor)
    : 0
  const totalUsableArea = roundTo(
    lowerUsableAreaPerFloor * envelope.lowerFloorEquivalent +
      upperUsableAreaPerFloor * envelope.upperFloorEquivalent,
    2,
  )
  const adjustedSellableArea = roundTo(
    totalUsableArea * params.sellableEfficiency,
    2,
  )
  const upperWidth = envelope.upperHeight > 0
    ? boundingBox(geometry.upperFootprint).width
    : boundingBox(geometry.lowerFootprint).width
  const lowerWidth = boundingBox(geometry.lowerFootprint).width
  const minUsefulPlateWidth = roundTo(Math.min(lowerWidth, upperWidth), 2)
  const functionalEfficiency = geometry.builtArea > 0
    ? roundTo(totalUsableArea / geometry.builtArea, 4)
    : 0
  const messages: string[] = []

  if (params.coreOption === 'none') {
    messages.push('Sin nucleo es solo una comparacion bruta; no valida operacion arquitectonica.')
  }

  if (
    envelope.upperHeight > 0 &&
    minUsefulPlateWidth < FUNCTIONAL_RULES.minResidentialPlateWidth
  ) {
    messages.push(
      `La planta superior queda estrecha (${minUsefulPlateWidth.toFixed(2)} m utiles aprox.) para una distribucion residencial eficiente.`,
    )
  }

  if (
    params.coreOption !== 'none' &&
    functionalEfficiency < FUNCTIONAL_RULES.lowFunctionalEfficiency
  ) {
    messages.push(
      `La eficiencia funcional baja a ${Math.round(functionalEfficiency * 100)}% despues de descontar el nucleo.`,
    )
  }

  const hasError = params.coreOption !== 'none' && totalUsableArea <= 0

  return {
    selectedCore,
    coreAreaPerFloor,
    lowerUsableAreaPerFloor,
    upperUsableAreaPerFloor,
    totalUsableArea,
    adjustedSellableArea,
    functionalEfficiency,
    minUsefulPlateWidth,
    status: resolveStatus(messages, hasError),
    messages,
  }
}
