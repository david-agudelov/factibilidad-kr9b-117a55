import type { SliderDefinition } from '../config/sliderConfig'
import { CORE_OPTIONS } from '../config/coreOptions'
import { SITE_CONSTANTS } from '../model/projectSource'
import type { FloorLimit, ModelParams } from '../model/types'

type SliderPanelProps = {
  params: ModelParams
  sliders: SliderDefinition[]
  floorLimit: FloorLimit
  adjustmentMessages: string[]
  setParam: (key: keyof ModelParams, value: ModelParams[keyof ModelParams]) => void
}

function displayValue(slider: SliderDefinition, params: ModelParams) {
  const value = params[slider.key]
  if (slider.step < 0.1) return value.toFixed(2)
  if (slider.step < 1) return value.toFixed(1)
  return String(value)
}

function formatNumber(value: number) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

export function SliderPanel({
  adjustmentMessages,
  floorLimit,
  params,
  setParam,
  sliders,
}: SliderPanelProps) {
  return (
    <aside className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Parametros parametricos</h2>
      </div>

      <div className="space-y-3 p-3">
        <section className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
          <h3 className="text-sm font-semibold text-slate-950">Datos oficiales del lote</h3>
          <p>Ancho {SITE_CONSTANTS.width} m / fondo {SITE_CONSTANTS.depth} m</p>
          <p>
            Area {SITE_CONSTANTS.area} m2 / perimetro{' '}
            {SITE_CONSTANTS.officialPerimeter} m
          </p>
          <p>
            ICe {SITE_CONSTANTS.iceIndex.toFixed(1)} ={' '}
            {formatNumber(SITE_CONSTANTS.area * SITE_CONSTANTS.iceIndex)} m2
          </p>
        </section>

        {sliders.map((slider) => {
          const rawValue = params[slider.key]

          return (
            <div key={slider.key} className="rounded-md border border-slate-200 bg-white p-3 transition hover:border-slate-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label
                    className="block text-sm font-medium text-slate-950"
                    htmlFor={`slider-${slider.key}`}
                  >
                    {slider.label}
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {slider.description}
                  </p>
                </div>
                <output
                  className="min-w-20 rounded-md bg-slate-950 px-2 py-1 text-right font-mono text-sm font-semibold tabular-nums text-amber-200"
                  htmlFor={`slider-${slider.key}`}
                >
                  {displayValue(slider, params)} {slider.unit}
                </output>
              </div>

              <input
                aria-label={slider.label}
                className="mt-3 h-2 w-full cursor-pointer accent-amber-600"
                id={`slider-${slider.key}`}
                max={slider.max}
                min={slider.min}
                onChange={(event) =>
                  setParam(slider.key, Number(event.target.value))
                }
                step={slider.step}
                type="range"
                value={rawValue}
              />
              <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500">
                <span>min {slider.min}</span>
                <span>step {slider.step}</span>
                <span>max {slider.max}</span>
              </div>
            </div>
          )
        })}

        <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <span>
            <span className="block text-sm font-medium text-slate-950">Modo ECOS</span>
            <span className="block text-xs text-slate-500">
              Sensibilidad pendiente; usa lateral desde{' '}
              {floorLimit.lateralOnsetHeight.toFixed(1)} m.
            </span>
          </span>
          <input
            aria-label="Modo ECOS"
            checked={params.ecosMode}
            className="h-5 w-5 accent-amber-600"
            onChange={(event) => setParam('ecosMode', event.target.checked)}
            type="checkbox"
          />
        </label>

        <label className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="block text-sm font-medium text-slate-950">
            Escenario de nucleo
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Supuesto preliminar para comparar area util; no modifica norma ni geometria.
          </span>
          <select
            aria-label="Escenario de nucleo"
            className="mt-3 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-700"
            onChange={(event) => setParam('coreOption', event.target.value as ModelParams['coreOption'])}
            value={params.coreOption}
          >
            {CORE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-amber-700">
            Escenario preliminar: el nucleo se descuenta de area util, no es una planta definitiva.
          </p>
        </label>

        {adjustmentMessages.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {adjustmentMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
