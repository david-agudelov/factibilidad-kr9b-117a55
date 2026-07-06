import type { NormativeCitation } from '../../rag/types/citations'
import { SourceBadge } from './SourceBadge'

type CitationListProps = {
  citations: NormativeCitation[]
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return null

  return (
    <section aria-label="Citas de la respuesta" className="mt-3">
      <h4 className="text-sm font-semibold text-slate-950">Citas</h4>
      <ul className="mt-2 grid gap-2">
        {citations.map((citation) => (
          <li
            className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
            key={`${citation.sourceId}-${citation.page}-${citation.article}-${citation.section}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <a
                className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-2 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
                href={citation.officialUrl}
                rel="noreferrer"
                target="_blank"
              >
                {citation.documentTitle}
              </a>
              <SourceBadge confidence={citation.confidence} label="Confianza" />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {[citation.section, citation.article, citation.page ? `p. ${citation.page}` : '']
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Versión: {citation.versionDate || 'por verificar'} · Fuente: {citation.sourceFamily}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
