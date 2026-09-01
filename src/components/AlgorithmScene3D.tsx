import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type {
  AlgorithmFrame,
  SceneEdge,
  SceneEntity,
  SceneEntityShape,
  SceneEntityState,
} from '../data/algorithm-scenes'

const STATE_COLORS: Record<SceneEntityState, string> = {
  idle: '#7f9187',
  active: '#4ec08c',
  compare: '#f0ac4f',
  candidate: '#72b7e7',
  pivot: '#b59ada',
  frontier: '#58aee2',
  visited: '#58c493',
  path: '#f1c65b',
  done: '#70d7a5',
  muted: '#28342d',
  bad: '#ec7d7d',
}

const FALLBACK_STYLES: Record<SceneEntityState, string> = {
  idle: 'border-white/15 bg-white/5 text-white/55',
  active: 'border-[#4ec08c] bg-[#17392b] text-[#a4e7c5]',
  compare: 'border-[#f0ac4f] bg-[#3a2a16] text-[#f4c778]',
  candidate: 'border-[#72b7e7] bg-[#1d3242] text-[#a9d8fa]',
  pivot: 'border-[#b59ada] bg-[#302842] text-[#d4c4ef]',
  frontier: 'border-[#58aee2] bg-[#1d3242] text-[#a9d8fa]',
  visited: 'border-[#58c493] bg-[#17392b] text-[#a4e7c5]',
  path: 'border-[#f1c65b] bg-[#3a2a16] text-[#f4d77d]',
  done: 'border-[#70d7a5] bg-[#17392b] text-[#b5efd0]',
  muted: 'border-white/5 bg-white/[.025] text-white/20',
  bad: 'border-[#ec7d7d] bg-[#422222] text-[#ffb0b0]',
}

interface EntityObject {
  group: THREE.Group
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
  label: THREE.Sprite
  targetPosition: THREE.Vector3
  targetScale: THREE.Vector3
  targetColor: THREE.Color
  targetOpacity: number
  state: SceneEntityState
  labelText: string
}

interface EdgeObject {
  group: THREE.Group
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>
  arrow: THREE.Mesh<THREE.ConeGeometry, THREE.MeshStandardMaterial> | null
  definition: SceneEdge
}

interface RendererState {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  entities: Map<string, EntityObject>
  edges: Map<string, EdgeObject>
  frame: AlgorithmFrame
  animationFrame: number
  resizeObserver: ResizeObserver
  disposed: boolean
}

function geometryFor(shape: SceneEntityShape) {
  if (shape === 'sphere') return new THREE.SphereGeometry(0.5, 32, 20)
  if (shape === 'cylinder') return new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
  if (shape === 'tile') return new THREE.BoxGeometry(1, 0.16, 1)
  if (shape === 'ring') return new THREE.TorusGeometry(0.55, 0.14, 16, 40)
  return new THREE.BoxGeometry(1, 1, 1)
}

function labelTexture(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 112
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(7, 14, 10, 0.78)'
  context.beginPath()
  context.roundRect(6, 8, canvas.width - 12, canvas.height - 16, 18)
  context.fill()
  context.strokeStyle = 'rgba(255,255,255,0.18)'
  context.lineWidth = 2
  context.stroke()
  const fontSize = text.length > 9 ? 34 : text.length > 5 ? 42 : 52
  context.font = `700 ${fontSize}px "JetBrains Mono", monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#f4f8f5'
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2, canvas.width - 30)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  return texture
}

function makeLabel(text: string) {
  const material = new THREE.SpriteMaterial({ map: labelTexture(text), transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  const width = Math.min(2.25, Math.max(0.9, text.length * 0.18))
  sprite.scale.set(width, 0.58, 1)
  sprite.renderOrder = 20
  return sprite
}

function disposeLabel(sprite: THREE.Sprite) {
  const material = sprite.material as THREE.SpriteMaterial
  material.map?.dispose()
  material.dispose()
}

function createEntity(entity: SceneEntity) {
  const material = new THREE.MeshStandardMaterial({
    color: STATE_COLORS[entity.state],
    roughness: 0.38,
    metalness: 0.08,
    transparent: true,
    opacity: entity.state === 'muted' ? 0.34 : 1,
    emissive: STATE_COLORS[entity.state],
    emissiveIntensity: entity.state === 'active' || entity.state === 'pivot' ? 0.18 : 0.04,
  })
  const mesh = new THREE.Mesh(geometryFor(entity.shape), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  const label = makeLabel(entity.label)
  const group = new THREE.Group()
  group.add(mesh, label)
  group.position.set(...entity.position)
  mesh.scale.set(...entity.scale)
  label.position.set(0, entity.scale[1] / 2 + 0.5, 0)
  return {
    group,
    mesh,
    label,
    targetPosition: new THREE.Vector3(...entity.position),
    targetScale: new THREE.Vector3(...entity.scale),
    targetColor: new THREE.Color(STATE_COLORS[entity.state]),
    targetOpacity: entity.state === 'muted' ? 0.34 : 1,
    state: entity.state,
    labelText: entity.label,
  } satisfies EntityObject
}

function updateEntity(object: EntityObject, entity: SceneEntity) {
  object.targetPosition.set(...entity.position)
  object.targetScale.set(...entity.scale)
  object.targetColor.set(STATE_COLORS[entity.state])
  object.targetOpacity = entity.state === 'muted' ? 0.34 : 1
  object.state = entity.state
  object.mesh.material.emissive.set(STATE_COLORS[entity.state])
  object.mesh.material.emissiveIntensity = entity.state === 'active' || entity.state === 'pivot' || entity.state === 'frontier' ? 0.2 : 0.04
  if (object.labelText !== entity.label) {
    object.group.remove(object.label)
    disposeLabel(object.label)
    object.label = makeLabel(entity.label)
    object.group.add(object.label)
    object.labelText = entity.label
  }
  object.label.position.set(0, entity.scale[1] / 2 + 0.5, 0)
}

function createEdge(definition: SceneEdge) {
  const color = new THREE.Color(STATE_COLORS[definition.state ?? 'idle'])
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: definition.state === 'muted' ? 0.25 : 0.74 }),
  )
  const arrow = definition.directed
    ? new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }))
    : null
  const group = new THREE.Group()
  group.add(line)
  if (arrow) group.add(arrow)
  return { group, line, arrow, definition } satisfies EdgeObject
}

function updateEdge(edge: EdgeObject, entities: Map<string, EntityObject>) {
  const from = entities.get(edge.definition.from)?.group.position
  const to = entities.get(edge.definition.to)?.group.position
  if (!from || !to) {
    edge.group.visible = false
    return
  }
  edge.group.visible = true
  const direction = new THREE.Vector3().subVectors(to, from)
  const length = direction.length()
  if (!length) return
  const normalized = direction.clone().normalize()
  const start = from.clone().addScaledVector(normalized, 0.48)
  const end = to.clone().addScaledVector(normalized, -0.48)
  edge.line.geometry.setFromPoints([start, end])
  if (edge.arrow) {
    edge.arrow.position.copy(end).addScaledVector(normalized, -0.08)
    edge.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalized)
  }
}

function applyFrame(state: RendererState, frame: AlgorithmFrame) {
  state.frame = frame
  const incoming = new Set(frame.entities.map((entity) => entity.id))
  state.entities.forEach((object, id) => {
    if (incoming.has(id)) return
    state.scene.remove(object.group)
    object.mesh.geometry.dispose()
    object.mesh.material.dispose()
    disposeLabel(object.label)
    state.entities.delete(id)
  })
  frame.entities.forEach((entity) => {
    const existing = state.entities.get(entity.id)
    if (existing) updateEntity(existing, entity)
    else {
      const created = createEntity(entity)
      created.group.scale.setScalar(0.01)
      state.entities.set(entity.id, created)
      state.scene.add(created.group)
    }
  })

  const edgeIds = new Set(frame.edges.map((edge) => edge.id))
  state.edges.forEach((edge, id) => {
    if (edgeIds.has(id)) return
    state.scene.remove(edge.group)
    edge.line.geometry.dispose()
    edge.line.material.dispose()
    edge.arrow?.geometry.dispose()
    edge.arrow?.material.dispose()
    state.edges.delete(id)
  })
  frame.edges.forEach((definition) => {
    const existing = state.edges.get(definition.id)
    if (existing) existing.definition = definition
    else {
      const created = createEdge(definition)
      state.edges.set(definition.id, created)
      state.scene.add(created.group)
    }
  })
}

function renderSettledFrame(state: RendererState) {
  state.entities.forEach((object) => {
    object.group.position.copy(object.targetPosition)
    object.group.scale.setScalar(1)
    object.mesh.scale.copy(object.targetScale)
    object.mesh.material.color.copy(object.targetColor)
    object.mesh.material.opacity = object.targetOpacity
  })
  state.edges.forEach((sceneEdge) => updateEdge(sceneEdge, state.entities))
  state.controls.update()
  state.renderer.render(state.scene, state.camera)
}

function disposeState(state: RendererState) {
  state.disposed = true
  cancelAnimationFrame(state.animationFrame)
  state.resizeObserver.disconnect()
  state.controls.dispose()
  state.entities.forEach((object) => {
    object.mesh.geometry.dispose()
    object.mesh.material.dispose()
    disposeLabel(object.label)
  })
  state.edges.forEach((edge) => {
    edge.line.geometry.dispose()
    edge.line.material.dispose()
    edge.arrow?.geometry.dispose()
    edge.arrow?.material.dispose()
  })
  state.renderer.dispose()
  state.renderer.domElement.remove()
}

function canCreateWebGLContext() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

function WebGLFallback({ frame }: { frame: AlgorithmFrame }) {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-auto bg-[#08110c] p-5" data-render-fallback="true">
      <div className="w-full max-w-3xl rounded-[7px] border border-white/10 bg-white/[.035] p-4">
        <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-extrabold uppercase text-[#74d6a8]">Accessible state map</p><span className="rounded-[4px] bg-white/5 px-2 py-1 text-[9px] font-bold text-white/35">WebGL unavailable</span></div>
        <div className="mt-4 flex min-h-40 flex-wrap items-center justify-center gap-3">{frame.entities.map((entity) => <div key={entity.id} className={`flex min-h-14 min-w-14 items-center justify-center rounded-[6px] border px-3 py-2 font-mono text-xs font-bold ${FALLBACK_STYLES[entity.state]}`}>{entity.label}</div>)}</div>
        {frame.edges.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-white/10 pt-4">{frame.edges.map((sceneEdge) => <span key={sceneEdge.id} className="font-mono text-[9px] text-white/35">{sceneEdge.from.replace('node-', '')} {sceneEdge.directed ? '→' : '—'} {sceneEdge.to.replace('node-', '')}</span>)}</div>}
        <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">The same playback, prediction, code, and invariant controls remain active. Enable hardware acceleration for the spatial 3D view.</p>
      </div>
    </div>
  )
}

export function AlgorithmScene3D({ frame, sceneId }: { frame: AlgorithmFrame; sceneId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<RendererState | null>(null)
  const initialFrameRef = useRef(frame)
  const [webglAvailable] = useState(canCreateWebGLContext)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const initialFrame = initialFrameRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#08110c')
    scene.fog = new THREE.Fog('#08110c', 13, 28)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    const baseCamera = initialFrame.camera ?? [0, 3.5, 10]
    camera.position.set(...baseCamera)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.target.set(0, 0.2, 0)
    controls.minDistance = 5
    controls.maxDistance = 20
    controls.maxPolarAngle = Math.PI * 0.78

    scene.add(new THREE.HemisphereLight('#d9fff0', '#102219', 2.1))
    const keyLight = new THREE.DirectionalLight('#ffffff', 3.2)
    keyLight.position.set(5, 9, 7)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    scene.add(keyLight)
    const accentLight = new THREE.PointLight('#4ec08c', 16, 18, 2)
    accentLight.position.set(-5, 2, 4)
    scene.add(accentLight)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 22),
      new THREE.MeshStandardMaterial({ color: '#0d1a12', roughness: 0.9, metalness: 0.04 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.72
    floor.receiveShadow = true
    scene.add(floor)
    const grid = new THREE.GridHelper(24, 24, '#214b35', '#132b1e')
    grid.position.y = -1.7
    scene.add(grid)

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      camera.aspect = width / height
      const portraitScale = camera.aspect < 1 ? Math.min(1.65, 1 + (1 - camera.aspect) * 0.85) : 1
      camera.position.set(baseCamera[0], baseCamera[1], baseCamera[2] * portraitScale)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()
    const state: RendererState = {
      scene,
      camera,
      renderer,
      controls,
      entities: new Map(),
      edges: new Map(),
      frame: initialFrame,
      animationFrame: 0,
      resizeObserver,
      disposed: false,
    }
    stateRef.current = state
    applyFrame(state, initialFrame)
    renderSettledFrame(state)
    container.dataset.renderReady = 'true'
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let previousTime = performance.now()
    const render = (time: number) => {
      if (state.disposed) return
      const delta = Math.min(0.05, (time - previousTime) / 1000)
      previousTime = time
      const blend = reducedMotion ? 1 : 1 - Math.exp(-9 * delta)
      state.entities.forEach((object) => {
        object.group.position.lerp(object.targetPosition, blend)
        object.group.scale.lerp(new THREE.Vector3(1, 1, 1), blend)
        object.mesh.scale.lerp(object.targetScale, blend)
        object.mesh.material.color.lerp(object.targetColor, blend)
        object.mesh.material.opacity += (object.targetOpacity - object.mesh.material.opacity) * blend
        if (!reducedMotion && (object.state === 'active' || object.state === 'pivot')) {
          object.mesh.rotation.y = Math.sin(time * 0.002) * 0.08
        } else object.mesh.rotation.y *= 0.88
      })
      state.edges.forEach((edge) => updateEdge(edge, state.entities))
      controls.update()
      renderer.render(scene, camera)
      container.dataset.renderReady = 'true'
      state.animationFrame = requestAnimationFrame(render)
    }
    state.animationFrame = requestAnimationFrame(render)
    return () => disposeState(state)
  }, [])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    applyFrame(state, frame)
    if (document.visibilityState === 'hidden' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderSettledFrame(state)
    }
  }, [frame])

  if (!webglAvailable) return <WebGLFallback frame={frame} />
  return <div ref={containerRef} className="h-full w-full" role="img" aria-label={`Interactive 3D view: ${frame.title}`} data-scene-id={sceneId} />
}