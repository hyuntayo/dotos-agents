import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import type { BodyKind, ColorKey } from './sprites'

// Four original characters: smooth rounded shapes, dot eyes and one accessory each.
// This same source produces the GLBs, transparent thumbnails and the interactive models.
export const MODEL_COLORS: Record<ColorKey, string> = {
  violet: '#657ee6', amber: '#e9b944', mint: '#8da990', pink: '#e9784b', sky: '#72b6ca',
}
export const MODEL_NAMES: Record<BodyKind, string> = { blob: 'BOB', bot: 'MAX', owl: 'IGGY', star: 'NOVA' }

/** Where the middle of every dot floats and how big it is; the camera, taps and animation are tuned to this. */
export const DOT = { center: 1.45, radius: .95, facing: .42 }
const STAR = { radius: .86, depth: .79, point: .38, peach: '#f2ab91' }
const STAR_PIN = { x: -.31, y: .53, lift: .045 }

const hatUp = new THREE.Vector3()
const liveMatcaps = new Map<string, { texture: THREE.Texture; ready: Promise<void> }>()
function liveMatcap(name: string) {
  const cached = liveMatcaps.get(name)
  if (cached) return cached
  let complete!: () => void, fail!: (error: unknown) => void
  const ready = new Promise<void>((resolve, reject) => { complete = resolve; fail = reject })
  const texture = new THREE.TextureLoader().load(`/models/matcaps/${name}-v1.png`, complete, undefined, fail)
  texture.colorSpace = THREE.SRGBColorSpace
  const result = { texture, ready }
  liveMatcaps.set(name, result)
  return result
}

/** Keep the brim on the blob's tangent plane, including its secondary wobble. */
export function seatMateHat(hat: THREE.Object3D) {
  hatUp.set(0, 1, 0).applyQuaternion(hat.quaternion)
  const radiusY = DOT.radius * .95
  const support = Math.hypot(DOT.radius * hatUp.x, radiusY * hatUp.y, DOT.radius * hatUp.z)
  hat.position.y = (support + .004 - hat.position.x * hatUp.x - hat.position.z * hatUp.z) / hatUp.y
}

type Face = {
  /** front of the body at the centre of the face, and how curved the surface is there */
  z: number; curve: number
  eye: { x: number; y: number; w: number; h: number }
}

// Small, close-set dot eyes: the whole face is two dots.
const FACES: Record<BodyKind, Face> = {
  blob: { z: .95, curve: .95, eye: { x: .19, y: .1, w: .066, h: .09 } },
  bot: { z: .725, curve: 2.2, eye: { x: .22, y: .08, w: .07, h: .094 } },
  owl: { z: .89, curve: .92, eye: { x: .28, y: .1, w: .062, h: .084 } },
  star: { z: STAR.radius * STAR.depth, curve: 1.18, eye: { x: .22, y: .08, w: .065, h: .105 } },
}

/** A rounded five-point star: a sphere pushed out into soft points around its front plane. */
function puffyStar(r: number, depth: number, live = false) {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, live ? 52 : 120, live ? 36 : 80)
  g.deleteAttribute('normal'); g.deleteAttribute('uv')
  g = mergeVertices(g)
  const p = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const a = Math.atan2(v.x, v.y) // 0 points straight up
    // Broad, rounded lobes, with a full cushion between the points.
    const tip = (Math.cos(5 * a) + 1) / 2
    const plane = Math.sqrt(Math.max(0, 1 - v.z * v.z))
    const k = 1 + STAR.point * tip * plane
    p.setXYZ(i, v.x * r * k, v.y * r * k, v.z * r * depth)
  }
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

/** Exact front of the inflated star: eyes and the pin rest on its curved shell. */
function starSurface(x: number, y: number) {
  const a = Math.atan2(x, y)
  const tip = (Math.cos(5 * a) + 1) / 2
  const distance = Math.hypot(x, y) / STAR.radius
  const plane = 2 * distance / (1 + Math.sqrt(1 + 4 * STAR.point * tip * distance))
  return STAR.radius * STAR.depth * Math.sqrt(Math.max(0, 1 - plane * plane))
}

/** A softly filleted hollow star, bent to follow NOVA's shell rather than cut through it. */
function starPin(live: boolean) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = index * Math.PI / 5 - .18
    const radius = index % 2 === 0 ? .215 : .115
    const x = Math.sin(angle) * radius, y = Math.cos(angle) * radius
    return new THREE.Vector3(x, y, 0)
  })
  const curve = new THREE.CurvePath<THREE.Vector3>()
  for (let index = 0; index < points.length; index++) {
    const previous = points[(index + 9) % 10], point = points[index], next = points[(index + 1) % 10]
    const start = point.clone().lerp(previous, .24), end = point.clone().lerp(next, .24)
    const nextStart = next.clone().lerp(point, .24)
    curve.add(new THREE.QuadraticBezierCurve3(start, point, end))
    curve.add(new THREE.LineCurve3(end, nextStart))
  }
  const geometry = new THREE.TubeGeometry(curve, live ? 80 : 140, .026, live ? 8 : 12, true)
  const positions = geometry.attributes.position as THREE.BufferAttribute
  const center = starSurface(STAR_PIN.x, STAR_PIN.y) + STAR_PIN.lift
  // Fit both sides of the tube, not just the curve's control points. Its pivot
  // sits on the pin itself so a reaction cannot swing the metal into the body.
  for (let index = 0; index < positions.count; index++) {
    positions.setZ(index, starSurface(positions.getX(index) + STAR_PIN.x, positions.getY(index) + STAR_PIN.y) + STAR_PIN.lift + positions.getZ(index) - center)
  }
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export function createMateModel(body: BodyKind, color: ColorKey, options: { detail?: 'live' } = {}) {
  // Live silhouettes occupy a few hundred pixels. Smooth vertex normals keep
  // their curves intact with fewer triangles; exports retain the original mesh.
  const live = options.detail === 'live'
  const root = new THREE.Group()
  root.name = MODEL_NAMES[body]
  // the toy colour is a touch richer than the flat UI colour, so it holds up under soft light
  const hsl = { h: 0, s: 0, l: 0 }
  const peachStar = body === 'star' && color === 'pink'
  const tint = new THREE.Color(peachStar ? STAR.peach : MODEL_COLORS[color])
  tint.getHSL(hsl)
  if (!peachStar) tint.setHSL(hsl.h, Math.min(1, hsl.s * 1.22), hsl.l * .95)
  // Smooth satin vinyl with a restrained highlight.
  const shellCap = live ? liveMatcap(peachStar ? 'peach' : color) : undefined
  const inkCap = live ? liveMatcap(body === 'star' ? 'onyx' : 'satin') : undefined
  const silverCap = live && body === 'star' ? liveMatcap('silver') : undefined
  const satinCap = body === 'star' ? undefined : inkCap
  const shell = shellCap
    ? new THREE.MeshMatcapMaterial({ matcap: shellCap.texture, toneMapped: false })
    : new THREE.MeshPhysicalMaterial({ color: tint, roughness: body === 'star' ? .43 : .38, metalness: 0, clearcoat: body === 'star' ? .12 : .2, clearcoatRoughness: body === 'star' ? .4 : .3 })
  const ink = inkCap
    ? new THREE.MeshMatcapMaterial({ matcap: inkCap.texture, toneMapped: false })
    : body === 'star'
      ? new THREE.MeshPhysicalMaterial({ color: '#101113', roughness: .28, clearcoat: .35 })
      : new THREE.MeshStandardMaterial({ color: '#111114', roughness: .45 })
  const silver = body === 'star'
    ? silverCap
      ? new THREE.MeshMatcapMaterial({ matcap: silverCap.texture, toneMapped: false })
      : new THREE.MeshPhysicalMaterial({ color: '#b9bec0', metalness: .82, roughness: .27, clearcoat: .2 })
    : undefined
  // accessories: black, with a soft satin sheen
  const satin = satinCap
    ? new THREE.MeshMatcapMaterial({ matcap: satinCap.texture, toneMapped: false })
    : new THREE.MeshPhysicalMaterial({ color: '#0e0e11', roughness: .38, clearcoat: .3, clearcoatRoughness: .35, envMapIntensity: .55 })

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, name = '') => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    if (name) m.name = name
    parent.add(m)
    return m
  }

  // rig: turned to face the camera; body: the dot itself, centred so it can squash and tilt in place
  const rig = new THREE.Group()
  rig.name = 'rig'
  rig.rotation.y = DOT.facing
  root.add(rig)
  const bodyGroup = new THREE.Group()
  bodyGroup.name = 'body'
  bodyGroup.position.y = DOT.center
  rig.add(bodyGroup)

  let shapeGeo: THREE.BufferGeometry
  if (body === 'blob') {
    shapeGeo = new THREE.SphereGeometry(DOT.radius, live ? 48 : 72, live ? 32 : 54)
    shapeGeo.scale(1, .95, 1)
  } else if (body === 'bot') {
    shapeGeo = new RoundedBoxGeometry(1.7, 1.55, 1.45, live ? 6 : 10, .6)
  } else if (body === 'owl') {
    shapeGeo = new THREE.SphereGeometry(.92, live ? 48 : 72, live ? 32 : 54)
    shapeGeo.scale(1, 1.04, .97)
  } else {
    shapeGeo = puffyStar(STAR.radius, STAR.depth, live)
  }
  add(shapeGeo, shell, bodyGroup, 0, 0, 0, 'shape')

  // the face: two dot eyes; drawn arcs for happy (∩) and calmly closed (∪) eyes
  const f = FACES[body]
  const face = new THREE.Group()
  face.name = 'face'
  bodyGroup.add(face)
  const surface = (x: number, y: number) => body === 'star' ? starSurface(x, y) : f.z - (x * x + y * y) / (2 * f.curve)
  const onSurface = (o: THREE.Object3D, x: number, y: number, lift: number) => {
    o.position.set(x, y, surface(x, y) + lift)
    o.rotation.set(-Math.atan2(y, f.curve), Math.atan2(x, f.curve), 0)
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Group()
    eye.name = side < 0 ? 'eyeL' : 'eyeR'
    onSurface(eye, side * f.eye.x, f.eye.y, -.004)
    face.add(eye)
    add(new THREE.SphereGeometry(1, live ? 20 : 28, live ? 14 : 20), ink, eye, 0, 0, 0, 'bead').scale.set(f.eye.w, f.eye.h, .04)
    add(new THREE.TorusGeometry(f.eye.w * 1.25, .017, 10, 28, Math.PI), ink, eye, 0, -f.eye.h * .25, .02, 'happy').scale.setScalar(.001)
    const shut = add(new THREE.TorusGeometry(f.eye.w * 1.3, .017, 10, 28, Math.PI), ink, eye, 0, f.eye.h * .35, .02, 'shut')
    shut.rotation.z = Math.PI
    shut.scale.setScalar(.001)
  }

  // One accessory each: black satin for the crew, silver for NOVA.
  if (body === 'blob') {
    // BOB: a little top hat, worn at an angle
    const hat = new THREE.Group()
    hat.name = 'hat'
    hat.position.set(.26, 0, -.02)
    hat.rotation.set(-.08, 0, -.3)
    seatMateHat(hat)
    bodyGroup.add(hat)
    add(new THREE.CylinderGeometry(.44, .44, .045, 56), satin, hat, 0, .0225, 0)
    add(new THREE.CylinderGeometry(.27, .29, .42, 48), satin, hat, 0, .25, 0)
  } else if (body === 'bot') {
    // MAX: headphones, always tuned in to the market
    add(new THREE.TorusGeometry(.93, .055, 14, 56, Math.PI), satin, bodyGroup, 0, .05, -.06, 'band')
    for (const side of [-1, 1]) {
      const cup = add(new THREE.CylinderGeometry(.26, .26, .2, 40), satin, bodyGroup, side * .93, .02, -.04, side < 0 ? 'cupL' : 'cupR')
      cup.rotation.z = Math.PI / 2
      const pad = add(new THREE.TorusGeometry(.19, .05, 12, 32), satin, bodyGroup, side * .84, .02, -.04)
      pad.rotation.y = Math.PI / 2
    }
  } else if (body === 'owl') {
    // IGGY: owl tufts and round glasses drawn in a thick black line
    for (const side of [-1, 1]) {
      const tuft = new THREE.Group()
      tuft.name = side < 0 ? 'tuftL' : 'tuftR'
      tuft.position.set(side * .5, .72, -.04)
      bodyGroup.add(tuft)
      const t = add(new THREE.SphereGeometry(1, 24, 18), shell, tuft, side * .05, .17, 0)
      t.scale.set(.16, .3, .15)
      t.rotation.z = -side * .45
      const rim = add(new THREE.TorusGeometry(.235, .033, 14, 56), satin, face)
      onSurface(rim, side * f.eye.x, f.eye.y, .035)
      rim.scale.set(1, 1.12, 1)
      const arm = add(new THREE.CylinderGeometry(.024, .024, .14, 12), satin, face)
      onSurface(arm, side * (f.eye.x + .3), f.eye.y + .06, .02)
      arm.rotation.z = Math.PI / 2
    }
    const bridge = add(new THREE.CylinderGeometry(.024, .024, .1, 12), satin, face)
    onSurface(bridge, 0, f.eye.y + .05, .05)
    bridge.rotation.z = Math.PI / 2
  } else {
    // NOVA: a small hollow silver star pinned above the left eye.
    const brooch = new THREE.Group()
    brooch.name = 'brooch'
    brooch.position.set(STAR_PIN.x, STAR_PIN.y, starSurface(STAR_PIN.x, STAR_PIN.y) + STAR_PIN.lift)
    bodyGroup.add(brooch)
    add(starPin(live), silver!, brooch)
  }

  root.userData = { author: 'Dots', character: MODEL_NAMES[body], body, color, tint: tint.getHex() }
  if (shellCap && inkCap) root.userData.materialReady = Promise.all([shellCap.ready, inkCap.ready, ...(silverCap ? [silverCap.ready] : [])])
  return root
}

export function createModelScene(canvas: HTMLCanvasElement, size: { width: number; height: number }, shadows = true, options: { pixelRatio?: number; preserveDrawingBuffer?: boolean; shadowSize?: number; updateStyle?: boolean; environment?: boolean } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: options.preserveDrawingBuffer ?? true })
  renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2))
  renderer.setSize(size.width, size.height, options.updateStyle ?? true)
  renderer.setClearColor(0x000000, 0)
  // neutral tone mapping keeps the brand colours true instead of washing them out
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = shadows
  renderer.shadowMap.type = THREE.PCFShadowMap
  const scene = new THREE.Scene()
  let environment: THREE.WebGLRenderTarget | undefined
  if (options.environment !== false) {
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    environment = pmrem.fromScene(room, .04)
    scene.environment = environment.texture
    room.dispose()
    pmrem.dispose()
  }
  scene.environmentIntensity = .75
  scene.add(new THREE.HemisphereLight(0xffffff, 0x68735f, 1.25))
  const key = new THREE.DirectionalLight(0xfff5e1, 2.4)
  key.position.set(-3, 6, 5)
  key.castShadow = shadows
  const shadowSize = options.shadowSize ?? 1024
  key.shadow.mapSize.set(shadowSize, shadowSize)
  key.shadow.camera.left = -4
  key.shadow.camera.right = 4
  key.shadow.camera.top = 5
  key.shadow.camera.bottom = -4
  key.shadow.bias = -.0005
  key.shadow.normalBias = .025
  key.shadow.radius = 6
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xcbd9ff, 1.3)
  fill.position.set(4, 2, -3)
  scene.add(fill)
  if (shadows) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .07 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)
  }
  const camera = new THREE.PerspectiveCamera(33, size.width / size.height, .1, 50)
  camera.position.set(2.7, 2.55, 5.6)
  camera.lookAt(0, 1.5, 0)
  return { renderer, scene, camera, environment }
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(material => {
        if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
        material.dispose()
      })
    }
  })
}

export async function exportMateModel(body: BodyKind, color: ColorKey) {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
  const model = createMateModel(body, color)
  const binary = await new GLTFExporter().parseAsync(model, { binary: true })
  disposeObject(model)
  return binary as ArrayBuffer
}
