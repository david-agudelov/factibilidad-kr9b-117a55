import { useState } from 'react'
import type { FormEvent } from 'react'
import { Bot, Send } from 'lucide-react'
import { askNormativeRag } from '../rag/ragClient'
import type { RagAnswer } from '../rag/types'

type NormativeChatPanelProps = {
  caseId: string
  endpoint: string
  enabled: boolean
}

export function NormativeChatPanel({ caseId, endpoint, enabled }: NormativeChatPanelProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<RagAnswer | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuestion = question.trim()
    if (!nextQuestion || isLoading) return

    setIsLoading(true)
    const response = await askNormativeRag(
      { question: nextQuestion, caseId },
      { endpoint },
    )
    setAnswer(response)
    setIsLoading(false)
  }

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-104px)] max-w-[1800px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
            <Bot size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Agentic RAG V2
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Chat normativo-predial
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Solo responde con documentos y facts cargados. Si no hay soporte suficiente,
              bloquea la respuesta normativa.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-800" htmlFor="rag-question">
            Pregunta normativa
          </label>
          <textarea
            id="rag-question"
            aria-label="Pregunta normativa"
            className="min-h-32 resize-y rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-700"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ejemplo: Que soporte normativo tiene el aislamiento lateral del caso?"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Caso activo: <strong>{caseId}</strong>. El frontend no almacena secretos.
            </p>
            <button
              type="submit"
              disabled={!enabled || isLoading || question.trim() === ''}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send size={17} aria-hidden="true" />
              {isLoading ? 'Consultando' : 'Enviar pregunta'}
            </button>
          </div>
        </form>

        <div
          className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4"
          aria-live="polite"
        >
          {answer ? (
            <div>
              <p className="text-sm leading-6 text-slate-800">{answer.answer}</p>
              {answer.citations.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-950">Citas</h3>
                  <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
                    {answer.citations.map((citation) => (
                      <li key={`${citation.sourceId}-${citation.page ?? citation.section ?? 'source'}`}>
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-2 hover:text-amber-800"
                        >
                          {citation.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              Aun no hay consulta. Las respuestas deben venir del backend privado de RAG.
            </p>
          )}
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-950">Guardrails</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>No responde normativa sin citas.</li>
            <li>No recalcula geometria ni metricas.</li>
            <li>Los overlays espaciales producen facts deterministas.</li>
            <li>Los secretos viven solo en servidor.</li>
          </ul>
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-950">Estado MVP</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Endpoint configurado: <code className="rounded bg-slate-100 px-1">{endpoint}</code>
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {enabled ? 'Panel habilitado.' : 'Panel deshabilitado por configuracion publica.'}
          </p>
        </section>
      </aside>
    </section>
  )
}
