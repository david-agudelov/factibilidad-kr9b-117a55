import { SITE_CONSTANTS } from '../model/projectSource'

export const VIEWPORT_SCALE = {
  sideLotDepthPx: 330,
  labelFontSize: 16,
  frameHeightPx: 520,
}

export const SHARED_VIEW_SCALE = Number(
  (VIEWPORT_SCALE.sideLotDepthPx / SITE_CONSTANTS.depth).toFixed(2),
)

export const SHARED_VIEW_FRAME_CLASS =
  'mx-auto my-4 h-[520px] min-h-[520px] w-[calc(100%-2rem)] max-w-[760px] rounded border border-blue-100 bg-[#fffdf8]'
