import type { FinancialAssumptions } from './types'

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  salePriceResidentialPerM2: 6_500_000,
  commercialAreaShare: 0.03,
  salePriceCommercialPerM2: 7_500_000,
  parkingUnits: 4,
  parkingPricePerUnit: 20_000_000,
  directCostPerBuiltM2: 2_600_000,
  commonCostPct: 0.08,
  indirectCostPct: 0.19,
  urbanChargesPct: 0.0175,
  preOpFixedCost: 200_000_000,
  landPricePerM2: 4_500_000,
  investorContribution: 500_000_000,
  investorProfitShare: 0.55,
  projectMonths: 36,
  targetProfitMargin: 0.12,
}
