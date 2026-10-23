import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router'
import { watchSetupLink } from '@/content/task-entry'
import { AnimatePresence, motion, useInView, useIsPresent, useMotionValueEvent, useScroll, useTransform, type Variants } from 'motion/react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useQuietMotion } from '../experience/motion-context'
import { useReducedAnimation } from '../useReducedAnimation'
import { useWideScene } from './use-visual'
import { LineReveal } from './SceneMotion'
import { NoteCarrier } from './NoteCarrier'
import './handoff.css'

const STEPS = ['Hand it over.', 'Carry on.', 'Get the signal.']
const EASE = [.22, 1, .36, 1] as const
const CARD_MOTION: Variants = {
  arrive: (direction: number) => ({ y: `${direction * 100}%`, x: -direction * 8, rotateX: -direction * 14, rotateZ: direction * 1.2, scale: .98, opacity: .85 }),
  held: { y: '0%', x: 0, rotateX: 0, rotateZ: 0, scale: 1, opacity: 1 },
  leave: (direction: number) => ({ y: `${-direction * 100}%`, x: direction * 8, rotateX: direction * 14, rotateZ: -direction * 1.2, scale: .98, opacity: .65 }),
}

function WatchCard({ stage, direction, quiet, suspended, onContinue, onSettled }: { stage: number; direction: number; quiet: boolean; suspended: boolean; onContinue: () => void; onSettled: () => void }) {
  const present = useIsPresent()
  return <motion.article className="v-handoff-sheet" data-active={present || undefined} data-sheet={stage} aria-hidden={!present} inert={!present} custom={direction} variants={CARD_MOTION} initial="arrive" animate="held" exit="leave" transition={{ duration: quiet ? 0 : .8, ease: EASE }} style={{ zIndex: present ? 3 : 2 }} onAnimationComplete={() => { if (present) onSettled() }}>
    <div className="v-handoff-paper" data-paper={stage}>
      <span className="v-card-edge" aria-hidden="true"/>
      
      {stage === 0 ? <div className="v-handoff-note">
        <div className="v-card-message"><h3>Your rule.</h3><p>Choose an asset and a condition.</p></div>
        <div className="v-handoff-target"><strong>Assets</strong><span className="v-card-asset"><SvgIcon name="wallet" size={14}/>Public wallets & tokens</span></div>
        
      </div> : stage === 1 ? <div className="v-handoff-observation">
        <div className="v-card-message"><h3>On my watch.</h3><p>Configured tasks run on the server.</p></div>
        <div className="v-handoff-reading"><strong>Watch</strong><span className="v-card-distance">At your saved interval</span></div>
        <div className="v-handoff-process"><span><SvgIcon name="clock" size={18}/>Scheduled checks</span><span><SvgIcon name="shield-check" size={18}/>Read-only</span></div>
      </div> : <div className="v-handoff-reply">
        <div className="v-card-message"><h3>Your cue.</h3></div>
        <div className="v-handoff-match"><strong>Inbox</strong><span className="v-card-distance">Observations and their source</span></div>
        <p><SvgIcon name="bell" size={15}/>Browser push when enabled.</p>
      </div>}
      <footer>{stage === 2 ? <Link to={watchSetupLink('bob')} tabIndex={present ? 0 : -1} onClick={event => { if (suspended || !present) event.preventDefault() }}>Create a watch<SvgIcon name="arrow-up-right" size={16}/></Link> : <button type="button" aria-label={`Continue to ${STEPS[stage + 1]}`} disabled={suspended || !present} onClick={onContinue}>Next step<SvgIcon name="arrow-right" size={16}/></button>}</footer>
    </div>
  </motion.article>
}

export function ShiftStory({ suspended }: { suspended: boolean }) {
  const host = useRef<HTMLElement>(null), desk = useRef<HTMLDivElement>(null), quiet = useQuietMotion()
  const focusAfterSwap = useRef(false)
  const reduced = useReducedAnimation(), wide = useWideScene(), pinned = wide && !reduced
  const [{ stage, direction }, setSelection] = useState({ stage: 0, direction: 1 })
  const select = useCallback((next: number) => setSelection(previous => previous.stage === next ? previous : { stage: next, direction: next > previous.stage ? 1 : -1 }), [])
  const entered = useInView(desk, { once: true, amount: .15 }), ready = entered || quiet
  const { scrollYProgress } = useScroll({ target: host, offset: ['start 78px', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', value => { if (pinned && !suspended && !quiet) select(Math.min(2, Math.max(0, Math.floor(value * 3)))) })
  const deckY = useTransform(scrollYProgress, [0, 1], [18, -18]), progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const go = (index: number) => {
    if (suspended) return
    if (!pinned) { select(index); return }
    const node = host.current!
    scrollTo({ top: node.getBoundingClientRect().top + scrollY - 78 + (index + .3) / 3 * (node.offsetHeight - innerHeight + 78), behavior: quiet ? 'instant' : 'smooth' })
  }
  const settled = () => {
    if (!focusAfterSwap.current) return
    focusAfterSwap.current = false
    if (document.activeElement === document.body || document.activeElement?.closest('.v-handoff-sheet')) {
      host.current?.querySelector<HTMLElement>('.v-handoff-sheet[data-active] footer :is(button,a)')?.focus({ preventScroll: true })
    }
  }
  return <section ref={host} id="system" className="v-story v-handoff" data-motion-scene="paper-deal" data-entered={ready || undefined} data-pinned={pinned || undefined} data-stage={stage} data-direction={direction}>
    <div className="v-handoff-sticky v-shell">
      <h2><LineReveal from="left">Leave it with <span>BOB.</span></LineReveal></h2>
      <motion.div ref={desk} className="v-handoff-desk" style={quiet || !pinned ? undefined : { y: deckY }}>
        <div className="v-mouth-figure"><motion.div className="v-handoff-stack" aria-label="How to configure a watch" initial={false} animate={ready ? { x: 0, y: 0, rotate: 0, opacity: 1 } : { x: -80, y: 65, rotate: -6, opacity: 0 }} transition={{ duration: quiet ? 0 : 1.15, ease: EASE }}>
          <div className="v-mouth-pocket"><div className="v-mouth-paper-edges" aria-hidden="true"><span/><span/></div><AnimatePresence initial={false} custom={direction}><WatchCard key={stage} stage={stage} direction={direction} quiet={quiet} suspended={suspended} onContinue={() => { focusAfterSwap.current = true; go((stage + 1) % 3) }} onSettled={settled}/></AnimatePresence></div>
          <NoteCarrier stage={stage} active={ready} quiet={quiet}/>
        </motion.div></div>
      </motion.div>
      <div className="v-handoff-steps"><span className="v-handoff-track" aria-hidden="true"><motion.span style={quiet || !pinned ? { width: `${(stage + 1) / 3 * 100}%` } : { width: progress }}/></span>{STEPS.map((step, index) => <button type="button" key={step} aria-label={`Story step ${index + 1}: ${step}`} aria-pressed={stage === index} disabled={suspended} onClick={() => go(index)}>{step}<SvgIcon name={index === 0 ? 'arrow-up-right' : index === 1 ? 'sun' : 'bell'} size={16}/></button>)}</div>
    </div>
  </section>
}
