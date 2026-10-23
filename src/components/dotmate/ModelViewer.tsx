import { mateRenderProps } from './render-images'
import { useEffect, useRef, useState } from 'react'
import { Raycaster, Vector2 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { createMateModel, createModelScene, disposeObject } from './models'
import { createMateAnimator, type MateBehavior, type MateGesture, type MateVisualState } from './animation'
import { MATES, type BodyKind, type ColorKey, type MateId } from './sprites'
import './model-interactions.css'
import { useScrolling } from '@/landing/useScrolling'
import { modelPixelRatio } from './render-quality'

type Action = MateGesture | 'reset' | 'look'
export type ModelViewerProps = {
  mate?: MateId; body?: BodyKind; color?: ColorKey; className?: string; paused?: boolean
  label?: string; interactive?: boolean; autoRotate?: boolean; scanning?: boolean; activityCount?: number
  onPausedChange?: (paused: boolean) => void
  suspended?: boolean
}

export function LiveModel({ mate, body = 'blob', color = 'violet', className = '', paused = false, label, interactive = false, autoRotate = false, scanning = false, activityCount, onPausedChange, suspended = false }: ModelViewerProps) {
  if (mate) { body = MATES[mate].body; color = MATES[mate].color }
  const host = useRef<HTMLDivElement>(null)
  const actions = useRef<(action: Action) => void>(() => {})
  const controller = useRef<{ mode: (next: MateBehavior) => void } | null>(null)
  const tap = useRef<(head: boolean) => void>(() => {})
  const tracking = useRef(true)
  const [follow, setFollow] = useState(true)
  const [readyFor, setReadyFor] = useState('')
  const [failed, setFailed] = useState(false)
  const [action, setAction] = useState<MateGesture | null>(null)
  const [preview, setPreview] = useState<MateBehavior | null>(null)
  const [activity, setActivity] = useState(false)
  const behavior: MateBehavior = paused ? 'sleeping' : scanning || activity ? 'working' : preview ?? 'awake'
  const modeRef = useRef(behavior)
  const visualRef = useRef<MateVisualState>(behavior)
  const [visual, setVisual] = useState<MateVisualState>(behavior)
  const lastActivity = useRef(activityCount)
  const scrolling = useScrolling()
  const scrollRef = useRef(false)
  const suspendedRef = useRef(suspended)
  const resume = useRef<() => void>(() => {})
  const identity = `${body}:${color}`
  const ready = readyFor === identity && !failed

  useEffect(() => { scrollRef.current = scrolling; if (!scrolling) resume.current() }, [scrolling])
  useEffect(() => { suspendedRef.current = suspended; if (!suspended) resume.current() }, [suspended])

  useEffect(() => { modeRef.current = behavior; controller.current?.mode(behavior) }, [behavior])
  useEffect(() => {
    if (paused) {
      lastActivity.current = activityCount
      const clear = window.setTimeout(() => setActivity(false), 0)
      return () => clearTimeout(clear)
    }
    if (activityCount === undefined || lastActivity.current === activityCount) return
    lastActivity.current = activityCount
    const begin = window.setTimeout(() => setActivity(true), 0)
    const end = window.setTimeout(() => setActivity(false), 2800)
    return () => { clearTimeout(begin); clearTimeout(end) }
  }, [activityCount, paused])

  const chooseMode = (next: MateBehavior) => {
    if (scanning) return
    setActivity(false)
    if (next === 'sleeping') {
      if (onPausedChange) { setPreview(null); if (!paused) onPausedChange(true) }
      else setPreview('sleeping')
    } else if (next === 'awake') {
      setPreview(null)
      if (paused) onPausedChange?.(false)
      else if (behavior !== 'sleeping') actions.current('stretch')
    } else if (!paused) setPreview(preview === 'working' ? null : 'working')
  }
  useEffect(() => {
    tap.current = head => {
      if (scanning) { actions.current(head ? 'ping' : 'wave'); return }
      if (behavior === 'sleeping') { setPreview(null); if (paused) onPausedChange?.(false) }
      else actions.current(head ? 'ping' : 'wave')
    }
  }, [behavior, paused, scanning, onPausedChange])

  useEffect(() => {
    const container = host.current
    if (!container) return
    let setup: ReturnType<typeof createModelScene> | undefined
    let frame = 0, notice = 0, markReady = 0, painted = false, visible = true, dragging = false, over = false, dirty = true, materialsReady = false, mounted = true
    let observer: ResizeObserver | undefined, visibility: IntersectionObserver | undefined, controls: OrbitControls | undefined
    const cleanups: (() => void)[] = []
    try {
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      canvas.title = 'Tap the head to ping, the body to wave. Tap to wake a sleeping mate. Drag to rotate.'
      container.appendChild(canvas)
      // Layout owns the canvas size, including while its entrance is transformed.
      // Retain the last complete frame when scrolling/offscreen rendering pauses.
      let renderedSize={width:Math.max(container.clientWidth,1),height:Math.max(container.clientHeight,1)}
      setup = createModelScene(canvas, renderedSize, false, {
        pixelRatio: modelPixelRatio(renderedSize.width,renderedSize.height,window.devicePixelRatio), preserveDrawingBuffer: true, updateStyle: false, environment: false,
      })
      const { renderer, scene, camera } = setup
      const frameCamera = () => {
        // Reserve room for waking stretches, hops and accessories. Narrow cards
        // need the same horizontal margin as the hero's vertical framing.
        camera.zoom = Math.min(interactive ? .9 : 1, camera.aspect * .88)
        camera.updateProjectionMatrix()
      }
      frameCamera()
      const model = createMateModel(body, color, { detail: 'live' })
      scene.add(model)
      const animator = createMateAnimator(model, body, modeRef.current, { hideInactiveEyes: true, cheapEffects: true })
      controls = new OrbitControls(camera, canvas)
      // BOB's tall hat and simultaneous wake/ping hops need a higher centre.
      controls.target.set(0, body === 'blob' ? 1.65 : 1.5, 0)
      controls.enableZoom = false; controls.enablePan = false; controls.rotateSpeed = .6
      controls.minPolarAngle = Math.PI / 3; controls.maxPolarAngle = Math.PI / 1.95
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
      let reduce = preference.matches
      controls.enableDamping = !reduce
      controls.autoRotate = autoRotate && !reduce
      controls.autoRotateSpeed = 3
      controls.update(); controls.saveState()
      const pointer = { x: 0, y: 0 }
      const ray = new Raycaster(), hitPointer = new Vector2()
      let press: { x: number; y: number; distance: number } | null = null
      let lastDraw = 0, currentAction: MateGesture | null = null
      let pendingSize: { width: number; height: number } | null = null
      const draw = (time: number) => {
        frame = 0
        if (!visible || document.hidden || scrollRef.current || suspendedRef.current && lastDraw > 0 || !materialsReady) return
        // Keep visible movement fluid: 30 fps idle, 24 asleep and display-rate
        // interaction. Scroll/offscreen suspension and the pixel budget stay intact.
        const interval = 1000 / (dragging || currentAction ? 60 : animator.mode === 'sleeping' ? 24 : 30)
        if (dirty || time - lastDraw >= interval - .5) {
          // Resizing clears WebGL's buffer. Apply it together with a complete
          // repaint, so a paused scroll frame never contains a partially cleared pet.
          const nextSize=pendingSize??renderedSize,nextRatio=modelPixelRatio(nextSize.width,nextSize.height,window.devicePixelRatio)
          if (pendingSize || Math.abs(renderer.getPixelRatio()-nextRatio)>.001) {
            renderer.setPixelRatio(nextRatio)
            renderer.setSize(nextSize.width, nextSize.height, false)
            camera.aspect = nextSize.width / nextSize.height
            frameCamera()
            renderedSize=nextSize
            pendingSize = null
          }
          const delta = Math.min((time - lastDraw) / 1000, .1)
          // Tolerate rAF rounding around the 30/60 Hz boundary without dropping
          // alternating frames. Damping should have the same duration at either rate.
          lastDraw = dirty ? time : lastDraw + Math.max(1, Math.round((time - lastDraw) / interval)) * interval; dirty = false
          if (controls) { controls.dampingFactor = 1 - Math.pow(.95, delta * 60); controls.update(delta) }
          const result = animator.update(time, reduce, tracking.current && over && !dragging && animator.mode !== 'sleeping' ? pointer : undefined)
          if (visualRef.current !== result.state) { visualRef.current = result.state; setVisual(result.state) }
          if (currentAction && !result.gesture) { currentAction = null; setAction(null) }
          renderer.render(scene, camera)
          if (!painted) { painted = true; markReady = requestAnimationFrame(() => { if (mounted) { setReadyFor(`${body}:${color}`); setFailed(false); setAction(null) } }) }
        }
        if (!reduce) frame = requestAnimationFrame(draw)
      }
      const schedule = () => { if (!frame && visible && !document.hidden && !suspendedRef.current && materialsReady) frame = requestAnimationFrame(draw) }
      const wake = () => { dirty = true; schedule() }
      resume.current = wake
      controller.current = { mode: next => {
        animator.setMode(next, performance.now())
        if (next === 'sleeping') { clearTimeout(notice); animator.finishGesture(); currentAction = null; setAction(null) }
        wake()
      } }
      actions.current = next => {
        if (next === 'look') { wake(); return }
        if (next === 'reset') { controls?.reset(); animator.reset(); currentAction = null; clearTimeout(notice); setAction(null); wake(); return }
        if (currentAction || (animator.mode === 'sleeping' && next !== 'orbit')) return
        currentAction = next; setAction(next)
        animator.gesture(next, performance.now(), reduce)
        if (reduce) {
          clearTimeout(notice)
          notice = window.setTimeout(() => { animator.finishGesture(); currentAction = null; setAction(null); wake() }, 650)
        }
        wake()
      }
      const move = (event: PointerEvent) => {
        if (press) press.distance = Math.max(press.distance, Math.hypot(event.clientX - press.x, event.clientY - press.y))
        if (event.pointerType === 'touch') return
        const rect = canvas.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2
        pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2
        over = true; schedule()
      }
      const leave = () => { over = false; schedule() }
      const down = (event: PointerEvent) => { dragging = true; press = { x: event.clientX, y: event.clientY, distance: 0 } }
      const canvasUp = (event: PointerEvent) => {
        if (interactive && press && press.distance < 7 && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 7) {
          const rect = canvas.getBoundingClientRect()
          hitPointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1))
          model.updateMatrixWorld(true)
          ray.setFromCamera(hitPointer, camera)
          const hit = ray.intersectObject(model, true)[0]
          if (hit) tap.current(hit.point.y > 1.65)
        }
      }
      const up = () => { dragging = false; press = null; wake() }
      const changePreference = () => {
        reduce = preference.matches
        if (controls) { controls.enableDamping = !reduce; controls.autoRotate = autoRotate && !reduce }
        if (reduce) { animator.finishGesture(); currentAction = null; setAction(null) }
        wake()
      }
      canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave)
      canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerup', canvasUp)
      window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
      document.addEventListener('visibilitychange', wake); preference.addEventListener('change', changePreference)
      window.addEventListener('resize',wake)
      controls.addEventListener('change', () => { if (reduce) wake() })
      cleanups.push(() => {
        canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave)
        canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', canvasUp)
        window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up)
        document.removeEventListener('visibilitychange', wake); preference.removeEventListener('change', changePreference)
        window.removeEventListener('resize',wake)
      })
      void (model.userData.materialReady as Promise<unknown>).then(async () => {
        if (!mounted) return
        await renderer.compileAsync(scene, camera)
        if (!mounted) return
        materialsReady = true
        draw(performance.now())
      }).catch(() => { if (mounted) setFailed(true) })
      cleanups.push(() => cancelAnimationFrame(markReady))
      observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        if (!width || !height) return
        const next = { width: Math.max(1, Math.floor(width)), height: Math.max(1, Math.floor(height)) }
        const ratio = renderer.getPixelRatio()
        if (canvas.width === Math.floor(next.width * ratio) && canvas.height === Math.floor(next.height * ratio)) {
          pendingSize = null
          return
        }
        pendingSize = next
        wake()
      })
      observer.observe(container)
      visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake() })
      visibility.observe(container)
    } catch { frame = requestAnimationFrame(() => setFailed(true)) }
    return () => {
      mounted = false
      cancelAnimationFrame(frame); clearTimeout(notice); actions.current = () => {}; controller.current = null
      resume.current = () => {}
      cleanups.forEach(clean => clean()); observer?.disconnect(); visibility?.disconnect(); controls?.dispose()
      if (setup) { disposeObject(setup.scene); setup.environment?.dispose(); setup.renderer.dispose(); setup.renderer.forceContextLoss() }
      container.replaceChildren()
    }
  }, [body, color, interactive, autoRotate])

  const isPreview = !!preview && !paused && !scanning && !activity
  const working = behavior === 'working'
  const displayState = ready ? visual : behavior
  return <div className={`model-viewer ${className} ${interactive ? 'has-controls' : ''} ${working ? 'is-scanning' : ''}`} role={interactive ? 'group' : 'img'} aria-label={label ?? `${mate ? MATES[mate].name : 'Dot'} 3D model. Tap to interact; drag to rotate.`} data-model-ready={ready} data-model-action={action ?? 'idle'} data-model-state={displayState} data-model-behavior={behavior} data-model-motion={suspended ? 'suspended' : scrolling ? 'paused' : 'running'}>
    {(!ready || failed) && <img className="model-fallback" {...mateRenderProps(body,color,interactive?'(max-width: 760px) 90vw, 560px':'180px')} alt="" />}
    <div ref={host} className="model-canvas" />
    {interactive && <div className="model-state" role="status"><i /><span>{displayState === 'waking' ? 'WAKING UP' : displayState.toUpperCase()}</span>{isPreview && <small>PREVIEW</small>}</div>}
    {working && <div className="model-scan" aria-hidden="true" />}
    {behavior === 'sleeping' && <div className="model-sleep-marks" aria-hidden="true">{[0, 1, 2].map(i => <svg key={i} viewBox="0 0 14 14" style={{ animationDelay: `${i * 1.3}s` }}><path d="M3 3h8L3 11h8" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>)}</div>}
    <span className={`model-response ${action === 'ping' || action === 'wave' ? 'visible' : ''}`} role="status">{action === 'ping' ? 'ACK / ONLINE' : action === 'wave' ? 'HELLO / ONLINE' : ''}</span>
    {interactive && <div className="model-controls"><div className="model-modes" aria-label="Companion states">
      <button type="button" aria-label="Sleep companion" aria-pressed={behavior === 'sleeping'} disabled={!ready || scanning} onClick={() => chooseMode('sleeping')}><SvgIcon name="moon" size={13} /><span>Sleep</span></button>
      <button type="button" aria-label="Wake companion" aria-pressed={behavior === 'awake'} disabled={!ready || scanning} onClick={() => chooseMode('awake')}><SvgIcon name="sun" size={13} /><span>Awake</span></button>
      <button type="button" aria-label="Preview working animation" aria-pressed={working} disabled={!ready || behavior === 'sleeping' || scanning} onClick={() => chooseMode('working')}><SvgIcon name="cpu" size={13} /><span>Work</span></button>
    </div><div className="model-tools" aria-label="Model controls">
      <button type="button" aria-label="Follow cursor" aria-pressed={follow} disabled={!ready || behavior === 'sleeping'} onClick={() => { tracking.current = !follow; setFollow(!follow); actions.current('look') }}><SvgIcon name="scan-eye" size={13} /><span>Look</span></button>
      <button type="button" aria-label="Rotate model 360 degrees" disabled={!ready || !!action} onClick={() => actions.current('orbit')}><SvgIcon name="rotate-cw" size={13} /><span>Orbit</span></button>
      <button type="button" aria-label="Wave companion" disabled={!ready || behavior === 'sleeping' || !!action} onClick={() => actions.current('wave')}><SvgIcon name="activity" size={13} /><span>Wave</span></button>
      <button type="button" aria-label="Ping companion" disabled={!ready || behavior === 'sleeping' || !!action} onClick={() => actions.current('ping')}><SvgIcon name="zap" size={13} /><span>Ping</span></button>
      <button type="button" aria-label="Reset model view" title="Reset view" disabled={!ready} onClick={() => actions.current('reset')}><SvgIcon name="arrow-down" size={13} /></button>
    </div></div>}
  </div>
}
