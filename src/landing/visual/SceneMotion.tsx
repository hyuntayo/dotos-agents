import { mateRenderProps } from '@/components/dotmate/render-images'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react'
import { useQuietMotion } from '../experience/motion-context'
import { useReducedAnimation } from '../useReducedAnimation'
import { SCENE_EASE } from './scene-easing'

export function useFrozenScrollProgress(source: MotionValue<number>) {
  const quiet = useQuietMotion(), reduced = useReducedAnimation()
  const progress = useMotionValue(reduced ? 1 : source.get())
  useMotionValueEvent(source, 'change', value => { if (!quiet) progress.set(value) })
  useEffect(() => { if (reduced) progress.set(1); else if (!quiet) progress.set(source.get()) }, [quiet, reduced, source, progress])
  return progress
}

export function LineReveal({ children, from = 'bottom', delay = 0 }: { children: ReactNode; from?: 'bottom' | 'left' | 'right'; delay?: number }) {
  const host = useRef<HTMLSpanElement>(null), quiet = useQuietMotion()
  const entered = useInView(host, { once: true, amount: .25 })
  const ready = entered || quiet
  return <span ref={host} className="v-line-window" data-entered={ready || undefined}>
    <motion.span initial={false} animate={{ x: ready || from === 'bottom' ? 0 : from === 'left' ? '-28%' : '28%', y: ready || from !== 'bottom' ? '0%' : '110%', clipPath: ready ? 'inset(-20% 0% -25% 0%)' : from === 'right' ? 'inset(-20% 0% -25% 100%)' : from === 'left' ? 'inset(-20% 100% -25% 0%)' : 'inset(-20% 0% -25% 0%)' }} transition={{ duration: quiet ? 0 : .95, delay: quiet ? 0 : delay, ease: SCENE_EASE }}>{children}</motion.span>
  </span>
}

export function Letterpress({ word }: { word: string }) {
  const host = useRef<HTMLSpanElement>(null), quiet = useQuietMotion()
  const entered = useInView(host, { once: true, amount: .35 })
  return <span ref={host} className="v-outro-word v-letterpress" aria-hidden="true" data-motion-scene="letterpress" data-entered={entered || quiet || undefined}>{[...word].map((letter, index) => <motion.span className="v-word-letter" key={index} initial={false} animate={entered || quiet ? { x: 0, y: '0%', rotate: 0, rotateX: 0, opacity: 1 } : { x: (index - 2) * 24, y: index % 2 ? '-95%' : '95%', rotate: (index - 2) * 9, rotateX: index % 2 ? -65 : 65, opacity: 0 }} transition={{ duration: quiet ? 0 : 1.15, delay: quiet ? 0 : index * .09, ease: SCENE_EASE }}>{letter}</motion.span>)}</span>
}

const COLS = 6, ROWS = 5
const FRAGMENTS = Array.from({ length: COLS * ROWS }, (_, index) => {
  const col = index % COLS, row = Math.floor(index / COLS), seed = (index * 37 + 13) % 101 / 100
  return {
    index, start: .035 + ((col * 3 + row * 7) % 11) * .012,
    dx: (col - 2.5) * (23 + seed * 17), dy: (row - 2) * (27 + seed * 13), rotate: (index % 5 - 2) * 13,
    clip: `inset(${row / ROWS * 100}% ${100 - (col + 1) / COLS * 100}% ${100 - (row + 1) / ROWS * 100}% ${col / COLS * 100}%)`,
    origin: `${(col + .5) / COLS * 100}% ${(row + .5) / ROWS * 100}%`,
  }
})

function Fragment({ piece, progress }: { piece: typeof FRAGMENTS[number]; progress: MotionValue<number> }) {
  const settle = (value: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, (value - piece.start) / .64)), 3)
  const x = useTransform(progress, value => `${piece.dx * (1 - settle(value))}%`)
  const y = useTransform(progress, value => `${piece.dy * (1 - settle(value))}%`)
  const rotate = useTransform(progress, value => piece.rotate * (1 - settle(value)))
  return <motion.span className="v-mate-fragment" data-fragment={piece.index} style={{ x, y, rotate, clipPath: piece.clip, transformOrigin: piece.origin }}><img {...mateRenderProps('owl','mint','(max-width: 760px) 115px, (max-width: 900px) 180px, (max-width: 1200px) 230px, 260px')} alt="" width="400" height="440" loading="lazy"/></motion.span>
}

export function MosaicMate({ progress }: { progress: MotionValue<number> }) {
  const host = useRef<HTMLDivElement>(null), quiet = useQuietMotion()
  const near = useInView(host, { once: true, margin: '250px' }), [assembled, setAssembled] = useState(false)
  useMotionValueEvent(progress, 'change', value => { if (value >= .985 && !assembled) setAssembled(true) })
  const imageOpacity = useTransform(progress, [.77, .94], [0, 1])
  const pieceOpacity = useTransform(progress, [0, .045, .82, .96], [0, 1, 1, 0])
  return <div ref={host} className="v-fragment-mate" data-motion-scene="fragment-assembly" data-assembled={assembled || quiet || undefined}>
    <motion.img className="v-assembled-mate" {...mateRenderProps('owl','mint','(max-width: 760px) 115px, (max-width: 900px) 180px, (max-width: 1200px) 230px, 260px')} alt="IGGY" width="400" height="440" loading="lazy" style={assembled || quiet ? { opacity: 1 } : { opacity: imageOpacity }}/>
    {near && !assembled && !quiet && <motion.div className="v-mate-fragments" aria-hidden="true" style={{ opacity: pieceOpacity }}>{FRAGMENTS.map(piece => <Fragment key={piece.index} piece={piece} progress={progress}/>)}</motion.div>}
  </div>
}
