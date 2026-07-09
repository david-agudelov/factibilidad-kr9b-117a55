import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App live calculations UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders only the real parametric sliders with the dynamic floor range', () => {
    render(<App />)

    expect(screen.getByText('KR 9B #117A-55')).toBeInTheDocument()
    expect(screen.getAllByText(/factibilidad_KR9B_117A55\.pdf/).length).toBe(1)
    const sourceLinks = screen.getAllByRole('link', { name: 'factibilidad_KR9B_117A55.pdf' })
    expect(sourceLinks.length).toBe(1)
    sourceLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/static/factibilidad_KR9B_117A55.pdf')
    })

    const floors = screen.getByLabelText('Numero de pisos') as HTMLInputElement
    const floorHeight = screen.getByLabelText('Altura entre pisos') as HTMLInputElement

    expect(floors.min).toBe('2')
    expect(floors.max).toBe('9')
    expect(floorHeight.min).toBe('2.3')
    expect(floorHeight.max).toBe('4')

    expect(screen.queryByLabelText('Ancho')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Fondo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Setback posterior')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Setback lateral')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ancho patio')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('ICe')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Lateral desde')).not.toBeInTheDocument()
  })

  it('keeps the first-view cleanup free of duplicated summary facts', () => {
    render(<App />)

    expect(screen.queryByText('Live calculations')).not.toBeInTheDocument()
    expect(screen.getByTestId('modeler-home-layout')).toHaveAttribute(
      'data-home-layout',
      'compact-three-column',
    )
    expect(screen.getByTestId('modeler-home-layout')).toHaveClass(
      'xl:grid-cols-[280px_minmax(0,1fr)_320px]',
    )

    const sliderPanel = screen.getByText('Parametros parametricos').closest('aside')
    expect(sliderPanel).not.toHaveTextContent('Pisos: 5 / 9 maximo preliminar.')
    expect(sliderPanel).not.toHaveTextContent('Altura total: 15,00 m')
    expect(sliderPanel).not.toHaveTextContent('paginas')

    expect(screen.queryByTestId('view-stats-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('view-stat-total-height')).not.toBeInTheDocument()
    expect(screen.queryByTestId('view-stat-rear-setback')).not.toBeInTheDocument()
    expect(screen.queryByTestId('view-stat-side-setback')).not.toBeInTheDocument()

    const metricsDashboard = screen.getByTestId('metrics-dashboard')
    expect(within(metricsDashboard).queryByText('Area construida total')).not.toBeInTheDocument()
    expect(screen.getByTestId('built-area-donut-center')).toHaveTextContent('Area construida')

    expect(screen.queryByText('Calibracion con PDF')).not.toBeInTheDocument()
    expect(screen.queryByText(/Evaluacion por altura total/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Estado: Dentro de reglas PDF/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Referencia cercana del PDF/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Diferencia referencial/)).not.toBeInTheDocument()
  })

  it('updates derived height and normative outputs immediately when sliders change', () => {
    render(<App />)

    const floors = screen.getByLabelText('Numero de pisos') as HTMLInputElement
    fireEvent.change(floors, { target: { value: '2' } })

    expect(screen.getAllByText('6,00 m').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Posterior calculado/)).not.toBeInTheDocument()
  })

  it('omits PDF calibration details from the modeler home', () => {
    render(<App />)

    expect(screen.queryByText('Calibracion con PDF')).not.toBeInTheDocument()
    expect(screen.queryByText(/Evaluacion por altura total/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Estado: Dentro de reglas PDF/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Referencia cercana del PDF/)).not.toBeInTheDocument()
    expect(screen.queryByText(/area PDF/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Diferencia referencial/)).not.toBeInTheDocument()

    const floorHeight = screen.getByLabelText('Altura entre pisos') as HTMLInputElement
    fireEvent.change(floorHeight, { target: { value: '3.2' } })

    expect(screen.queryByText(/Modelo parametrico evaluado por altura total/)).not.toBeInTheDocument()
    expect(screen.queryByText(/3.00 m\/piso como supuesto del estudio/)).not.toBeInTheDocument()
  })

  it('uses a selectable core scenario instead of a core slider', () => {
    render(<App />)

    expect(screen.getByText('Funcionalidad')).toBeInTheDocument()
    expect(screen.getByLabelText('Escenario de nucleo')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nucleo')).not.toBeInTheDocument()
    expect(screen.getAllByText(/escenario preliminar/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('functional-summary-row')).toHaveClass(
      'xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]',
    )
    expect(screen.getByTestId('functional-core-card')).toHaveTextContent('Nucleo estandar')
    expect(screen.getByTestId('functional-metrics-row')).toHaveClass('contents')
    expect(screen.getByText('Nucleo asumido por planta')).toBeInTheDocument()
    expect(screen.getByText('Area util planta inferior')).toBeInTheDocument()
    expect(screen.getByText('Area util planta superior')).toBeInTheDocument()
    expect(screen.getByText('Area util total')).toBeInTheDocument()
    expect(screen.getByText('Vendible ajustada')).toBeInTheDocument()

    const coreSelector = screen.getByLabelText('Escenario de nucleo') as HTMLSelectElement
    const sellableBefore = screen.getByText('Area vendible estimada')
      .parentElement?.querySelector('dd')?.textContent

    fireEvent.change(coreSelector, { target: { value: 'complete' } })

    expect(coreSelector.value).toBe('complete')
    expect(screen.getAllByText('Nucleo completo').length).toBeGreaterThan(0)
    expect(screen.getByText('65,00 m2')).toBeInTheDocument()

    const sellableAfter = screen.getByText('Area vendible estimada')
      .parentElement?.querySelector('dd')?.textContent

    expect(sellableAfter).not.toBe(sellableBefore)
  })

  it('uses viewport tabs with annotated side elevation and footprint views', () => {
    render(<App />)

    const sideTab = screen.getByRole('tab', { name: 'Vista lateral' })
    const footprintTab = screen.getByRole('tab', { name: 'Footprint 2D' })
    const massTab = screen.getByRole('tab', { name: 'Masa 3D' })

    expect(sideTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Vista lateral por niveles')).toBeInTheDocument()
    expect(document.getElementById('viewport-panel-side')?.getAttribute('class')).not.toContain('flex-1')
    expect(document.getElementById('viewport-panel-side')).toHaveAttribute('data-visual-panel', 'stable-height')
    expect(screen.getByLabelText('Vista lateral por niveles')).toHaveAttribute('data-view-frame', 'shared-model-frame')
    expect(screen.getAllByText(/Nivel/).length).toBeGreaterThanOrEqual(5)
    expect(screen.getAllByText('Aislamiento posterior').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByTestId('view-stats-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('side-setback-canvas-card')).toHaveTextContent('Aislamiento lateral')
    expect(screen.getByTestId('side-setback-canvas-card')).toHaveTextContent('4,00 m')

    fireEvent.click(footprintTab)
    expect(footprintTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Vista 2D del polígono y footprints')).toBeInTheDocument()
    expect(screen.getByText(/Aislamiento posterior:/)).toBeInTheDocument()
    expect(screen.getByText(/Aislamiento lateral:/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Vista 2D/)).toHaveAttribute('data-scale-mode', 'side-elevation-canvas')
    expect(screen.getByLabelText(/Vista 2D/)).toHaveAttribute('data-view-frame', 'shared-model-frame')
    expect(screen.getByLabelText(/Vista 2D/)).toHaveAttribute('data-canvas-width', '520')
    expect(screen.getByLabelText(/Vista 2D/)).toHaveAttribute('data-canvas-height', '520')
    expect(screen.getByLabelText(/Vista 2D/)).toHaveAttribute('data-visual-scale', '13.14')
    expect(screen.getByLabelText(/Vista 2D/).getAttribute('class')).toContain('max-w-[760px]')
    expect(screen.getByLabelText(/Vista 2D/).getAttribute('class')).toContain('min-h-[520px]')
    expect(screen.getByText(/Aislamiento posterior:/)).toHaveAttribute('font-size', '16')
    expect(screen.getByText('Niveles')).toBeInTheDocument()
    expect(screen.getAllByText('Altura total').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByTestId('view-stats-card')).not.toBeInTheDocument()

    fireEvent.click(massTab)
    expect(massTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/Vista 3D no disponible/)).toBeInTheDocument()
    expect(screen.getByText(/orbitar/)).toBeInTheDocument()
    expect(screen.queryByTestId('view-stats-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('view-floor-contours')).toHaveTextContent('Contornos por piso: 5')
    expect(screen.getByTestId('mass-viewport')).toHaveAttribute('data-initial-scale', 'side-elevation')
    expect(screen.getByTestId('mass-viewport')).toHaveAttribute('data-view-frame', 'shared-model-frame')
  })

  it('shows live metrics in the approved hierarchy and moves validation under the model canvas', () => {
    render(<App />)

    expect(screen.getByText('Metricas en vivo')).toBeInTheDocument()
    const metricsDashboard = screen.getByTestId('metrics-dashboard')
    expect(metricsDashboard).toHaveAttribute('data-fit-to-home', 'desktop')
    expect(metricsDashboard).toHaveClass('xl:max-h-[calc(100dvh-220px)]')
    const dashboardText = metricsDashboard.textContent ?? ''
    const areasIndex = dashboardText.indexOf('Areas clave del proyecto')
    const efficienciesIndex = dashboardText.indexOf('Eficiencias')
    const baseIndex = dashboardText.indexOf('Base del lote')

    expect(areasIndex).toBeGreaterThanOrEqual(0)
    expect(efficienciesIndex).toBeGreaterThan(areasIndex)
    expect(baseIndex).toBeGreaterThan(efficienciesIndex)

    expect(screen.getByText('Areas clave del proyecto')).toBeInTheDocument()
    expect(screen.getByText('Eficiencias')).toBeInTheDocument()
    expect(screen.getByText('Base del lote')).toBeInTheDocument()
    expect(screen.getByText('EN VIVO')).toBeInTheDocument()

    expect(within(metricsDashboard).queryByText('Area del lote')).not.toBeInTheDocument()
    expect(within(metricsDashboard).queryByText('Espacio libre')).not.toBeInTheDocument()
    expect(within(metricsDashboard).queryByText('Espacio libre / Area lote')).not.toBeInTheDocument()
    expect(screen.getByTestId('secondary-footprint-metric')).toHaveTextContent('Footprint')
    expect(within(metricsDashboard).queryByText('Area construida total')).not.toBeInTheDocument()
    expect(screen.getByText('Area util despues de nucleo')).toBeInTheDocument()
    expect(screen.getByText('Area vendible estimada')).toBeInTheDocument()
    expect(screen.getByText('Util / construida')).toBeInTheDocument()
    expect(screen.getByText('Vendible / util')).toBeInTheDocument()
    expect(screen.getByText('Vendible / construida')).toBeInTheDocument()
    expect(screen.getByText('Footprint / Area lote')).toBeInTheDocument()

    expect(screen.getByTestId('ratio-internal-efficiency')).toHaveTextContent('75,62 %')
    expect(screen.getByTestId('ratio-internal-efficiency')).toHaveTextContent('Atencion')
    expect(screen.getByTestId('ratio-commercial-efficiency')).toHaveTextContent('78,00 %')
    expect(screen.getByTestId('ratio-sellable-built')).toHaveTextContent('58,98 %')
    expect(screen.getByTestId('ratio-occupancy')).toHaveTextContent('80,09 %')
    expect(screen.getByTestId('areas-bars')).toBeInTheDocument()
    expect(screen.getByTestId('built-area-donut')).toBeInTheDocument()
    expect(screen.getByTestId('built-area-donut-center')).toHaveAttribute('data-center-layout', 'compact-safe')
    expect(screen.getByTestId('built-area-donut-value')).not.toHaveTextContent('m2')
    expect(screen.getByTestId('built-area-donut-unit')).toHaveTextContent('m2')
    expect(screen.getByTestId('built-area-donut-center')).toHaveTextContent('Area construida')
    expect(screen.getByTestId('built-area-donut-center')).not.toHaveTextContent('Area construida total')
    expect(screen.getByTestId('areas-bars')).toHaveAttribute('data-layout', 'full-width-below-donut')

    expect(screen.queryByText('Perimetro')).not.toBeInTheDocument()
    expect(screen.queryByText('Bounding box ancho')).not.toBeInTheDocument()
    expect(screen.queryByText('Bounding box fondo')).not.toBeInTheDocument()

    const footprintMetric = screen.getByText('Footprint').closest('[data-metric-id="footprint"]')
    expect(footprintMetric).toHaveAttribute('title', 'Huella neta en plantas inferiores.')
    expect(screen.getByTestId('metrics-dashboard')).toHaveClass('overflow-visible')
    expect(footprintMetric).toHaveClass('bg-slate-50')

    expect(screen.queryByText('Validacion preliminar condicionada')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        'El aislamiento lateral inicia dentro del piso 4; por criterio conservador, el piso completo se modela con aislamiento.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Limite de pisos/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Altura total actual/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Posterior calculado/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Lateral calculado/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Eficiencia vendible/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Pendientes antes de cerrar pisos/)).not.toBeInTheDocument()
    expect(screen.getByTestId('central-model-column')).toContainElement(
      screen.getByText('Funcionalidad').closest('section'),
    )
    expect(screen.getByTestId('right-analysis-column')).not.toHaveTextContent('Funcionalidad')

    const centralText = screen.getByTestId('central-model-column').textContent ?? ''
    expect(centralText.indexOf('Funcionalidad')).toBeGreaterThan(
      centralText.indexOf('Visualizacion del modelo'),
    )
  })

  it('does not show economic viability cards in the modeler front end', () => {
    render(<App />)

    expect(screen.queryByText('Viabilidad economica')).not.toBeInTheDocument()
    expect(screen.queryByText('Lote + utilidad')).not.toBeInTheDocument()
    expect(screen.queryByText('Valor residual lote')).not.toBeInTheDocument()
    expect(screen.queryByText('Delta lote')).not.toBeInTheDocument()
    expect(screen.queryByText('Retorno inversionista')).not.toBeInTheDocument()
    expect(screen.queryByTestId('economic-dashboard')).not.toBeInTheDocument()
    expect(screen.queryByTestId('economic-profit')).not.toBeInTheDocument()
  })

  it('opens the responsive ECOS explainer with official source links', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Modo ECOS' }))

    expect(screen.getByText('Ecourbanismo y Construccion Sostenible')).toBeInTheDocument()
    expect(screen.getByText(/reglamentacion tecnica del POT de Bogota/)).toBeInTheDocument()
    expect(screen.getByTestId('ecos-topic-grid')).toBeInTheDocument()
    expect(screen.getByText('Control termico')).toBeInTheDocument()
    expect(screen.getByText('Calidad del aire')).toBeInTheDocument()
    expect(screen.getByText('Reverdecimiento')).toBeInTheDocument()
    expect(screen.getByText('Materiales sostenibles')).toBeInTheDocument()
    expect(screen.getByText(/desde 11,40 m/)).toBeInTheDocument()
    expect(screen.getByText(/desde 15,70 m/)).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('https://www.sdp.gov.co/sites/default/files/manual_ecourb_const.pdf')
    expect(hrefs).toContain(
      'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=151925',
    )
    expect(hrefs).toContain(
      'https://www.sdp.gov.co/sites/default/files/actualiza_anexo_5_man_normas_trat_urb.pdf',
    )
  })

  it('opens the plain-language normative guide with project references', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Norma facil' }))

    expect(screen.getByText('Como leer la norma del proyecto sin ser arquitecto')).toBeInTheDocument()
    expect(screen.getAllByText(/KR 9B #117A-55/).length).toBeGreaterThan(0)
    expect(screen.getByText('Lateral desde 11,40 m')).toBeInTheDocument()
    expect(screen.getByText('ICe')).toBeInTheDocument()
    expect(screen.getByText('ECOS')).toBeInTheDocument()
    expect(screen.getByText(/El aislamiento lateral no se exige desde el primer piso/)).toBeInTheDocument()
    expect(screen.getByText('Piso 5 en adelante')).toBeInTheDocument()
    expect(screen.getAllByText(/4,99 m/).length).toBeGreaterThan(0)

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/static/factibilidad_KR9B_117A55.pdf')
    expect(hrefs).toContain('/static/norma-facil.html')
    expect(hrefs).toContain(
      'https://www.sdp.gov.co/sites/default/files/actualiza_anexo_5_man_normas_trat_urb.pdf',
    )
  })

  it('keeps Mapa barrio as the original static neighborhood iframe', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Mapa barrio' }))

    const iframe = screen.getByTitle('Mapa barrio Santa Barbara Central') as HTMLIFrameElement
    expect(iframe).toBeInTheDocument()
    expect(iframe.src).toContain('/static/mapa-barrio/index.html')
    expect(screen.queryByTitle('Heatmap urbano Space Syntax')).not.toBeInTheDocument()
  })

  it('opens Heatmap urbano as a separate Space Syntax tab', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Heatmap urbano' }))

    const iframe = screen.getByTitle('Heatmap urbano Space Syntax') as HTMLIFrameElement
    expect(iframe).toBeInTheDocument()
    expect(iframe.src).toContain('/static/space-syntax-heatmap/index.html')
    expect(screen.queryByTitle('Mapa barrio Santa Barbara Central')).not.toBeInTheDocument()
  })

  it('opens the normative consultation panel without exposing frontend secrets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'insufficient_sources',
            answer: 'No encontre soporte suficiente en los documentos y datos cargados.',
            spatialFactsUsed: [],
            citations: [],
            warnings: [],
          }),
      }),
    )

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Consulta normativa' }))

    expect(screen.getByTestId('normative-chat-panel')).toBeInTheDocument()
    expect(
      within(screen.getByTestId('normative-chat-panel')).getByText('Consulta normativa'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('normative-chat-panel')).getByText(/Consulta preliminar/),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('normative-chat-panel')).getByText(/Aerocivil/),
    ).toBeInTheDocument()

    const question = screen.getByLabelText('Pregunta normativa') as HTMLTextAreaElement
    fireEvent.change(question, { target: { value: 'Que norma soporta el caso?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pregunta' }))

    expect(await screen.findByText(/No encontr/)).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('OPENAI')
    expect(document.body.textContent).not.toContain('API_KEY')
    expect(document.body.textContent).not.toContain('VECTOR_STORE')
  })
})
