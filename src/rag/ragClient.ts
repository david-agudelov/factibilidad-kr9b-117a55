import { unsupportedAnswer } from './answerPolicy'
import type { RagAnswer, RagQuery } from './types'

type RagClientOptions = {
  endpoint: string
}

export async function askNormativeRag(
  query: RagQuery,
  options: RagClientOptions,
): Promise<RagAnswer> {
  try {
    const response = await fetch(options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    if (!response.ok) return unsupportedAnswer()

    return (await response.json()) as RagAnswer
  } catch {
    return unsupportedAnswer()
  }
}
