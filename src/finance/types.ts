import type { ValidationSeverity } from '../model/types'

export type LiveModelSnapshot = {
  caseId: string
  floors: number
  floorHeight: number
  ecosMode: boolean
  totalHeight: number
  lotArea: number
  builtArea: number
  usableArea: number
  sellableArea: number
  footprintArea: number
  occupancy: number
  iceLimit: number
  iceMargin: number
  rearSetback: number
  sideSetback: number
  validationSeverity: ValidationSeverity
  validationMessages: string[]
}

export type EconomicBandId = 'conservador' | 'base' | 'optimista'

export type EconomicBand = {
  id: EconomicBandId
  label: string
  priceFactor: number
  directCostFactor: number
  landFactor: number
  durationDeltaMonths: number
}

export type FinancialAssumptions = {
  salePriceResidentialPerM2: number
  commercialAreaShare: number
  salePriceCommercialPerM2: number
  parkingUnits: number
  parkingPricePerUnit: number
  directCostPerBuiltM2: number
  commonCostPct: number
  indirectCostPct: number
  urbanChargesPct: number
  preOpFixedCost: number
  landPricePerM2: number
  investorContribution: number
  investorProfitShare: number
  projectMonths: number
  targetProfitMargin: number
}

export type FinancialStatus =
  | 'viable'
  | 'margen-bajo'
  | 'lote-tensionado'
  | 'no-viable'

export type FinancialScenario = {
  snapshot: LiveModelSnapshot
  assumptions: FinancialAssumptions
  band: EconomicBand
}

export type FinancialResult = {
  scenario: FinancialScenario
  residentialSellableArea: number
  commercialSellableArea: number
  residentialSales: number
  commercialSales: number
  parkingSales: number
  totalSales: number
  directCosts: number
  commonCosts: number
  indirectCosts: number
  urbanCharges: number
  preOpCosts: number
  landCost: number
  totalCosts: number
  profit: number
  profitMargin: number
  residualLandValue: number
  landDelta: number
  investorProfit: number
  cashOnCash: number
  annualizedReturn: number
  durationMonths: number
  status: FinancialStatus
  messages: string[]
}
