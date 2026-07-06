import { Box, Layers3 } from 'lucide-react'
import type { MetricItem } from '../model/types'

type MetricsPanelProps = {
  metrics: MetricItem[]
}

type DecisionTone = 'good' | 'warning' | 'danger'

type Decision = {
  tone: DecisionTone
  label: 'Bueno' | 'Atencion' | 'Riesgo'
  message: string
}

type RatioItem = {
  id: string
  label: string
  percent: number
  description: string
  decision: Decision
}

const decisionClass: Record<DecisionTone, string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
}

const strokeClass: Record<DecisionTone, string> = {
  good: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  danger: 'stroke-red-500',
}

const barClass = ['bg-slate-950', 'bg-blue-700', 'bg-sky-500']

function metricById(metrics: MetricItem[], id: string) {
  return metrics.find((metric) => metric.id === id)
}

function ratioPercent(numerator?: MetricItem, denominator?: MetricItem) {
  if (!numerator || !denominator || denominator.value <= 0) {
    return 0
  }

  return (numerator.value / denominator.value) * 100
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)} %`
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100))
}

function classifyMinimum(value: number, good: number, warning: number, messages: {
  good: string
  warning: string
  danger: string
}): Decision {
  if (value >= good) {
    return { tone: 'good', label: 'Bueno', message: messages.good }
  }

  if (value >= warning) {
    return { tone: 'warning', label: 'Atencion', message: messages.warning }
  }

  return { tone: 'danger', label: 'Riesgo', message: messages.danger }
}

function classifyBand(value: number, goodMin: number, goodMax: number, warningMin: number, warningMax: number, messages: {
  good: string
  warning: string
  danger: string
}): Decision {
  if (value >= goodMin && value <= goodMax) {
    return { tone: 'good', label: 'Bueno', message: messages.good }
  }

  if (value >= warningMin && value <= warningMax) {
    return { tone: 'warning', label: 'Atencion', message: messages.warning }
  }

  return { tone: 'danger', label: 'Riesgo', message: messages.danger }
}

function RatioGauge({ ratio }: { ratio: RatioItem }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const dash = (clampPercent(ratio.percent) / 100) * circumference

  return (
    <article
      className="rounded-md border border-slate-200 bg-white p-3 xl:p-2"
      data-testid={`ratio-${ratio.id}`}
      title={ratio.description}
    >
      <div className="flex items-center gap-3 xl:gap-2">
        <svg aria-hidden="true" className="size-14 shrink-0 -rotate-90 xl:size-10" viewBox="0 0 56 56">
          <circle
            className="stroke-blue-100"
            cx="28"
            cy="28"
            fill="none"
            r={radius}
            strokeWidth="7"
          />
          <circle
            className={strokeClass[ratio.decision.tone]}
            cx="28"
            cy="28"
            fill="none"
            r={radius}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            strokeWidth="7"
          />
        </svg>
        <div className="min-w-0">
          <h4 className="text-sm font-medium leading-5 text-slate-950 xl:text-xs xl:leading-4">{ratio.label}</h4>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-950 xl:text-sm">
            {formatPercent(ratio.percent)}
          </p>
        </div>
      </div>
      <div className={`mt-3 rounded-md border px-2 py-1 text-xs font-semibold xl:mt-2 xl:py-0.5 ${decisionClass[ratio.decision.tone]}`}>
        {ratio.decision.label}
        <span className="block pt-1 font-normal leading-5 xl:hidden">{ratio.decision.message}</span>
      </div>
    </article>
  )
}

function RelationCard({ ratio }: { ratio: RatioItem }) {
  return (
    <article
      className="rounded-md border border-slate-200 bg-white p-3 xl:p-2"
      data-testid={`ratio-${ratio.id}`}
      title={ratio.description}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium leading-5 text-slate-950 xl:text-xs xl:leading-4">{ratio.label}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500 xl:hidden">{ratio.description}</p>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${decisionClass[ratio.decision.tone]}`}>
          {ratio.decision.label}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 xl:mt-2 xl:h-1.5">
        <div
          className="h-2 rounded-full bg-slate-800 xl:h-1.5"
          style={{ width: `${clampPercent(ratio.percent)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-lg font-semibold tabular-nums text-slate-950 xl:text-sm">
          {formatPercent(ratio.percent)}
        </p>
        <p className="text-right text-xs leading-5 text-slate-600 xl:hidden">{ratio.decision.message}</p>
      </div>
    </article>
  )
}

function AreaBars({
  areaMetrics,
  builtArea,
}: {
  areaMetrics: MetricItem[]
  builtArea?: MetricItem
}) {
  if (!builtArea) {
    return null
  }

  return (
    <div
      className="w-full space-y-4 xl:space-y-2"
      data-layout="full-width-below-donut"
      data-testid="areas-bars"
    >
      {areaMetrics.map((metric, index) => (
        <div key={metric.id}>
          <div className="flex items-end justify-between gap-3">
            <dt className="text-sm font-medium leading-5 text-slate-950 xl:text-xs xl:leading-4">{metric.label}</dt>
            <dd className="font-mono text-base font-semibold tabular-nums text-slate-950 xl:text-sm">
              {metric.formatted}
            </dd>
          </div>
          <div className="mt-2 h-5 rounded bg-slate-100 xl:mt-1 xl:h-3">
            <div
              className={`h-5 rounded xl:h-3 ${barClass[index] ?? 'bg-blue-500'}`}
              style={{ width: `${clampPercent(ratioPercent(metric, builtArea))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function SecondaryFootprintMetric({ footprint }: { footprint?: MetricItem }) {
  if (!footprint) {
    return null
  }

  return (
    <div
      className="group relative rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 transition hover:z-30 hover:border-slate-300 focus:z-30 focus:outline-none focus:ring-2 focus:ring-slate-700 xl:py-1.5"
      data-metric-id={footprint.id}
      data-testid="secondary-footprint-metric"
      tabIndex={0}
      title={footprint.description}
    >
      <dt className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Box aria-hidden="true" size={15} />
        {footprint.label}
      </dt>
      <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-950 xl:text-sm">
        {footprint.formatted}
      </dd>
      <p className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 right-0 z-40 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs leading-5 text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
        {footprint.description}
      </p>
    </div>
  )
}

function BuiltAreaDonut({
  builtArea,
  iceLimit,
}: {
  builtArea?: MetricItem
  iceLimit?: MetricItem
}) {
  if (!builtArea) {
    return null
  }

  const percent = iceLimit ? ratioPercent(builtArea, iceLimit) : 100
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const dash = (clampPercent(percent) / 100) * circumference
  const builtAreaValue = formatMetricValue(builtArea.value)

  return (
    <div className="flex flex-col items-center justify-center" data-testid="built-area-donut">
      <div className="relative size-48 xl:size-32">
        <svg aria-hidden="true" className="size-48 -rotate-90 xl:size-32" viewBox="0 0 180 180">
          <circle
            className="stroke-blue-100"
            cx="90"
            cy="90"
            fill="none"
            r={radius}
            strokeWidth="18"
          />
          <circle
            className="stroke-blue-700"
            cx="90"
            cy="90"
            fill="none"
            r={radius}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            strokeWidth="18"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center xl:px-5"
          data-center-layout="compact-safe"
          data-testid="built-area-donut-center"
        >
          <p
            className="max-w-[112px] font-mono text-2xl font-semibold leading-none tabular-nums text-slate-950 xl:max-w-[82px] xl:text-base"
            data-testid="built-area-donut-value"
          >
            {builtAreaValue}
          </p>
          <p
            className="mt-1 font-mono text-sm font-semibold leading-none text-slate-950 xl:mt-0.5 xl:text-[11px]"
            data-testid="built-area-donut-unit"
          >
            {builtArea.unit}
          </p>
          <p className="mt-2 max-w-[96px] text-xs leading-4 text-slate-700 xl:mt-1 xl:max-w-[72px] xl:text-[10px] xl:leading-3">
            Area construida
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs leading-5 text-slate-500 xl:mt-1 xl:leading-4">
        {formatPercent(percent)} del limite ICe preliminar
      </p>
    </div>
  )
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const lotArea = metricById(metrics, 'lotArea')
  const footprint = metricById(metrics, 'footprint')
  const builtArea = metricById(metrics, 'builtArea')
  const usableArea = metricById(metrics, 'usableArea')
  const sellableArea = metricById(metrics, 'sellableArea')
  const iceLimit = metricById(metrics, 'iceLimit')

  const occupancy: RatioItem = {
    id: 'occupancy',
    label: 'Footprint / Area lote',
    percent: ratioPercent(footprint, lotArea),
    description: 'Ocupacion: huella construida sobre area oficial del lote.',
    decision: classifyBand(ratioPercent(footprint, lotArea), 65, 82, 50, 88, {
      good: 'Ocupacion equilibrada para esta exploracion.',
      warning: 'Revisar balance entre huella y area libre.',
      danger: 'Huella fuera del rango preliminar recomendado.',
    }),
  }

  const internalEfficiency: RatioItem = {
    id: 'internal-efficiency',
    label: 'Util / construida',
    percent: ratioPercent(usableArea, builtArea),
    description: 'Eficiencia interna: area util despues de nucleo sobre area construida.',
    decision: classifyMinimum(ratioPercent(usableArea, builtArea), 78, 68, {
      good: 'Buena eficiencia interna.',
      warning: 'Revisar nucleo y circulaciones.',
      danger: 'El nucleo consume demasiada area.',
    }),
  }

  const commercialEfficiency: RatioItem = {
    id: 'commercial-efficiency',
    label: 'Vendible / util',
    percent: ratioPercent(sellableArea, usableArea),
    description: 'Eficiencia comercial: area vendible estimada sobre area util.',
    decision: classifyMinimum(ratioPercent(sellableArea, usableArea), 75, 65, {
      good: 'Buena conversion comercial.',
      warning: 'Revisar mezcla o eficiencia vendible.',
      danger: 'Baja conversion de area util a vendible.',
    }),
  }

  const sellableBuilt: RatioItem = {
    id: 'sellable-built',
    label: 'Vendible / construida',
    percent: ratioPercent(sellableArea, builtArea),
    description: 'Lectura total: area vendible estimada sobre area construida.',
    decision: classifyMinimum(ratioPercent(sellableArea, builtArea), 58, 50, {
      good: 'Relacion vendible total competitiva.',
      warning: 'Revisar producto y supuestos comerciales.',
      danger: 'Baja captura vendible frente al area construida.',
    }),
  }

  const areaMetrics = [usableArea, sellableArea].filter(Boolean) as MetricItem[]

  return (
    <section className="overflow-visible rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 xl:px-3 xl:py-2">
        <h2 className="text-base font-semibold text-slate-950">Metricas en vivo</h2>
        <p className="mt-1 text-xs text-slate-500 xl:hidden">
          Relaciones que convierten el modelo actual en decisiones preliminares.
        </p>
      </div>

      <div
        className="space-y-4 overflow-visible p-4 xl:max-h-[calc(100dvh-220px)] xl:space-y-2 xl:p-3"
        data-fit-to-home="desktop"
        data-testid="metrics-dashboard"
      >
        <section className="rounded-md border border-slate-200 bg-white p-4 xl:p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950 xl:text-sm">Areas clave del proyecto</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 xl:hidden">
                Comparacion entre area construida, area util y area vendible.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500" />
              EN VIVO
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center gap-5 xl:mt-2 xl:gap-3">
            <BuiltAreaDonut builtArea={builtArea} iceLimit={iceLimit} />
            <dl className="w-full">
              <AreaBars areaMetrics={areaMetrics} builtArea={builtArea} />
            </dl>
          </div>
        </section>

        <div>
          <div className="flex items-center gap-2 px-1">
            <Layers3 aria-hidden="true" className="text-slate-700" size={17} />
            <h3 className="text-sm font-semibold text-slate-950">Eficiencias</h3>
          </div>
          <div className="mt-2 grid gap-3 xl:gap-2">
            <RatioGauge ratio={internalEfficiency} />
            <RatioGauge ratio={commercialEfficiency} />
            <RatioGauge ratio={sellableBuilt} />
          </div>
        </div>

        <div>
          <h3 className="px-1 text-sm font-semibold text-slate-950">Base del lote</h3>
          <dl className="mt-2 grid gap-3 overflow-visible xl:gap-2">
            <SecondaryFootprintMetric footprint={footprint} />
          </dl>
          <div className="mt-3 xl:mt-2">
            <RelationCard ratio={occupancy} />
          </div>
        </div>
      </div>
    </section>
  )
}
