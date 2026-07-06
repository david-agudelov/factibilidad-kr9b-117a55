import type { FloorLimit, ModelParams } from '../model/types'
import { NORMATIVE_RULES } from '../model/projectSource'

export type SliderDefinition = {
  key: keyof Pick<ModelParams, 'floorHeight' | 'floors'>
  label: string
  min: number
  max: number
  step: number
  unit: string
  description: string
}

export function getSliderConfig(floorLimit: FloorLimit): SliderDefinition[] {
  return [
    {
      key: 'floorHeight',
      label: 'Altura entre pisos',
      min: NORMATIVE_RULES.minFloorHeight,
      max: 4,
      step: 0.1,
      unit: 'm',
      description: 'Altura piso a piso usada para calcular la altura total.',
    },
    {
      key: 'floors',
      label: 'Numero de pisos',
      min: floorLimit.minFloors,
      max: floorLimit.maxFloors,
      step: 1,
      unit: 'pisos',
      description: 'De 2 pisos hasta el maximo preliminar calculado por norma.',
    },
  ]
}
