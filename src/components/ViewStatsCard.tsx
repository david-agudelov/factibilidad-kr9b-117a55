import type { ModelParams, NormativeEnvelope } from '../model/types'

type ViewStatsCardProps = {
  envelope: NormativeEnvelope
  params: ModelParams
}

function formatNumber(value: number) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

const stats = [
  {
    id: 'floors',
    label: 'Pisos',
    value: ({ params }: ViewStatsCardProps) => params.floors.toString(),
  },
  {
    id: 'floor-height',
    label: 'Altura entre pisos',
    value: ({ params }: ViewStatsCardProps) => `${formatNumber(params.floorHeight)} m`,
  },
  {
    id: 'total-height',
    label: 'Altura total',
    value: ({ envelope }: ViewStatsCardProps) => `${formatNumber(envelope.totalHeight)} m`,
  },
  {
    id: 'rear-setback',
    label: 'Aislamiento posterior',
    value: ({ envelope }: ViewStatsCardProps) => `${formatNumber(envelope.rearSetback)} m`,
  },
  {
    id: 'side-setback',
    label: 'Aislamiento lateral',
    value: ({ envelope }: ViewStatsCardProps) => `${formatNumber(envelope.sideSetbackApplied)} m`,
  },
]

export function ViewStatsCard({ envelope, params }: ViewStatsCardProps) {
  const props = { envelope, params }

  return (
    <dl className="grid gap-2 border-b border-slate-200 bg-white p-3 text-xs sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
          data-testid={`view-stat-${stat.id}`}
          key={stat.id}
        >
          <dt className="font-medium text-slate-500">{stat.label}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-950">{stat.value(props)}</dd>
        </div>
      ))}
    </dl>
  )
}
