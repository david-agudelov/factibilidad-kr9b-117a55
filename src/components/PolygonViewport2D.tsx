import type { ModelGeometry, ModelParams, NormativeEnvelope, Point } from '../model/types'
import { polygonToSvgPoints } from '../geometry/buildPolygon'
import { SITE_CONSTANTS } from '../model/projectSource'
import { ViewStatsCard } from './ViewStatsCard'
import {
  SHARED_VIEW_FRAME_CLASS,
  SHARED_VIEW_SCALE,
  VIEWPORT_SCALE,
} from '../config/viewportScale'

type PolygonViewport2DProps = {
  envelope: NormativeEnvelope
  geometry: ModelGeometry
  params: ModelParams
}

function SvgPolygon({
  className,
  points,
  scale,
}: {
  className: string
  points: Point[]
  scale: number
}) {
  if (points.length < 3) return null
  return <polygon className={className} points={polygonToSvgPoints(points, scale)} />
}

function formatNumber(value: number) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

export function PolygonViewport2D({ envelope, geometry, params }: PolygonViewport2DProps) {
  const scale = SHARED_VIEW_SCALE
  const canvasWidth = 520
  const canvasHeight = 520
  const plotWidth = geometry.boundingBox.width * scale
  const plotHeight = geometry.boundingBox.depth * scale
  const plotX = (canvasWidth - plotWidth) / 2
  const plotY = 112
  const plotBottom = plotY + plotHeight
  const statsLabelY = Math.min(480, plotBottom + 36)
  const statsValueY = statsLabelY + 20
  const translate = `translate(${plotX}, ${plotY})`

  return (
    <div className="overflow-auto bg-slate-50">
      <ViewStatsCard envelope={envelope} params={params} />
      <svg
        aria-label="Vista 2D del polígono y footprints"
        className={SHARED_VIEW_FRAME_CLASS}
        data-canvas-height={canvasHeight}
        data-canvas-width={canvasWidth}
        data-scale-mode="side-elevation-canvas"
        data-view-frame="shared-model-frame"
        data-visual-scale={scale.toFixed(2)}
        role="img"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      >
        <text fill="#92400e" fontSize="12" fontWeight="700" x="88" y="28">
          Altura total
        </text>
        <text fill="#92400e" fontSize="16" fontWeight="700" x="88" y="48">
          {formatNumber(envelope.totalHeight)} m
        </text>
        <text fill="#1e3a8a" fontSize="12" fontWeight="700" x="360" y="28">
          Niveles
        </text>
        <text fill="#1e3a8a" fontSize="16" fontWeight="700" x="360" y="48">
          {params.floors}
        </text>
        <g transform={translate}>
          <SvgPolygon
            className="fill-blue-50 stroke-blue-900 stroke-[0.08]"
            points={geometry.lot}
            scale={scale}
          />
          <SvgPolygon
            className="fill-emerald-400/40 stroke-emerald-800 stroke-[0.1]"
            points={geometry.lowerFootprint}
            scale={scale}
          />
          {geometry.upperFloors > 0 && (
            <SvgPolygon
              className="fill-sky-300/45 stroke-sky-800 stroke-[0.1]"
              points={geometry.upperFootprint}
              scale={scale}
            />
          )}
          <text
            fill="#0f766e"
            fontSize={VIEWPORT_SCALE.labelFontSize}
            fontWeight="700"
            x={SITE_CONSTANTS.width * scale * 0.48}
            y={(SITE_CONSTANTS.depth - geometry.effectiveRearSetback / 2) * scale}
          >
            Aislamiento posterior: {formatNumber(geometry.effectiveRearSetback)} m
          </text>
          {geometry.upperFloors > 0 && geometry.upperFootprint[0]?.x > 0 && (
            <text
              fill="#0f766e"
              fontSize={VIEWPORT_SCALE.labelFontSize}
              fontWeight="700"
              x={(geometry.upperFootprint[0].x * scale) + 2}
              y={VIEWPORT_SCALE.labelFontSize + 4}
            >
              Aislamiento lateral: {formatNumber(geometry.upperFootprint[0].x)} m
            </text>
          )}
        </g>
        <text fill="#475569" fontSize="11" fontWeight="700" x="88" y={statsLabelY}>
          Pisos
        </text>
        <text fill="#1e3a8a" fontSize="13" fontWeight="700" x="132" y={statsLabelY}>
          {params.floors}
        </text>
        <text fill="#475569" fontSize="11" fontWeight="700" x="88" y={statsValueY}>
          Altura entre pisos
        </text>
        <text fill="#1e3a8a" fontSize="13" fontWeight="700" x="200" y={statsValueY}>
          {formatNumber(params.floorHeight)} m
        </text>
        <text fill="#0f766e" fontSize="11" fontWeight="700" x="320" y={statsLabelY}>
          Aislamiento posterior
        </text>
        <text fill="#0f766e" fontSize="13" fontWeight="700" x="320" y={statsValueY}>
          {formatNumber(envelope.rearSetback)} m
        </text>
        {envelope.sideSetbackApplied > 0 && (
          <>
            <text fill="#0284c7" fontSize="11" fontWeight="700" x="320" y={statsLabelY - 44}>
              Aislamiento lateral
            </text>
            <text fill="#0284c7" fontSize="13" fontWeight="700" x="320" y={statsLabelY - 24}>
              {formatNumber(envelope.sideSetbackApplied)} m
            </text>
          </>
        )}
      </svg>
      <div className="mx-4 mb-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-emerald-400/70"></span>
          Footprint inferior
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-sky-300/80"></span>
          Footprint superior con retroceso lateral
        </span>
      </div>
    </div>
  )
}
