import { useMemo, useState } from 'react'
import { Bot, LoaderCircle, ShieldCheck } from 'lucide-react'
import { askNormativeChat } from '../../rag/client/normativeChatClient'
import type {
  NormativeChatAppState,
  NormativeChatMessage,
  NormativeChatRequest,
  NormativeChatResponse,
} from '../../rag/types/chat'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'

type NormativeChatProps = {
  appState: NormativeChatAppState
  enabled?: boolean
  endpoint?: string
  parcelContext?: NormativeChatRequest['parcelContext']
  sendQuestion?: (request: NormativeChatRequest) => Promise<NormativeChatResponse>
}

const DISCLAIMER =
  'Consulta preliminar. No reemplaza licencia, Curaduría Urbana, Aerocivil, topografía, perfil vial oficial ni revisión jurídica.'

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function NormativeChat({
  appState,
  enabled = true,
  endpoint,
  parcelContext,
  sendQuestion,
}: NormativeChatProps) {
  const [messages, setMessages] = useState<NormativeChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const client = useMemo(
    () => sendQuestion ?? ((request: NormativeChatRequest) => askNormativeChat(request, { endpoint })),
    [endpoint, sendQuestion],
  )

  async function handleSubmit(question: string) {
    const userMessage: NormativeChatMessage = {
      id: createId('user'),
      role: 'user',
      content: question,
    }

    setMessages((current) => [...current, userMessage])
    setIsLoading(true)

    const response = await client({ question, parcelContext, appState })

    setMessages((current) => [
      ...current,
      {
        id: createId('assistant'),
        role: 'assistant',
        content: response.answer,
        status: response.status,
        citations: response.citations,
        spatialFactsUsed: response.spatialFactsUsed,
        warnings: response.warnings,
      },
    ])
    setIsLoading(false)
  }

  return (
    <section
      className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white"
      data-testid="normative-chat-panel"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Bot size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Agentic RAG V2
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">
              Consulta normativa
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Preguntas en español con respuesta citada desde el backend privado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
            <span>{DISCLAIMER}</span>
          </p>
        </div>

        <ChatInput disabled={!enabled} isLoading={isLoading} onSubmit={handleSubmit} />

        <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              Aún no hay consulta. El chat puede usar el estado actual del modelo como contexto,
              pero no lo modifica ni recalcula geometría.
            </p>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          {isLoading ? (
            <p className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
              Consultando fuentes cargadas
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
