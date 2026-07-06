import { unsupportedAnswer } from '../../src/rag/answerPolicy'
import type { RagAnswer, RagQuery } from '../../src/rag/types'

type RagHttpDependencies = {
  answer: (query: RagQuery) => Promise<RagAnswer>
}

type RagHttpResponse = {
  status: number
  body: RagAnswer
}

function isRagQuery(body: unknown): body is RagQuery {
  return (
    typeof body === 'object' &&
    body !== null &&
    'question' in body &&
    typeof body.question === 'string' &&
    body.question.trim().length > 0
  )
}

export async function handleRagQueryRequest(
  body: unknown,
  dependencies: RagHttpDependencies,
): Promise<RagHttpResponse> {
  if (!isRagQuery(body)) {
    return {
      status: 400,
      body: unsupportedAnswer(),
    }
  }

  return {
    status: 200,
    body: await dependencies.answer(body),
  }
}
