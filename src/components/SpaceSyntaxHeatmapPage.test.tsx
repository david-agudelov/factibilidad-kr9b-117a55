import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { SpaceSyntaxHeatmapPage } from './SpaceSyntaxHeatmapPage'

describe('SpaceSyntaxHeatmapPage', () => {
  test('loads the urban heatmap as a separate static iframe', () => {
    render(<SpaceSyntaxHeatmapPage />)

    const iframe = screen.getByTitle('Heatmap urbano Space Syntax') as HTMLIFrameElement
    expect(iframe).toBeInTheDocument()
    expect(iframe.src).toContain('/static/space-syntax-heatmap/index.html')
  })
})
