import { Layers3 } from 'lucide-react'
import type { FunctionalEnvelope } from '../model/types'

type FunctionalPanelProps = {
  functionality: FunctionalEnvelope
}

const statusClass: Record<FunctionalEnvelope['status'], string> = {
  viable: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  condicionado: 'border-amber-200 bg-amber-50 text-amber-950',
  'no-viable': 'border-red-200 bg-red-50 text-red-950',
}

function formatNumber(value: number) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

export function FunctionalPanel({ functionality }: FunctionalPanelProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers3 size={18} className="text-amber-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Funcionalidad</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Escenario preliminar de nucleo para estimar area util.
        </p>
      </div>

      <div className="space-y-3 p-3">
        <div className={`rounded-md border border-l-4 p-3 ${statusClass[functionality.status]}`}>
          <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
            {functionality.status}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {functionality.selectedCore.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {functionality.selectedCore.description}
          </p>
        </div>

        <dl className="grid gap-3 text-sm">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Nucleo asumido por planta</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-slate-950">
              {formatNumber(functionality.coreAreaPerFloor)} m2
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Area util planta inferior</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-slate-950">
              {formatNumber(functionality.lowerUsableAreaPerFloor)} m2
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Area util planta superior</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-slate-950">
              {formatNumber(functionality.upperUsableAreaPerFloor)} m2
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Area util total</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-slate-950">
              {formatNumber(functionality.totalUsableArea)} m2
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Vendible ajustada</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-slate-950">
              {formatNumber(functionality.adjustedSellableArea)} m2
            </dd>
          </div>
        </dl>

        {functionality.messages.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            {functionality.messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
