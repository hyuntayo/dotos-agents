import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useQuietMotion } from '../experience/motion-context'
import { createInkFlow, type InkFlow } from './ink-flow'
import './atmosphere.css'

/** Smoked-glass depth, scroll advection and a soft material light under the cursor. */
export function Atmosphere() {
  const quiet = useQuietMotion()
  const [visible, setVisible] = useState(() => !document.hidden)
  const [ready, setReady] = useState(false)
  const [flowReady, setFlowReady] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null), image = useRef<HTMLImageElement>(null), flow = useRef<InkFlow | null>(null), failed = useRef(false)
  const active = !quiet && visible
  const { scrollYProgress, scrollY } = useScroll()
  const progress = useMotionValue(0)
  const targetX = useMotionValue(0), targetY = useMotionValue(0)
  const targetScale = useMotionValue(1.015), targetRotate = useMotionValue(0)
  const x = useSpring(targetX, { stiffness: 42, damping: 22 })
  const y = useSpring(targetY, { stiffness: 42, damping: 22 })
  const scale = useSpring(targetScale, { stiffness: 42, damping: 22 }), rotate = useSpring(targetRotate, { stiffness: 42, damping: 22 })
  const pointer = useRef({ x: 0, y: 0, engaged: false })
  const tone = useTransform(progress, [0, .25, .46, .7, 1], ['#182440', '#22243c', '#19362d', '#292238', '#24352f'])
  const move = useCallback((value: number) => {
    const travel = scrollY.get() / Math.max(480, innerHeight)
    targetX.set(pointer.current.x * 12 - Math.sin(travel * .38) * 24)
    targetY.set(pointer.current.y * 10 - Math.sin(travel * .48) * 36)
    targetScale.set(1.015 + Math.sin(value * Math.PI) * .045)
    targetRotate.set(Math.sin(travel * .31) * .5 + pointer.current.x * .22)
    flow.current?.setProgress(value, travel)
  }, [scrollY, targetX, targetY, targetScale, targetRotate])

  useEffect(() => {
    const visibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (!active) return
    progress.set(value)
    move(value)
  })
  useMotionValueEvent(scrollY, 'change', () => { if (active) move(scrollYProgress.get()) })

  useEffect(() => {
    if (!active) {
      x.stop(); y.stop(); scale.stop(); rotate.stop()
      return
    }
    progress.set(scrollYProgress.get())
    move(scrollYProgress.get())
    const fine = matchMedia('(hover: hover) and (pointer: fine)')
    const onPointer = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType === 'touch') return
      pointer.current = { x: event.clientX / innerWidth * 2 - 1, y: event.clientY / innerHeight * 2 - 1, engaged: true }
      flow.current?.setPointer(pointer.current.x, pointer.current.y, true)
      move(scrollYProgress.get())
    }
    const onLeave = () => {
      pointer.current = { x: 0, y: 0, engaged: false }
      flow.current?.setPointer(0, 0, false)
      move(scrollYProgress.get())
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [active, move, progress, scrollYProgress, x, y, scale, rotate])

  useEffect(() => {
    if (!ready || !active) { flow.current?.pause(); return }
    if (!flow.current && !failed.current && canvas.current && image.current) {
      flow.current = createInkFlow(canvas.current, image.current, () => setFlowReady(true), () => { failed.current = true; setFlowReady(false) })
      if (!flow.current) failed.current = true
    }
    flow.current?.setProgress(scrollYProgress.get(), scrollY.get() / Math.max(480, innerHeight))
    flow.current?.setPointer(pointer.current.x, pointer.current.y, pointer.current.engaged)
    flow.current?.start()
    return () => flow.current?.pause()
  }, [ready, active, scrollYProgress, scrollY])
  useEffect(() => () => { flow.current?.dispose(); flow.current = null }, [])

  return <div className="v-atmosphere" aria-hidden="true" data-active={active || undefined} data-ready={ready || undefined} data-flow-ready={flowReady || undefined} data-flow-failed={failed.current || undefined}>
    <motion.div className="v-atmosphere-material" style={{ x, y, scale, rotate }}>
      <picture>
        <source media="(max-width: 760px)" srcSet="/background/glass-v3/glass-phone.webp"/>
        <img ref={image} src="/background/glass-v3/glass-desktop.webp" alt="" width="1672" height="941" decoding="async" onLoad={event => { flow.current?.setImage(event.currentTarget); setReady(true) }}/>
      </picture>
      <canvas ref={canvas} className="v-atmosphere-flow"/>
    </motion.div>
    <motion.div className="v-atmosphere-tone" style={{ backgroundColor: tone }}/>
    <div className="v-atmosphere-shade"/>
  </div>
}
