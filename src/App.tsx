import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Bot, Calculator, GraduationCap, Map as MapIcon, RotateCcw } from 'lucide-react'
import gsap from 'gsap'
import { MetricsPanel } from './components/MetricsPanel'
import { EcosExplainerPage } from './components/EcosExplainerPage'
import { EconomicDashboardPanel } from './components/EconomicDashboardPanel'
import { FunctionalPanel } from './components/FunctionalPanel'
import { MapPage } from './components/MapPage'
import { NormativeChat } from './components/NormativeChat/NormativeChat'
import { NormativeGuidePage } from './components/NormativeGuidePage'
import { SliderPanel } from './components/SliderPanel'
import { ViewportTabs } from './components/ViewportTabs'
import { envConfig } from './config/env'
import { buildLiveModelSnapshot } from './finance/liveModelSnapshot'
import { CASE_INFO } from './model/caseDefaults'
import { useParametricModel } from './state/useParametricModel'

function App() {
  const model = useParametricModel()
  const headerRef = useRef<HTMLElement>(null)
  const [activePage, setActivePage] = useState<'modeler' | 'ecos' | 'guide' | 'map'>('modeler')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const liveModelSnapshot = useMemo(
    () =>
      buildLiveModelSnapshot({
        envelope: model.envelope,
        geometry: model.geometry,
        metrics: model.metrics,
        params: model.params,
        validation: model.validation,
      }),
    [model.envelope, model.geometry, model.metrics, model.params, model.validation],
  )
  const chatParcelContext = useMemo(
    () => ({
      parcelInput: {
        address: `${CASE_INFO.name}, ${CASE_INFO.location}`,
        chip: '',
        lotId: CASE_INFO.caseId,
        geometry: null,
      },
    }),
    [],
  )
  const chatAppState = useMemo(
    () => ({
      floors: model.params.floors,
      floorHeight: model.params.floorHeight,
      ecosMode: model.params.ecosMode,
      envelope: model.envelope,
      metrics: model.metrics,
      validationWarnings: [
        ...model.validation.messages,
        ...model.envelope.normativeWarnings,
        ...model.adjustmentMessages,
      ],
    }),
    [
      model.adjustmentMessages,
      model.envelope,
      model.metrics,
      model.params.ecosMode,
      model.params.floorHeight,
      model.params.floors,
      model.validation.messages,
    ],
  )

  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
    )
  }, [])

  return (
    <main className="min-h-dvh bg-[#f3f6f8] text-slate-900">
      <header
        ref={headerRef}
        className="border-b border-slate-200 bg-white/95 px-3 py-2 sm:px-4"
      >
        <div className="mx-auto grid max-w-[1800px] gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="order-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
                {CASE_INFO.name}
              </h1>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                {CASE_INFO.location}
              </span>
            </div>
          </div>

          <div className="order-2 xl:order-3 xl:col-span-2">
            <p className="mt-1 max-w-4xl text-sm leading-5 text-slate-600">
              Sliders parametricos conectados a geometria, metricas y validacion.
              Cada cambio recalcula el modelo sin submit desde el PDF fuente.
            </p>
            <p className="mt-1 max-w-4xl text-xs leading-4 text-slate-500">
              Fuente:{' '}
              <a
                className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 transition hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
                href={CASE_INFO.sourcePdfHref}
                rel="noreferrer"
                target="_blank"
              >
                factibilidad_KR9B_117A55.pdf
              </a>
              .
            </p>
          </div>

          <div className="order-3 flex flex-col gap-3 sm:flex-row sm:items-center xl:order-2">
            <div className="grid w-full grid-cols-2 rounded-md border border-slate-200 bg-slate-100 p-0.5 sm:inline-flex sm:w-auto">
              <button
                type="button"
                onClick={() => setActivePage('modeler')}
                className={`inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded px-2 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-700 ${
                  activePage === 'modeler'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-700 hover:bg-white hover:text-slate-950'
                }`}
              >
                <Calculator size={14} aria-hidden="true" />
                Modelador
              </button>
              <button
                type="button"
                onClick={() => setActivePage('ecos')}
                className={`inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded px-2 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-700 ${
                  activePage === 'ecos'
                    ? 'bg-emerald-800 text-white'
                    : 'text-slate-700 hover:bg-white hover:text-emerald-900'
                }`}
              >
                <BookOpen size={14} aria-hidden="true" />
                Modo ECOS
              </button>
              <button
                type="button"
                onClick={() => setActivePage('guide')}
                className={`inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded px-2 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-700 ${
                  activePage === 'guide'
                    ? 'bg-amber-800 text-white'
                    : 'text-slate-700 hover:bg-white hover:text-amber-900'
                }`}
              >
                <GraduationCap size={14} aria-hidden="true" />
                Norma facil
              </button>
              <button
                type="button"
                onClick={() => setActivePage('map')}
                className={`inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded px-2 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-700 ${
                  activePage === 'map'
                    ? 'bg-sky-900 text-white'
                    : 'text-slate-700 hover:bg-white hover:text-sky-900'
                }`}
              >
                <MapIcon size={14} aria-hidden="true" />
                Mapa barrio
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('modeler')
                  setIsChatOpen((current) => !current)
                }}
                className={`inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded px-2 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-700 ${
                  isChatOpen
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-700 hover:bg-white hover:text-slate-950'
                }`}
                aria-expanded={isChatOpen}
                aria-controls="normative-chat-drawer"
              >
                <Bot size={14} aria-hidden="true" />
                Consulta normativa
              </button>
            </div>
            {activePage === 'modeler' ? (
              <button
                type="button"
                onClick={model.reset}
                className="inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition hover:border-amber-500 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-slate-700 sm:w-auto"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Reset caso real
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {activePage === 'ecos' ? <EcosExplainerPage /> : null}
      {activePage === 'guide' ? <NormativeGuidePage /> : null}
      {activePage === 'map' ? <MapPage /> : null}

      {activePage === 'modeler' ? (
        <section
          className="mx-auto grid max-w-[1800px] gap-3 px-3 py-3 sm:px-4 xl:h-[calc(100dvh-82px)] xl:grid-cols-[280px_minmax(0,1fr)_320px] xl:overflow-hidden"
          data-home-layout="compact-three-column"
          data-testid="modeler-home-layout"
        >
        <div className="min-h-0 xl:overflow-y-auto xl:pr-1">
          <SliderPanel
            adjustmentMessages={model.adjustmentMessages}
            floorLimit={model.floorLimit}
            params={model.params}
            setParam={model.setParam}
            sliders={model.sliders}
          />
        </div>

        <div
          className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:h-full xl:overflow-y-auto"
          data-testid="central-model-column"
        >
          <ViewportTabs
            envelope={model.envelope}
            geometry={model.geometry}
            params={model.params}
          />
          <FunctionalPanel functionality={model.functionality} />
        </div>

        <aside
          className="grid min-h-0 content-start gap-4 xl:overflow-y-auto xl:pl-1"
          data-testid="right-analysis-column"
        >
          <MetricsPanel metrics={model.metrics} />
          <EconomicDashboardPanel snapshot={liveModelSnapshot} />
          {isChatOpen ? (
            <div id="normative-chat-drawer">
              <NormativeChat
                appState={chatAppState}
                enabled={envConfig.ragEnabled}
                endpoint={envConfig.ragEndpoint}
                parcelContext={chatParcelContext}
              />
            </div>
          ) : null}
        </aside>
      </section>
      ) : null}
    </main>
  )
}

export default App
