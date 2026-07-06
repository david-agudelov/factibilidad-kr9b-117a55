import { describe, expect, it } from 'vitest'
import {
  BASE_ECONOMIC_BAND,
  CONSERVATIVE_ECONOMIC_BAND,
  OPTIMISTIC_ECONOMIC_BAND,
  computeFinancialScenario,
} from './computeFinancialScenario'
import type { FinancialAssumptions, LiveModelSnapshot } from './types'

const viableSnapshot: LiveModelSnapshot = {
  caseId: 'KR9B_117A55',
  floors: 8,
  floorHeight: 3,
  ecosMode: true,
  totalHeight: 24,
  lotArea: 326.184,
  builtArea: 1500,
  usableArea: 1200,
  sellableArea: 1000,
  footprintArea: 250,
  occupancy: 0.77,
  iceLimit: 1630.92,
  iceMargin: 130.92,
  rearSetback: 6,
  sideSetback: 4,
  validationSeverity: 'warning',
  validationMessages: ['Pendiente confirmar Curaduria.'],
}

const assumptions: FinancialAssumptions = {
  salePriceResidentialPerM2: 9_000_000,
  commercialAreaShare: 0.05,
  salePriceCommercialPerM2: 10_000_000,
  parkingUnits: 4,
  parkingPricePerUnit: 25_000_000,
  directCostPerBuiltM2: 1_700_000,
  commonCostPct: 0.04,
  indirectCostPct: 0.12,
  urbanChargesPct: 0.015,
  preOpFixedCost: 150_000_000,
  landPricePerM2: 2_400_000,
  investorContribution: 500_000_000,
  investorProfitShare: 0.55,
  projectMonths: 36,
  targetProfitMargin: 0.12,
}

describe('computeFinancialScenario', () => {
  it('calculates a live economic result from snapshot and editable assumptions', () => {
    const result = computeFinancialScenario(
      viableSnapshot,
      assumptions,
      BASE_ECONOMIC_BAND,
    )

    expect(result.totalSales).toBeCloseTo(9_150_000_000, 0)
    expect(result.directCosts).toBeCloseTo(2_550_000_000, 0)
    expect(result.landCost).toBeCloseTo(782_841_600, 0)
    expect(result.profit).toBeGreaterThan(3_000_000_000)
    expect(result.profitMargin).toBeCloseTo(result.profit / result.totalSales, 6)
    expect(result.residualLandValue).toBeGreaterThan(result.landCost)
    expect(result.status).toBe('viable')
  })

  it('flags the scenario when the residual value does not pay the requested lot price', () => {
    const result = computeFinancialScenario(
      viableSnapshot,
      { ...assumptions, landPricePerM2: 12_000_000 },
      BASE_ECONOMIC_BAND,
    )

    expect(result.profit).toBeGreaterThan(0)
    expect(result.landDelta).toBeLessThan(0)
    expect(result.status).toBe('lote-tensionado')
    expect(result.messages).toContain('El valor residual no cubre el precio pedido del lote.')
  })

  it('flags non-viability when the economic scenario loses money', () => {
    const result = computeFinancialScenario(
      viableSnapshot,
      {
        ...assumptions,
        salePriceResidentialPerM2: 4_000_000,
        salePriceCommercialPerM2: 4_500_000,
        directCostPerBuiltM2: 3_000_000,
      },
      BASE_ECONOMIC_BAND,
    )

    expect(result.profit).toBeLessThan(0)
    expect(result.status).toBe('no-viable')
    expect(result.messages).toContain('El escenario economico queda con utilidad negativa.')
  })

  it('applies scenario bands to price, direct cost, land and duration', () => {
    const conservative = computeFinancialScenario(
      viableSnapshot,
      assumptions,
      CONSERVATIVE_ECONOMIC_BAND,
    )
    const optimistic = computeFinancialScenario(
      viableSnapshot,
      assumptions,
      OPTIMISTIC_ECONOMIC_BAND,
    )

    expect(conservative.totalSales).toBeLessThan(optimistic.totalSales)
    expect(conservative.directCosts).toBeGreaterThan(optimistic.directCosts)
    expect(conservative.landCost).toBeGreaterThan(optimistic.landCost)
    expect(conservative.durationMonths).toBe(42)
    expect(optimistic.durationMonths).toBe(33)
    expect(conservative.annualizedReturn).toBeLessThan(optimistic.annualizedReturn)
  })

  it('blocks financial viability when the live normative model exceeds ICe', () => {
    const result = computeFinancialScenario(
      { ...viableSnapshot, iceMargin: -10 },
      assumptions,
      BASE_ECONOMIC_BAND,
    )

    expect(result.status).toBe('no-viable')
    expect(result.messages).toContain('El modelo fisico excede el margen ICe disponible.')
  })
})
