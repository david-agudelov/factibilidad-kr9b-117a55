export type Point = {
  x: number
  y: number
}

export type ValidationSeverity = 'ok' | 'warning' | 'error'

export type ModelParams = {
  floorHeight: number
  floors: number
  sellableEfficiency: number
  ecosMode: boolean
  coreOption: CoreOptionId
}

export type SiteConstants = {
  caseId: string
  name: string
  location: string
  width: number
  depth: number
  area: number
  officialPerimeter: number
  iceIndex: number
  defaultSellableEfficiency: number
  drawingScale: number
  source: {
    document: string
    publicHref: string
    revisionDate: string
    pages: number[]
    note: string
  }
}

export type NormativeEnvelope = {
  totalHeight: number
  rearSetback: number
  lateralOnsetHeight: number
  sideSetbackApplied: number
  lowerHeight: number
  upperHeight: number
  lowerFloorEquivalent: number
  upperFloorEquivalent: number
  lateralOnsetCutsFloor: boolean
  lateralTransitionFloor: number | null
  lowerFloors: number
  upperFloors: number
  maxFloors: number
  minFloors: number
  iceLimit: number
  sellableEfficiency: number
  limitingFactors: string[]
  normativeWarnings: string[]
  status: 'preliminar viable' | 'condicionado' | 'requiere confirmacion'
}

export type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  depth: number
}

export type ModelGeometry = {
  lot: Point[]
  lowerFootprint: Point[]
  upperFootprint: Point[]
  courtyard: Point[]
  boundingBox: BoundingBox
  effectiveRearSetback: number
  lateralOnsetHeight: number
  lowerHeight: number
  upperHeight: number
  lowerFloorEquivalent: number
  upperFloorEquivalent: number
  lateralOnsetCutsFloor: boolean
  lateralTransitionFloor: number | null
  lowerFloors: number
  upperFloors: number
  grossLowerFootprintArea: number
  grossUpperFootprintArea: number
  netLowerFootprintArea: number
  netUpperFootprintArea: number
  builtArea: number
}

export type ValidationResult = {
  isValid: boolean
  severity: ValidationSeverity
  messages: string[]
  correctedParams?: Partial<ModelParams>
}

export type FloorLimit = {
  minFloors: number
  maxFloors: number
  lateralOnsetHeight: number
  limitingFactors: string[]
  maxEffectiveAreaBeforeLimit: number
}

export type MetricTone = 'neutral' | 'good' | 'warning' | 'danger'

export type MetricItem = {
  id: string
  label: string
  value: number
  unit: string
  formatted: string
  tone: MetricTone
  description: string
}

export type CoreOptionId = 'none' | 'compact' | 'standard' | 'complete'

export type CoreOption = {
  id: CoreOptionId
  label: string
  areaPerFloor: number
  description: string
}

export type FunctionalStatus = 'viable' | 'condicionado' | 'no-viable'

export type FunctionalEnvelope = {
  selectedCore: CoreOption
  coreAreaPerFloor: number
  lowerUsableAreaPerFloor: number
  upperUsableAreaPerFloor: number
  totalUsableArea: number
  adjustedSellableArea: number
  functionalEfficiency: number
  minUsefulPlateWidth: number
  status: FunctionalStatus
  messages: string[]
}

export type PdfComparisonStatus =
  | 'within-pdf-rules'
  | 'reference-close'
  | 'reference-different'
  | 'outside-preliminary-envelope'

export type PdfReferenceScenario = {
  floors: number
  studyFloorHeight: number
  totalHeight: number
  ecosMode: boolean
  rearSetback: number
  lateralOnsetHeight: number
  effectiveArea: number
  iceMargin: number
  status: string
  sourcePage: number
}

export type PdfRuleCheck = {
  label: string
  actual: number
  expected?: number
  unit: string
  passes: boolean
  description: string
}

export type PdfSourceComparison = {
  status: PdfComparisonStatus
  title: string
  messages: string[]
  ruleChecks: {
    totalHeight: PdfRuleCheck
    rearSetback: PdfRuleCheck
    lateralOnset: PdfRuleCheck
    iceMargin: PdfRuleCheck
  }
  nearestReference?: PdfReferenceScenario
  referenceIsExactStudyHeight: boolean
  areaDifference?: number
  areaDifferencePercent?: number
}
