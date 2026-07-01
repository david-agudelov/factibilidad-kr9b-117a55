import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type {
  FloorLimit,
  ModelParams,
  NormativeEnvelope,
  ValidationResult,
} from '../model/types'

type ValidationPanelProps = {
  validation: ValidationResult
  floorLimit: FloorLimit
  envelope: NormativeEnvelope
  params: ModelParams
  adjustmentMessages: string[]
}

export function ValidationPanel({
  adjustmentMessages,
  envelope,
  floorLimit,
  params,
  validation,
}: ValidationPanelProps) {
  const isOk = validation.isValid

  return (
    <section
      aria-live="polite"
      className={`rounded-md border border-l-4 p-4 ${
        isOk
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
      role={isOk ? 'status' : 'alert'}
    >
      <div className="flex items-center gap-2">
        {isOk ? (
          <CheckCircle2 size={18} className="text-emerald-300" aria-hidden="true" />
        ) : (
          <AlertTriangle size={18} className="text-red-300" aria-hidden="true" />
        )}
        <h2 className="text-base font-semibold text-slate-950">
          {isOk ? 'Validacion preliminar OK' : 'Revisar geometria'}
        </h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">
        {validation.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
        {adjustmentMessages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
      <div className="mt-4 rounded-md border border-slate-200 bg-white/85 p-3 text-xs leading-5 text-slate-700">
        <p>
          Limite de pisos: {floorLimit.minFloors} a {floorLimit.maxFloors}. Factor:{' '}
          {floorLimit.limitingFactors.join(', ') || 'sin restriccion activa adicional'}.
        </p>
        <p>Altura total actual: {envelope.totalHeight.toFixed(2)} m.</p>
        <p>Posterior calculado: {envelope.rearSetback.toFixed(2)} m.</p>
        <p>
          Lateral calculado: {envelope.sideSetbackApplied.toFixed(2)} m desde{' '}
          {envelope.lateralOnsetHeight.toFixed(2)} m.
        </p>
        <p>Estado: {envelope.status}.</p>
        <p>Eficiencia vendible: {Math.round(params.sellableEfficiency * 100)}%.</p>
      </div>
      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        <p className="font-semibold">Pendientes antes de cerrar pisos:</p>
        <ul className="mt-2 space-y-1">
          {envelope.normativeWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
