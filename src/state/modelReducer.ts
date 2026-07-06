import {
  computeFloorLimit,
  computeNormativeEnvelope,
} from '../norms/computeFloorLimit'
import { NORMATIVE_RULES } from '../model/projectSource'
import type { FloorLimit, ModelParams, NormativeEnvelope } from '../model/types'

export type ResolvedModelState = {
  params: ModelParams
  floorLimit: FloorLimit
  envelope: NormativeEnvelope
  adjustmentMessages: string[]
}

export type ModelAction =
  | { type: 'set-param'; key: keyof ModelParams; value: ModelParams[keyof ModelParams] }
  | { type: 'reset'; params: ModelParams }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function resolveParamsForLiveModel(params: ModelParams): ResolvedModelState {
  const nextFloorHeight = Math.max(
    params.floorHeight,
    NORMATIVE_RULES.minFloorHeight,
  )
  const heightResolvedParams = {
    ...params,
    floorHeight: nextFloorHeight,
  }
  let floorLimit = computeFloorLimit(heightResolvedParams)
  const flooredValue = Math.round(params.floors)
  const nextFloors = clamp(
    flooredValue,
    floorLimit.minFloors,
    floorLimit.maxFloors,
  )
  const adjustmentMessages: string[] = []

  const resolvedParams = {
    ...heightResolvedParams,
    floors: nextFloors,
  }

  if (nextFloorHeight !== params.floorHeight) {
    adjustmentMessages.push(
      `Altura entre pisos ajustada a ${nextFloorHeight.toFixed(2)} m por minimo operativo del modelo.`,
    )
  }

  if (nextFloors !== params.floors) {
    adjustmentMessages.push(
      `Pisos ajustados a ${nextFloors} por limite preliminar: ${floorLimit.limitingFactors.join(', ') || 'rango permitido'}.`,
    )
    floorLimit = computeFloorLimit(resolvedParams)
  }

  return {
    params: resolvedParams,
    floorLimit,
    envelope: computeNormativeEnvelope(resolvedParams),
    adjustmentMessages,
  }
}

export function modelReducer(state: ModelParams, action: ModelAction): ModelParams {
  if (action.type === 'reset') return action.params

  const nextParams = {
    ...state,
    [action.key]: action.value,
  }

  return resolveParamsForLiveModel(nextParams).params
}
