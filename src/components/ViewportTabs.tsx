import { useState } from 'react'
import { Box, Layers3, Ruler } from 'lucide-react'
import { MassViewport3D } from './MassViewport3D'
import { PolygonViewport2D } from './PolygonViewport2D'
import { SideElevationViewport } from './SideElevationViewport'
import { SHARED_VIEW_SCALE } from '../config/viewportScale'
import type { ModelGeometry, ModelParams, NormativeEnvelope } from '../model/types'

type ViewportTabsProps = {
  geometry: ModelGeometry
  params: ModelParams
  envelope: NormativeEnvelope
}

type ViewTabId = 'side' | 'footprint' | 'mass'

const tabs: Array<{ id: ViewTabId; label: string }> = [
  { id: 'side', label: 'Vista lateral' },
  { id: 'footprint', label: 'Footprint 2D' },
  { id: 'mass', label: 'Masa 3D' },
]

const iconClass = 'h-4 w-4'

function TabIcon({ id }: { id: ViewTabId }) {
  if (id === 'side') return <Ruler className={iconClass} aria-hidden="true" />
  if (id === 'footprint') return <Layers3 className={iconClass} aria-hidden="true" />
  return <Box className={iconClass} aria-hidden="true" />
}

export function ViewportTabs({ envelope, geometry, params }: ViewportTabsProps) {
  const [activeTab, setActiveTab] = useState<ViewTabId>('side')

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Visualizacion del modelo</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ventana fija para revisar niveles, footprint y masa sin perder contexto.
          </p>
        </div>
        <div
          aria-label="Vistas del modelo"
          className="inline-flex max-w-full overflow-x-auto rounded-md border border-slate-200 bg-white p-1"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab

            return (
              <button
                aria-controls={`viewport-panel-${tab.id}`}
                aria-selected={isActive}
                className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-700 ${
                  isActive
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
                id={`viewport-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                <TabIcon id={tab.id} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        aria-labelledby={`viewport-tab-${activeTab}`}
        className="min-h-0"
        data-visual-panel="stable-height"
        id={`viewport-panel-${activeTab}`}
        role="tabpanel"
      >
        {activeTab === 'side' && (
          <SideElevationViewport envelope={envelope} params={params} />
        )}
        {activeTab === 'footprint' && (
          <div>
            <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
              Escala madre vista lateral: {SHARED_VIEW_SCALE.toFixed(2)} px/m
            </div>
            <PolygonViewport2D envelope={envelope} geometry={geometry} params={params} />
          </div>
        )}
        {activeTab === 'mass' && (
          <div>
            <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
              {params.floors} pisos / altura total {envelope.totalHeight.toFixed(2)} m
            </div>
            <MassViewport3D envelope={envelope} geometry={geometry} params={params} />
          </div>
        )}
      </div>
    </section>
  )
}
