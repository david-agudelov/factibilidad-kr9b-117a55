import { BadgeDollarSign, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import {
  ECONOMIC_BANDS,
  BASE_ECONOMIC_BAND,
  computeFinancialScenario,
} from '../finance/computeFinancialScenario'
import { DEFAULT_FINANCIAL_ASSUMPTIONS } from '../finance/defaultAssumptions'
import type {
  EconomicBand,
  FinancialAssumptions,
  FinancialResult,
  LiveModelSnapshot,
} from '../finance/types'

type EconomicDashboardPanelProps = {
  assumptions?: FinancialAssumptions
  snapshot: LiveModelSnapshot
}

const statusClass: Record<FinancialResult['status'], string> = {
  viable: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  'margen-bajo': 'border-amber-200 bg-amber-50 text-amber-950',
  'lote-tensionado': 'border-orange-200 bg-orange-50 text-orange-950',
  'no-viable': 'border-red-200 bg-red-50 text-red-950',
}

const statusLabel: Record<FinancialResult['status'], string> = {
  viable: 'Viable',
  'margen-bajo': 'Margen bajo',
  'lote-tensionado': 'Lote tensionado',
  'no-viable': 'No viable',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 1_000_000_000 ? 'compact' : 'standard',
    style: 'currency',
  }).format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent',
  }).format(value)
}

function MetricTile({
  label,
  testId,
  value,
}: {
  label: string
  testId?: string
  value: string
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
      <dt className="text-xs leading-4 text-slate-500">{label}</dt>
      <dd
        className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-950"
        data-testid={testId}
      >
        {value}
      </dd>
    </div>
  )
}

function BandRow({ result }: { result: FinancialResult }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-slate-950">
          {result.scenario.band.label}
        </h4>
        <span
          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusClass[result.status]}`}
        >
          {statusLabel[result.status]}
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2">
        <MetricTile label="Utilidad" value={formatCurrency(result.profit)} />
        <MetricTile label="Margen" value={formatPercent(result.profitMargin)} />
      </dl>
    </article>
  )
}

function computeBand(
  snapshot: LiveModelSnapshot,
  assumptions: FinancialAssumptions,
  band: EconomicBand,
) {
  return computeFinancialScenario(snapshot, assumptions, band)
}

export function EconomicDashboardPanel({
  assumptions = DEFAULT_FINANCIAL_ASSUMPTIONS,
  snapshot,
}: EconomicDashboardPanelProps) {
  const baseResult = useMemo(
    () => computeBand(snapshot, assumptions, BASE_ECONOMIC_BAND),
    [assumptions, snapshot],
  )
  const bandResults = useMemo(
    () => ECONOMIC_BANDS.map((band) => computeBand(snapshot, assumptions, band)),
    [assumptions, snapshot],
  )
  const firstMessage =
    baseResult.messages[0] ?? 'El escenario base cubre lote y margen objetivo.'

  return (
    <section
      className="rounded-md border border-slate-200 bg-white"
      data-source="live-model-snapshot"
      data-testid="economic-dashboard"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 xl:px-3 xl:py-2">
        <div className="flex items-center gap-2">
          <BadgeDollarSign size={18} className="text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Viabilidad economica</h2>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-600">Lote + utilidad</p>
      </div>

      <div className="space-y-3 p-3">
        <div className={`rounded-md border p-3 ${statusClass[baseResult.status]}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
                Escenario base
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {statusLabel[baseResult.status]}
              </p>
            </div>
            <TrendingUp size={20} aria-hidden="true" />
          </div>
          <p className="mt-2 text-xs leading-5">{firstMessage}</p>
        </div>

        <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <MetricTile
            label="Utilidad"
            testId="economic-profit"
            value={formatCurrency(baseResult.profit)}
          />
          <MetricTile
            label="Valor residual lote"
            value={formatCurrency(baseResult.residualLandValue)}
          />
          <MetricTile label="Delta lote" value={formatCurrency(baseResult.landDelta)} />
          <MetricTile
            label="Retorno inversionista"
            value={formatPercent(baseResult.annualizedReturn)}
          />
        </dl>

        <div className="grid gap-2">
          {bandResults.map((result) => (
            <BandRow key={result.scenario.band.id} result={result} />
          ))}
        </div>
      </div>
    </section>
  )
}
