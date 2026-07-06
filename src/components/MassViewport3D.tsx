import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SITE_CONSTANTS } from '../model/projectSource'
import type { ModelGeometry, ModelParams, NormativeEnvelope } from '../model/types'
import { SHARED_VIEW_FRAME_CLASS, VIEWPORT_SCALE } from '../config/viewportScale'

type MassViewport3DProps = {
  envelope: NormativeEnvelope
  geometry: ModelGeometry
  params: ModelParams
}

export function MassViewport3D({ geometry, params }: MassViewport3DProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(import.meta.env.MODE === 'test')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    if (import.meta.env.MODE === 'test') {
      setUnavailable(true)
      return
    }

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setUnavailable(true)
      return
    }

    setUnavailable(false)
    const width = host.clientWidth || 640
    const height = host.clientHeight || VIEWPORT_SCALE.frameHeightPx
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.replaceChildren(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
    const initialDistance = VIEWPORT_SCALE.sideLotDepthPx / 12
    camera.position.set(
      SITE_CONSTANTS.width * 0.95,
      SITE_CONSTANTS.depth * 0.85,
      initialDistance,
    )
    camera.lookAt(SITE_CONSTANTS.width / 2, SITE_CONSTANTS.depth / 2, 5)

    const group = new THREE.Group()
    scene.add(group)
    const disposableGeometries: THREE.BufferGeometry[] = []
    const disposableMaterials: THREE.Material[] = []

    const lotGeometry = new THREE.BoxGeometry(
      SITE_CONSTANTS.width,
      0.08,
      SITE_CONSTANTS.depth,
    )
    const lotMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.8,
    })
    const lot = new THREE.Mesh(lotGeometry, lotMaterial)
    lot.position.set(SITE_CONSTANTS.width / 2, -0.05, SITE_CONSTANTS.depth / 2)
    group.add(lot)
    disposableGeometries.push(lotGeometry)
    disposableMaterials.push(lotMaterial)

    const lowerDepth =
      geometry.lowerFootprint[2]?.y - geometry.lowerFootprint[0]?.y || 0
    const lowerHeight = geometry.lowerHeight
    const lowerMassGeometry = new THREE.BoxGeometry(SITE_CONSTANTS.width, lowerHeight, lowerDepth)
    const lowerMassMaterial = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.72,
        roughness: 0.55,
      })
    const lowerMass = new THREE.Mesh(lowerMassGeometry, lowerMassMaterial)
    lowerMass.position.set(
      SITE_CONSTANTS.width / 2,
      lowerHeight / 2,
      lowerDepth / 2,
    )
    group.add(lowerMass)
    disposableGeometries.push(lowerMassGeometry)
    disposableMaterials.push(lowerMassMaterial)

    if (geometry.upperHeight > 0) {
      const upperWidth = Math.max(
        0.01,
        geometry.upperFootprint[1]?.x - geometry.upperFootprint[0]?.x || 0,
      )
      const upperHeight = geometry.upperHeight
      const upperMassGeometry = new THREE.BoxGeometry(upperWidth, upperHeight, lowerDepth)
      const upperMassMaterial = new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          transparent: true,
          opacity: 0.66,
          roughness: 0.5,
        })
      const upperMass = new THREE.Mesh(upperMassGeometry, upperMassMaterial)
      upperMass.position.set(
        SITE_CONSTANTS.width / 2,
        lowerHeight + upperHeight / 2,
        lowerDepth / 2,
      )
      group.add(upperMass)
      disposableGeometries.push(upperMassGeometry)
      disposableMaterials.push(upperMassMaterial)
    }

    const addFloorContour = (
      floor: number,
      width: number,
      depth: number,
      xStart: number,
      color: number,
    ) => {
      const y = floor * params.floorHeight
      const points = [
        new THREE.Vector3(xStart, y, 0),
        new THREE.Vector3(xStart + width, y, 0),
        new THREE.Vector3(xStart + width, y, depth),
        new THREE.Vector3(xStart, y, depth),
        new THREE.Vector3(xStart, y, 0),
      ]
      const contourGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const contourMaterial = new THREE.LineBasicMaterial({ color, linewidth: 2 })
      const contour = new THREE.Line(contourGeometry, contourMaterial)
      group.add(contour)
      disposableGeometries.push(contourGeometry)
      disposableMaterials.push(contourMaterial)
    }

    for (let floor = 1; floor <= params.floors; floor += 1) {
      if (floor <= geometry.lowerFloors || geometry.upperHeight === 0) {
        addFloorContour(floor, SITE_CONSTANTS.width, lowerDepth, 0, 0x15803d)
      } else {
        const upperWidth = Math.max(
          0.01,
          geometry.upperFootprint[1]?.x - geometry.upperFootprint[0]?.x || 0,
        )
        addFloorContour(floor, upperWidth, lowerDepth, geometry.upperFootprint[0]?.x || 0, 0x0284c7)
      }
    }

    const grid = new THREE.GridHelper(36, 18, 0x334155, 0x1e293b)
    grid.position.set(SITE_CONSTANTS.width / 2, 0, SITE_CONSTANTS.depth / 2)
    group.add(grid)

    const light = new THREE.DirectionalLight(0xffffff, 2.2)
    light.position.set(12, 24, 18)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0x94a3b8, 1.1))

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.minDistance = 18
    controls.maxDistance = 90
    controls.target.set(SITE_CONSTANTS.width / 2, lowerHeight / 2, SITE_CONSTANTS.depth / 2)
    controls.update()

    gsap.fromTo(
      group.scale,
      { x: 0.94, y: 0.94, z: 0.94 },
      { x: 1, y: 1, z: 1, duration: 0.35, ease: 'power2.out' },
    )

    let frame = 0
    const animate = () => {
      frame = window.requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.cancelAnimationFrame(frame)
      controls.dispose()
      renderer.dispose()
      disposableGeometries.forEach((item) => item.dispose())
      disposableMaterials.forEach((item) => item.dispose())
    }
  }, [geometry, params])

  if (unavailable) {
    return (
      <div className="bg-slate-50">
        <p
          className="border-b border-slate-200 bg-white px-4 py-2 text-xs font-medium text-sky-800"
          data-testid="view-floor-contours"
        >
          Contornos por piso: {params.floors}
        </p>
        <div
          className={`${SHARED_VIEW_FRAME_CLASS} flex items-center justify-center p-6 text-center text-sm text-slate-400`}
          data-initial-scale="side-elevation"
          data-testid="mass-viewport"
          data-view-frame="shared-model-frame"
        >
          Vista 3D no disponible en este entorno de prueba. En navegador se renderiza
          con WebGL y controles para orbitar el volumen.
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-slate-50">
      <p className="absolute left-4 top-32 z-10 rounded-md border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-medium text-emerald-900">
        Arrastra para orbitar, rueda para zoom.
      </p>
      <p
        className="border-b border-slate-200 bg-white px-4 py-2 text-xs font-medium text-sky-800"
        data-testid="view-floor-contours"
      >
        Contornos por piso: {params.floors}
      </p>
      <div
        className={`${SHARED_VIEW_FRAME_CLASS} overflow-hidden`}
        data-initial-scale="side-elevation"
        data-testid="mass-viewport"
        data-view-frame="shared-model-frame"
        ref={hostRef}
      />
    </div>
  )
}
