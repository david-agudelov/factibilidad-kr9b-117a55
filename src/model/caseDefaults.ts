import { SITE_CONSTANTS, NORMATIVE_RULES } from './projectSource'
import type { ModelParams } from './types'
import { DEFAULT_CORE_OPTION } from '../config/coreOptions'

export const CASE_INFO = {
  caseId: SITE_CONSTANTS.caseId,
  name: SITE_CONSTANTS.name,
  location: SITE_CONSTANTS.location,
  sourcePdf: SITE_CONSTANTS.source.document,
  sourcePdfHref: SITE_CONSTANTS.source.publicHref,
  note: SITE_CONSTANTS.source.note,
}

export const DEFAULT_PARAMS: ModelParams = {
  floorHeight: 3,
  floors: 5,
  sellableEfficiency: SITE_CONSTANTS.defaultSellableEfficiency,
  ecosMode: false,
  coreOption: DEFAULT_CORE_OPTION,
}

export const NORMATIVE_LIMITS = {
  minFloors: NORMATIVE_RULES.minFloors,
  preliminaryMaxHeight: NORMATIVE_RULES.preliminaryMaxHeight,
  baseLateralOnsetHeight: NORMATIVE_RULES.baseLateralOnsetHeight,
  ecosLateralOnsetHeight: NORMATIVE_RULES.ecosLateralOnsetHeight,
  minFloorHeight: NORMATIVE_RULES.minFloorHeight,
  minSideSetback: NORMATIVE_RULES.minSideSetback,
  minUsefulUpperWidth: NORMATIVE_RULES.minUsefulUpperWidth,
}
