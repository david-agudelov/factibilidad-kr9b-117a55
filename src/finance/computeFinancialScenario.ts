import type {
  EconomicBand,
  FinancialAssumptions,
  FinancialResult,
  FinancialStatus,
  LiveModelSnapshot,
} from './types'

export const CONSERVATIVE_ECONOMIC_BAND: EconomicBand = {
  id: 'conservador',
  label: 'Conservador',
  priceFactor: 0.92,
  directCostFactor: 1.08,
  landFactor: 1.05,
  durationDeltaMonths: 6,
}

export const BASE_ECONOMIC_BAND: EconomicBand = {
  id: 'base',
  label: 'Base',
  priceFactor: 1,
  directCostFactor: 1,
  landFactor: 1,
  durationDeltaMonths: 0,
}

export const OPTIMISTIC_ECONOMIC_BAND: EconomicBand = {
  id: 'optimista',
  label: 'Optimista',
  priceFactor: 1.06,
  directCostFactor: 0.95,
  landFactor: 0.95,
  durationDeltaMonths: -3,
}

export const ECONOMIC_BANDS = [
  CONSERVATIVE_ECONOMIC_BAND,
  BASE_ECONOMIC_BAND,
  OPTIMISTIC_ECONOMIC_BAND,
]

function clampShare(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function positive(value: number) {
  return Math.max(0, value)
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0
}

function resolveStatus(
  snapshot: LiveModelSnapshot,
  assumptions: FinancialAssumptions,
  profit: number,
  profitMargin: number,
  landDelta: number,
) {
  const messages: string[] = []

  if (snapshot.iceMargin < 0) {
    messages.push('El modelo fisico excede el margen ICe disponible.')
  }

  if (snapshot.validationSeverity === 'error') {
    messages.push('El modelo fisico tiene errores de validacion.')
  }

  if (profit < 0) {
    messages.push('El escenario economico queda con utilidad negativa.')
  }

  if (landDelta < 0) {
    messages.push('El valor residual no cubre el precio pedido del lote.')
  }

  if (profit >= 0 && profitMargin < assumptions.targetProfitMargin) {
    messages.push('La utilidad queda por debajo del margen objetivo.')
  }

  let status: FinancialStatus = 'viable'

  if (snapshot.iceMargin < 0 || snapshot.validationSeverity === 'error' || profit < 0) {
    status = 'no-viable'
  } else if (landDelta < 0) {
    status = 'lote-tensionado'
  } else if (profitMargin < assumptions.targetProfitMargin) {
    status = 'margen-bajo'
  }

  return { status, messages }
}

export function computeFinancialScenario(
  snapshot: LiveModelSnapshot,
  assumptions: FinancialAssumptions,
  band: EconomicBand = BASE_ECONOMIC_BAND,
): FinancialResult {
  const commercialShare = clampShare(assumptions.commercialAreaShare)
  const residentialSellableArea = snapshot.sellableArea * (1 - commercialShare)
  const commercialSellableArea = snapshot.sellableArea * commercialShare
  const residentialSales =
    residentialSellableArea *
    assumptions.salePriceResidentialPerM2 *
    band.priceFactor
  const commercialSales =
    commercialSellableArea *
    assumptions.salePriceCommercialPerM2 *
    band.priceFactor
  const parkingSales =
    positive(assumptions.parkingUnits) * positive(assumptions.parkingPricePerUnit)
  const totalSales = residentialSales + commercialSales + parkingSales
  const directCosts =
    snapshot.builtArea *
    assumptions.directCostPerBuiltM2 *
    band.directCostFactor
  const commonCosts = totalSales * assumptions.commonCostPct
  const indirectCosts = totalSales * assumptions.indirectCostPct
  const urbanCharges = totalSales * assumptions.urbanChargesPct
  const preOpCosts = assumptions.preOpFixedCost
  const landCost = snapshot.lotArea * assumptions.landPricePerM2 * band.landFactor
  const totalCosts =
    directCosts +
    commonCosts +
    indirectCosts +
    urbanCharges +
    preOpCosts +
    landCost
  const profit = totalSales - totalCosts
  const profitMargin = ratio(profit, totalSales)
  const residualLandValue =
    totalSales -
    directCosts -
    commonCosts -
    indirectCosts -
    urbanCharges -
    preOpCosts -
    totalSales * assumptions.targetProfitMargin
  const landDelta = residualLandValue - landCost
  const investorProfit = positive(profit) * assumptions.investorProfitShare
  const cashOnCash = ratio(investorProfit, assumptions.investorContribution)
  const durationMonths = Math.max(1, assumptions.projectMonths + band.durationDeltaMonths)
  const annualizedReturn = cashOnCash / (durationMonths / 12)
  const { status, messages } = resolveStatus(
    snapshot,
    assumptions,
    profit,
    profitMargin,
    landDelta,
  )

  return {
    scenario: {
      snapshot,
      assumptions,
      band,
    },
    residentialSellableArea,
    commercialSellableArea,
    residentialSales,
    commercialSales,
    parkingSales,
    totalSales,
    directCosts,
    commonCosts,
    indirectCosts,
    urbanCharges,
    preOpCosts,
    landCost,
    totalCosts,
    profit,
    profitMargin,
    residualLandValue,
    landDelta,
    investorProfit,
    cashOnCash,
    annualizedReturn,
    durationMonths,
    status,
    messages,
  }
}
