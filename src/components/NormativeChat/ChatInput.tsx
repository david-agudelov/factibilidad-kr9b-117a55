import type { FormEvent } from 'react'
import { Send } from 'lucide-react'

type ChatInputProps = {
  disabled?: boolean
  isLoading: boolean
  onSubmit: (question: string) => void
}

export function ChatInput({ disabled = false, isLoading, onSubmit }: ChatInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const question = String(formData.get('question') ?? '').trim()
    if (!question || disabled || isLoading) return
    onSubmit(question)
    form.reset()
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-800" htmlFor="normative-chat-question">
        Pregunta normativa
      </label>
      <textarea
        aria-label="Pregunta normativa"
        className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-700"
        disabled={disabled || isLoading}
        id="normative-chat-question"
        name="question"
        placeholder="Ejemplo: ¿Qué fuente soporta el tratamiento urbanístico del predio?"
      />
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={disabled || isLoading}
        type="submit"
      >
        <Send size={17} aria-hidden="true" />
        {isLoading ? 'Consultando' : 'Enviar pregunta'}
      </button>
    </form>
  )
}
