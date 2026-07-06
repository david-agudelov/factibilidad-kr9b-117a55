import { FileText } from 'lucide-react'
import type { PdfSourceComparison } from '../model/types'

type PdfScenarioPanelProps = {
  comparison: PdfSourceComparison
}

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function statusLabel(status: PdfSourceComparison['status']) {
  if (status === 'outside-preliminary-envelope') {
    return 'Fuera de envolvente preliminar'
  }
  if (status === 'reference-different') return 'Referencia diferente'
  if (status === 'reference-close') return 'Referencia cercana'
  return 'Dentro de reglas PDF'
}

export function PdfScenarioPanel({ comparison }: PdfScenarioPanelProps) {
  const reference = comparison.nearestReference

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-amber-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">Calibracion con PDF</h2>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-950">
        {comparison.title}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Estado: {statusLabel(comparison.status)}.
      </p>

      {reference && (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
          <p className="font-semibold text-slate-950">Referencia cercana del PDF</p>
          <p>
            {reference.floors} pisos / pagina {reference.sourcePage} / area PDF{' '}
            {formatNumber(reference.effectiveArea)} m2.
          </p>
          {comparison.areaDifference !== undefined && (
            <p>
              Diferencia referencial: {formatNumber(comparison.areaDifference)} m2 (
              {formatNumber(comparison.areaDifferencePercent ?? 0)}%).
            </p>
          )}
          {!comparison.referenceIsExactStudyHeight && (
            <p className="mt-2 text-amber-800">
              No es comparacion exacta si la altura entre pisos cambio.
            </p>
          )}
        </div>
      )}

      <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-700">
        {comparison.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </section>
  )
}
