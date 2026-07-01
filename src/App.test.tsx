import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App live calculations UI', () => {
  it('renders only the real parametric sliders with the dynamic floor range', () => {
    render(<App />)

    expect(screen.getByText('KR 9B #117A-55')).toBeInTheDocument()
    expect(screen.getAllByText(/factibilidad_KR9B_117A55\.pdf/).length).toBeGreaterThan(0)
    const sourceLinks = screen.getAllByRole('link', { name: 'factibilidad_KR9B_117A55.pdf' })
    expect(sourceLinks.length).toBeGreaterThanOrEqual(2)
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

  it('updates derived height and normative outputs immediately when sliders change', () => {
    render(<App />)

    const floors = screen.getByLabelText('Numero de pisos') as HTMLInputElement
    fireEvent.change(floors, { target: { value: '2' } })

    expect(screen.getAllByText('6,00 m').length).toBeGreaterThan(0)
    expect(screen.getByText('Posterior calculado: 4.00 m.')).toBeInTheDocument()
  })

  it('shows PDF calibration by total height without blocking custom floor heights', () => {
    render(<App />)

    expect(screen.getByText('Calibracion con PDF')).toBeInTheDocument()
    expect(screen.getByText(/Evaluacion por altura total/)).toBeInTheDocument()

    const floorHeight = screen.getByLabelText('Altura entre pisos') as HTMLInputElement
    fireEvent.change(floorHeight, { target: { value: '3.2' } })

    expect(screen.getByText(/Modelo parametrico evaluado por altura total/)).toBeInTheDocument()
    expect(screen.getByText(/3.00 m\/piso como supuesto del estudio/)).toBeInTheDocument()
  })

  it('uses a selectable core scenario instead of a core slider', () => {
    render(<App />)

    expect(screen.getByText('Funcionalidad')).toBeInTheDocument()
    expect(screen.getByLabelText('Escenario de nucleo')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nucleo')).not.toBeInTheDocument()
    expect(screen.getAllByText(/escenario preliminar/i).length).toBeGreaterThan(0)

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
    expect(screen.getAllByText('Pisos').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Altura entre pisos').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByTestId('view-stat-floors')).toHaveTextContent('5')
    expect(screen.getByTestId('view-stat-total-height')).toHaveTextContent('15,00 m')
    expect(screen.getByTestId('view-stat-rear-setback')).toHaveTextContent('5,00 m')
    expect(screen.getByTestId('view-stat-side-setback')).toHaveTextContent('4,00 m')

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
    expect(screen.getAllByText('Pisos').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Altura total').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('view-stat-total-height')).toHaveTextContent('15,00 m')
    expect(screen.getByTestId('view-stat-rear-setback')).toHaveTextContent('5,00 m')

    fireEvent.click(massTab)
    expect(massTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/Vista 3D no disponible/)).toBeInTheDocument()
    expect(screen.getByText(/orbitar/)).toBeInTheDocument()
    expect(screen.getByTestId('view-stat-total-height')).toHaveTextContent('15,00 m')
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
    expect(screen.getAllByText('Area construida total').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Area util despues de nucleo')).toBeInTheDocument()
    expect(screen.getByText('Area vendible estimada')).toBeInTheDocument()
    expect(screen.getByText('Util / construida')).toBeInTheDocument()
    expect(screen.getByText('Vendible / util')).toBeInTheDocument()
    expect(screen.getByText('Vendible / construida')).toBeInTheDocument()
    expect(screen.getByText('Footprint / Area lote')).toBeInTheDocument()

    expect(screen.getByTestId('ratio-internal-efficiency')).toHaveTextContent('79,05 %')
    expect(screen.getByTestId('ratio-internal-efficiency')).toHaveTextContent('Bueno')
    expect(screen.getByTestId('ratio-commercial-efficiency')).toHaveTextContent('78,00 %')
    expect(screen.getByTestId('ratio-sellable-built')).toHaveTextContent('61,66 %')
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

    expect(screen.getByTestId('central-model-column')).toContainElement(
      screen.getByText('Validacion preliminar OK').closest('section'),
    )
    expect(screen.getByTestId('right-analysis-column')).not.toHaveTextContent('Validacion preliminar OK')
    expect(screen.getByTestId('central-model-column')).toContainElement(
      screen.getByText('Funcionalidad').closest('section'),
    )
    expect(screen.getByTestId('right-analysis-column')).not.toHaveTextContent('Funcionalidad')

    const centralText = screen.getByTestId('central-model-column').textContent ?? ''
    expect(centralText.indexOf('Funcionalidad')).toBeGreaterThan(
      centralText.indexOf('Visualizacion del modelo'),
    )
    expect(centralText.indexOf('Validacion preliminar OK')).toBeGreaterThan(
      centralText.indexOf('Funcionalidad'),
    )
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

  it('opens the deploy-ready neighborhood map inside the app', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Mapa barrio' }))

    const mapFrame = screen.getByTitle('Mapa barrio Santa Barbara Central')
    expect(mapFrame).toBeInTheDocument()
    expect(mapFrame).toHaveAttribute(
      'src',
      expect.stringContaining('/static/mapa-barrio/index.html'),
    )
  })
})
