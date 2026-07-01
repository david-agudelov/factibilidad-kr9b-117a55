import type { BoundingBox, Point } from '../model/types'

export function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function makeRectangle(
  x: number,
  y: number,
  width: number,
  depth: number,
): Point[] {
  const safeWidth = Math.max(0, width)
  const safeDepth = Math.max(0, depth)
  return [
    { x, y },
    { x: x + safeWidth, y },
    { x: x + safeWidth, y: y + safeDepth },
    { x, y: y + safeDepth },
  ]
}

export function polygonArea(points: Point[]) {
  if (points.length < 3) return 0

  const sum = points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length]
    return total + point.x * next.y - next.x * point.y
  }, 0)

  return Math.abs(sum) / 2
}

export function polygonPerimeter(points: Point[]) {
  if (points.length < 2) return 0

  return points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length]
    return total + Math.hypot(next.x - point.x, next.y - point.y)
  }, 0)
}

export function boundingBox(points: Point[]): BoundingBox {
  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, depth: 0 }
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    depth: maxY - minY,
  }
}

export function segmentIntersection(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
) {
  const orientation = (p: Point, q: Point, r: Point) =>
    (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)

  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)

  return o1 * o2 < 0 && o3 * o4 < 0
}
