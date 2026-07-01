import type { CoreOption, CoreOptionId } from '../model/types'

export const CORE_OPTIONS: CoreOption[] = [
  {
    id: 'none',
    label: 'Sin nucleo',
    areaPerFloor: 0,
    description: 'Comparacion bruta temprana; no representa una planta operable.',
  },
  {
    id: 'compact',
    label: 'Nucleo compacto',
    areaPerFloor: 35,
    description: 'Supuesto minimo preliminar para escalera, ascensor, hall y ductos.',
  },
  {
    id: 'standard',
    label: 'Nucleo estandar',
    areaPerFloor: 48,
    description: 'Supuesto residencial base con circulacion y servicios mas holgados.',
  },
  {
    id: 'complete',
    label: 'Nucleo completo',
    areaPerFloor: 65,
    description: 'Escenario conservador con mayor reserva para servicios y circulacion.',
  },
]

export const DEFAULT_CORE_OPTION: CoreOptionId = 'standard'

export const FUNCTIONAL_RULES = {
  minResidentialPlateWidth: 5.5,
  lowFunctionalEfficiency: 0.68,
}

export function getCoreOption(id: CoreOptionId): CoreOption {
  return CORE_OPTIONS.find((option) => option.id === id) ?? CORE_OPTIONS[0]
}
