import { AlertTriangle, Bot, UserRound } from 'lucide-react'
import type { NormativeChatMessage } from '../../rag/types/chat'
import { CitationList } from './CitationList'
import { SourceBadge } from './SourceBadge'

function formatAttributes(attributes: Record<string, unknown>) {
  const entries = Object.entries(attributes)
  if (entries.length === 0) return 'Sin atributos reportados.'

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ')
}

export function ChatMessage({ message }: { message: NormativeChatMessage }) {
  if (message.role === 'user') {
    return (
      <article className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <UserRound size={16} aria-hidden="true" />
          Tu pregunta
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
          {message.content}
        </p>
      </article>
    )
  }

  const isInsufficient = message.status === 'insufficient_sources' || message.status === 'out_of_scope'
  const isError = message.status === 'error'

  return (
    <article
      className={`rounded-md border p-3 ${
        isError || isInsufficient
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
          {isError || isInsufficient ? (
            <AlertTriangle size={16} aria-hidden="true" />
          ) : (
            <Bot size={16} aria-hidden="true" />
          )}
          Respuesta
        </span>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
          {message.status}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
        {message.content}
      </p>

      {message.spatialFactsUsed.length > 0 ? (
        <section className="mt-3">
          <h4 className="text-sm font-semibold text-slate-950">Facts espaciales usados</h4>
          <ul className="mt-2 grid gap-2">
            {message.spatialFactsUsed.map((fact) => (
              <li
                className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                key={`${fact.layerId}-${fact.dataDate}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <a
                    className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-2 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
                    href={fact.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {fact.layerTitle}
                  </a>
                  <SourceBadge confidence={fact.confidence} label="Confianza" />
                </div>
                <p className="mt-2 break-words text-xs leading-5 text-slate-600">
                  {formatAttributes(fact.attributes)}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Fecha del dato: {fact.dataDate || 'por verificar'}.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CitationList citations={message.citations} />

      {message.warnings.length > 0 ? (
        <ul className="mt-3 grid gap-1 text-xs leading-5 text-amber-900">
          {message.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
