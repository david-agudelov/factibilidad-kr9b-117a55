import type { ModelParams, NormativeEnvelope } from '../model/types'
import { SITE_CONSTANTS } from '../model/projectSource'
import { ViewStatsCard } from './ViewStatsCard'
import { SHARED_VIEW_FRAME_CLASS, VIEWPORT_SCALE } from '../config/viewportScale'

type SideElevationViewportProps = {
  params: ModelParams
  envelope: NormativeEnvelope
}

function formatNumber(value: number) {
  return value.toLocaleString('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

export function SideElevationViewport({
  envelope,
  params,
}: SideElevationViewportProps) {
  const floorCount = params.floors
  const floorHeight = params.floorHeight
  const levelHeight = 34
  const baseY = 96 + floorCount * levelHeight
  const lotDepthWidth = VIEWPORT_SCALE.sideLotDepthPx
  const massDepthWidth = Math.max(
    0,
    lotDepthWidth * ((SITE_CONSTANTS.depth - envelope.rearSetback) / SITE_CONSTANTS.depth),
  )
  const setbackWidth = lotDepthWidth - massDepthWidth
  const plateX = 88
  const viewHeight = baseY + 60
  const levels = Array.from({ length: floorCount }, (_, index) => index + 1)

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <ViewStatsCard envelope={envelope} params={params} />
      <svg
        aria-label="Vista lateral por niveles"
        className={SHARED_VIEW_FRAME_CLASS}
        data-view-frame="shared-model-frame"
        role="img"
        viewBox={`0 0 520 ${viewHeight}`}
      >
        <rect
          fill="#ecfdf5"
          height={floorCount * levelHeight}
          opacity="0.76"
          width={massDepthWidth}
          x={plateX}
          y={baseY - floorCount * levelHeight}
        />
        <rect
          fill="#f8fafc"
          height={floorCount * levelHeight}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
          strokeWidth="1"
          width={setbackWidth}
          x={plateX + massDepthWidth}
          y={baseY - floorCount * levelHeight}
        />
        <rect
          fill="none"
          height={floorCount * levelHeight}
          stroke="#1e3a8a"
          strokeOpacity="0.28"
          strokeWidth="1"
          width={lotDepthWidth}
          x={plateX}
          y={baseY - floorCount * levelHeight}
        />
        <line
          stroke="#1e3a8a"
          strokeWidth="2"
          x1={plateX}
          x2={plateX + lotDepthWidth}
          y1={baseY}
          y2={baseY}
        />

        {levels.map((level) => {
          const y = baseY - level * levelHeight
          const centerY = y + levelHeight / 2

          return (
            <g key={level}>
              <line
                stroke={level > envelope.lowerFloors ? '#0284c7' : '#1e40af'}
                strokeOpacity="0.82"
                strokeWidth="1.25"
                x1={plateX}
                x2={plateX + massDepthWidth}
                y1={y}
                y2={y}
              />
              <rect
                fill={level > envelope.lowerFloors ? '#7dd3fc' : '#22c55e'}
                height="4"
                rx="1"
                width={massDepthWidth}
                x={plateX}
                y={y - 2}
              />
              <text
                fill="#1e3a8a"
                fontSize="12"
                fontWeight="600"
                x="26"
                y={centerY + 4}
              >
                Nivel {level}
              </text>
              <text fill="#64748b" fontSize="10" x={plateX + lotDepthWidth + 16} y={centerY + 4}>
                {formatNumber(level * floorHeight)} m
              </text>
            </g>
          )
        })}

        <line
          stroke="#d97706"
          strokeDasharray="4 4"
          strokeWidth="1.5"
          x1={plateX + lotDepthWidth + 70}
          x2={plateX + lotDepthWidth + 70}
          y1={baseY - floorCount * levelHeight}
          y2={baseY}
        />
        <text
          fill="#92400e"
          fontSize="12"
          fontWeight="700"
          x={plateX}
          y="28"
        >
          Altura total
        </text>
        <text
          fill="#92400e"
          fontSize="16"
          fontWeight="700"
          x={plateX}
          y="48"
        >
          {formatNumber(envelope.totalHeight)} m
        </text>
        <line
          stroke="#0f766e"
          strokeDasharray="3 3"
          strokeWidth="1.4"
          x1={plateX + massDepthWidth}
          x2={plateX + massDepthWidth}
          y1={baseY - floorCount * levelHeight - 10}
          y2={baseY + 8}
        />
        <text fill="#0f766e" fontSize="11" fontWeight="700" x={plateX + massDepthWidth + 8} y={baseY + 28}>
          Aislamiento posterior
        </text>
        <text fill="#0f766e" fontSize="13" fontWeight="700" x={plateX + massDepthWidth + 8} y={baseY + 44}>
          {formatNumber(envelope.rearSetback)} m
        </text>
        <g>
          <text fill="#475569" fontSize="11" fontWeight="700" x={plateX} y={baseY + 28}>
            Pisos
          </text>
          <text fill="#1e3a8a" fontSize="13" fontWeight="700" x={plateX + 42} y={baseY + 28}>
            {floorCount}
          </text>
          <text fill="#475569" fontSize="11" fontWeight="700" x={plateX} y={baseY + 46}>
            Altura entre pisos
          </text>
          <text fill="#1e3a8a" fontSize="13" fontWeight="700" x={plateX + 112} y={baseY + 46}>
            {formatNumber(floorHeight)} m
          </text>
        </g>
      </svg>
    </div>
  )
}
