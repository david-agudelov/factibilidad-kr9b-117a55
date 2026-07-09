import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { MapPage } from './MapPage'

describe('MapPage', () => {
  test('keeps the original neighborhood map as a static iframe', () => {
    render(<MapPage />)

    const iframe = screen.getByTitle('Mapa barrio Santa Barbara Central') as HTMLIFrameElement
    expect(iframe).toBeInTheDocument()
    expect(iframe.src).toContain('/static/mapa-barrio/index.html')
    expect(screen.queryByLabelText('Ancho objetivo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Fondo objetivo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Pisos objetivo')).not.toBeInTheDocument()
  })
})
