import type { CitationConfidence } from '../../rag/types/citations'

const confidenceLabel: Record<CitationConfidence, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const badgeClass: Record<CitationConfidence, string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function SourceBadge({
  confidence,
  label,
}: {
  confidence: CitationConfidence
  label: string
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2 text-xs font-semibold ${badgeClass[confidence]}`}
      title={`Confianza ${confidenceLabel[confidence].toLowerCase()}`}
    >
      {label}: {confidenceLabel[confidence]}
    </span>
  )
}
