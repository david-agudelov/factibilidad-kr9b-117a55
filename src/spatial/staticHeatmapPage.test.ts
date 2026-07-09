import { describe, expect, test } from 'vitest'
import heatmapHtml from '../../public/static/space-syntax-heatmap/index.html?raw'

describe('static Space Syntax heatmap page', () => {
  test('contains the non-expert controls and measured lot data source', () => {
    expect(heatmapHtml).toContain('Heatmap urbano')
    expect(heatmapHtml).toContain('Space Syntax')
    expect(heatmapHtml).toContain('Perfil de lote')
    expect(heatmapHtml).toContain('Combinado')
    expect(heatmapHtml).toContain('Ancho objetivo')
    expect(heatmapHtml).toContain('Fondo objetivo')
    expect(heatmapHtml).toContain('Pisos objetivo')
    expect(heatmapHtml).toContain('../mapa-barrio/neighborhood-lots.measured.geojson')
  })

  test('uses warm Space Syntax thresholds that produce visible red clusters', () => {
    expect(heatmapHtml).toContain('if (score >= 60) return COLORS.high')
    expect(heatmapHtml).toContain('if (score.finalScore >= 60) counts.hot += 1')
  })
})
