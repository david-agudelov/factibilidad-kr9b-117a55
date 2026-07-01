import { useMemo, useReducer } from 'react'
import { compareWithPdfSource } from '../calibration/compareWithPdfSource'
import { getSliderConfig } from '../config/sliderConfig'
import { computeFunctionalEnvelope } from '../functionality/computeFunctionalEnvelope'
import { buildPolygon } from '../geometry/buildPolygon'
import { validatePolygon } from '../geometry/validatePolygon'
import { computeMetrics } from '../metrics/computeMetrics'
import { DEFAULT_PARAMS } from '../model/caseDefaults'
import type { ModelParams } from '../model/types'
import { modelReducer, resolveParamsForLiveModel } from './modelReducer'

export function useParametricModel(initialParams: ModelParams = DEFAULT_PARAMS) {
  const [params, dispatch] = useReducer(
    modelReducer,
    resolveParamsForLiveModel(initialParams).params,
  )

  const resolved = useMemo(() => resolveParamsForLiveModel(params), [params])
  const geometry = useMemo(() => buildPolygon(resolved.params), [resolved.params])
  const validation = useMemo(
    () => validatePolygon(geometry, resolved.params),
    [geometry, resolved.params],
  )
  const functionality = useMemo(
    () => computeFunctionalEnvelope(resolved.params, geometry, resolved.envelope),
    [geometry, resolved.params, resolved.envelope],
  )
  const metrics = useMemo(
    () => computeMetrics(geometry, resolved.params, resolved.envelope, functionality),
    [functionality, geometry, resolved.params, resolved.envelope],
  )
  const pdfComparison = useMemo(
    () => compareWithPdfSource(resolved.params, geometry, resolved.envelope),
    [geometry, resolved.params, resolved.envelope],
  )
  const sliders = useMemo(
    () => getSliderConfig(resolved.floorLimit),
    [resolved.floorLimit],
  )

  return {
    params: resolved.params,
    geometry,
    validation,
    functionality,
    metrics,
    pdfComparison,
    envelope: resolved.envelope,
    floorLimit: resolved.floorLimit,
    sliders,
    adjustmentMessages: resolved.adjustmentMessages,
    setParam: (key: keyof ModelParams, value: ModelParams[keyof ModelParams]) =>
      dispatch({ type: 'set-param', key, value }),
    reset: () => dispatch({ type: 'reset', params: DEFAULT_PARAMS }),
  }
}
