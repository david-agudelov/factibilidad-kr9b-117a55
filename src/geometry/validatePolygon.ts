import { NORMATIVE_RULES, SITE_CONSTANTS } from '../model/projectSource'
import type { ModelGeometry, ModelParams, Point, ValidationResult } from '../model/types'
import { polygonArea, segmentIntersection } from './polygonMath'

export function hasSelfIntersections(points: Point[]) {
  if (points.length < 4) return false

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]

    for (let j = i + 1; j < points.length; j += 1) {
      const adjacent = Math.abs(i - j) <= 1 || (i === 0 && j === points.length - 1)
      if (adjacent) continue

      const c = points[j]
      const d = points[(j + 1) % points.length]
      if (segmentIntersection(a, b, c, d)) return true
    }
  }

  return false
}

export function validatePolygon(
  geometry: ModelGeometry,
  params: ModelParams,
): ValidationResult {
  const messages: string[] = []
  const warnings: string[] = []
  const usefulUpperWidth =
    geometry.upperFootprint[1]?.x - geometry.upperFootprint[0]?.x || 0

  if (params.floors < NORMATIVE_RULES.minFloors) {
    messages.push('El modelo debe evaluar minimo 2 pisos.')
  }

  if (params.floors * params.floorHeight > NORMATIVE_RULES.preliminaryMaxHeight) {
    messages.push('La altura total supera el limite preliminar de 27 m del PDF.')
  }

  if (polygonArea(geometry.lowerFootprint) <= 0) {
    messages.push('La huella inferior no tiene area positiva.')
  }

  if (
    geometry.upperHeight > 0 &&
    usefulUpperWidth < NORMATIVE_RULES.minUsefulUpperWidth
  ) {
    messages.push('El ancho util superior queda por debajo del minimo operativo.')
  }

  if (SITE_CONSTANTS.width <= 0) {
    messages.push('El ancho oficial del lote no permite una huella valida.')
  }

  if (
    hasSelfIntersections(geometry.lot) ||
    hasSelfIntersections(geometry.lowerFootprint) ||
    hasSelfIntersections(geometry.upperFootprint)
  ) {
    messages.push('El poligono resultante tiene autointersecciones.')
  }

  if (geometry.lateralOnsetCutsFloor && geometry.lateralTransitionFloor) {
    warnings.push(
      `El aislamiento lateral inicia dentro del piso ${geometry.lateralTransitionFloor}; por criterio conservador, el piso completo se modela con aislamiento.`,
    )
  }

  const isValid = messages.length === 0
  const severity = !isValid ? 'error' : warnings.length > 0 ? 'warning' : 'ok'
  const visibleMessages = [...messages, ...warnings]

  return {
    isValid,
    severity,
    messages:
      visibleMessages.length === 0
        ? ['Geometria valida para exploracion preliminar.']
        : visibleMessages,
  }
}
