import { describe, expect, test } from 'vitest'
import { citationFromMetadata, toCitation } from './citations'

describe('citation policy', () => {
  test('does not allow project documents as normative citations', () => {
    expect(toCitation('project_deep_research_report')).toBeUndefined()
    expect(
      citationFromMetadata({
        sourceId: 'project_requirements_md',
        title: 'Requirements',
        sourceFamily: 'project_doc',
      }),
    ).toBeUndefined()
  })
})
