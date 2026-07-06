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
  validation,
}: ValidationPanelProps) {
  const isOk = validation.isValid
  const isWarning = validation.severity === 'warning'
  const panelClass = !isOk
    ? 'border-red-200 bg-red-50'
    : isWarning
      ? 'border-amber-200 bg-amber-50'
      : 'border-emerald-200 bg-emerald-50'

  return (
    <section
      aria-live="polite"
      className={`rounded-md border border-l-4 p-4 ${panelClass}`}
      role={isOk ? 'status' : 'alert'}
    >
      <div className="flex items-center gap-2">
        {isOk && !isWarning ? (
          <CheckCircle2 size={18} className="text-emerald-300" aria-hidden="true" />
        ) : (
          <AlertTriangle
            size={18}
            className={isWarning ? 'text-amber-500' : 'text-red-300'}
            aria-hidden="true"
          />
        )}
        <h2 className="text-base font-semibold text-slate-950">
          {!isOk
            ? 'Revisar geometria'
            : isWarning
              ? 'Validacion preliminar condicionada'
              : 'Validacion preliminar OK'}
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
    </section>
  )
}
