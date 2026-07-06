import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { NormativeChatResponse } from '../../rag/types/chat'
import { NormativeChat } from './NormativeChat'

const answeredResponse: NormativeChatResponse = {
  status: 'answered',
  answer: 'El soporte normativo debe verificarse contra la fuente citada.',
  spatialFactsUsed: [
    {
      layerId: 'tratamiento_urbanistico_pot',
      layerTitle: 'Tratamiento Urbanistico POT',
      matched: true,
      attributes: { tratamiento: 'Consolidacion' },
      sourceUrl: 'https://www.ideca.gov.co/',
      dataDate: '2025-01-01',
      confidence: 'high',
    },
  ],
  citations: [
    {
      sourceId: 'decreto_670_2025_dot',
      documentTitle: 'Decreto 670 de 2025',
      sourceFamily: 'legal',
      section: 'Capitulo 2',
      article: 'Articulo 10',
      page: '24',
      officialUrl: 'https://www.alcaldiabogota.gov.co/',
      versionDate: '2025-01-01',
      confidence: 'high',
    },
  ],
  warnings: [],
}

describe('NormativeChat', () => {
  it('renders the input and disclaimer', () => {
    render(<NormativeChat appState={{ floors: 5 }} />)

    expect(screen.getByLabelText('Pregunta normativa')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Consulta preliminar. No reemplaza licencia, Curaduría Urbana, Aerocivil, topografía, perfil vial oficial ni revisión jurídica.',
      ),
    ).toBeInTheDocument()
  })

  it('sends a mocked question and shows answer, citations and spatial facts', async () => {
    const sendQuestion = vi.fn().mockResolvedValue(answeredResponse)
    render(
      <NormativeChat
        appState={{ floors: 5, floorHeight: 3 }}
        parcelContext={{
          parcelInput: {
            address: 'KR 9B #117A-55',
            chip: '',
            lotId: 'KR9B_117A55',
            geometry: null,
          },
        }}
        sendQuestion={sendQuestion}
      />,
    )

    fireEvent.change(screen.getByLabelText('Pregunta normativa'), {
      target: { value: 'Que norma soporta este predio?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pregunta' }))

    expect(await screen.findByText(answeredResponse.answer)).toBeInTheDocument()
    expect(sendQuestion).toHaveBeenCalledWith({
      question: 'Que norma soporta este predio?',
      parcelContext: {
        parcelInput: {
          address: 'KR 9B #117A-55',
          chip: '',
          lotId: 'KR9B_117A55',
          geometry: null,
        },
      },
      appState: { floors: 5, floorHeight: 3 },
    })

    const citationList = screen.getByLabelText('Citas de la respuesta')
    expect(within(citationList).getByText('Decreto 670 de 2025')).toBeInTheDocument()
    expect(within(citationList).getByText(/Articulo 10/)).toBeInTheDocument()
    expect(within(citationList).getByRole('link')).toHaveAttribute(
      'href',
      'https://www.alcaldiabogota.gov.co/',
    )
    expect(screen.getByText('Tratamiento Urbanistico POT')).toBeInTheDocument()
    expect(screen.getByText(/Consolidacion/)).toBeInTheDocument()
  })

  it('shows insufficient_sources responses without citations', async () => {
    const sendQuestion = vi.fn().mockResolvedValue({
      status: 'insufficient_sources',
      answer: 'No encontré soporte suficiente en los documentos y datos cargados.',
      spatialFactsUsed: [],
      citations: [],
      warnings: ['No se resolvio el predio.'],
    } satisfies NormativeChatResponse)
    render(<NormativeChat appState={{}} sendQuestion={sendQuestion} />)

    fireEvent.change(screen.getByLabelText('Pregunta normativa'), {
      target: { value: 'Cual es la altura exacta?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pregunta' }))

    expect(
      await screen.findByText('No encontré soporte suficiente en los documentos y datos cargados.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Citas de la respuesta')).not.toBeInTheDocument())
    expect(screen.getByText('No se resolvio el predio.')).toBeInTheDocument()
  })

  it('does not expose secret environment names in the rendered UI', () => {
    render(<NormativeChat appState={{ floors: 5 }} />)

    expect(document.body.textContent).not.toContain('OPENAI')
    expect(document.body.textContent).not.toContain('API_KEY')
    expect(document.body.textContent).not.toContain('VECTOR_STORE')
  })
})
