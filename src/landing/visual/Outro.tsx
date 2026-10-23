import { mateRenderProps } from '@/components/dotmate/render-images'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CREW } from '../experience/data'
import { useQuietMotion } from '../experience/motion-context'
import { Go } from './Primitives'
import { TokenContract } from '../TokenContract'
import { Letterpress, LineReveal, MosaicMate, useFrozenScrollProgress } from './SceneMotion'

export function PrivacyScene() {
  const host = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: host, offset: ['start .95', 'start .3'] })
  const progress = useFrozenScrollProgress(scrollYProgress)
  const x = useTransform(progress, [0, .85, 1], [-145, 0, 0]), opposite = useTransform(progress, [0, .85, 1], [140, 0, 0])
  return <section ref={host} className="v-privacy v-shell" data-motion-scene="opposed-assembly">
    <div className="v-privacy-scene"><motion.h2 style={{ x }}>Your keys.</motion.h2><motion.span className="v-privacy-second" style={{ x: opposite }}>Your call.</motion.span><MosaicMate progress={progress}/></div>
    <div className="v-privacy-foot"><span>Public data. Private keys stay yours.</span><Link to="/privacy">Privacy<SvgIcon name="arrow-up-right" size={15}/></Link></div>
  </section>
}

const ANSWERS = [
  ['Can it move my funds?', 'No. Dots read public data. Wallet sign-in uses an authentication message.'],
  ['Does it work when I leave?', 'Configured watches run on the server. Pause or change them in your workspace.'],
  ['What is included?', 'Up to 6 Dots and 40 active watches. AI shares 50 attempts a day across DotOS.'],
]
function ArrivingMate({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const dot = CREW[index]
  const x = useTransform(progress, [0, 1], [(index - 1.5) * 150, 0]), y = useTransform(progress, [0, .6, 1], [index % 2 ? 95 : -65, index % 2 ? -20 : 20, 0])
  const rotate = useTransform(progress, [0, 1], [(index - 1.5) * 22, (index - 1.5) * -3])
  return <motion.div style={{ x, y, rotate }}><Link to={`/app/m/${dot.id}`} aria-label={`Set up ${dot.name}`}><img {...mateRenderProps(dot.body,dot.color,'(max-width: 760px) 20vw, 190px')} alt="" width="220" height="240" loading="lazy"/></Link></motion.div>
}
export function Outro() {
  const host = useRef<HTMLElement>(null), [more, setMore] = useState(false), quiet = useQuietMotion()
  const { scrollYProgress } = useScroll({ target: host, offset: ['start .95', 'end end'] })
  const progress = useFrozenScrollProgress(scrollYProgress)
  const actionY = useTransform(progress, [0, .45, 1], [38, 0, 0]), actionScale = useTransform(progress, [0, .45, 1], [.9, 1, 1]), actionTilt = useTransform(progress, [0, .45, 1], [14, 0, 0])
  return <section ref={host} id="workspace" className="v-outro v-shell" data-motion-scene="crew-convergence">
    <h2><LineReveal from="right">Bring company.</LineReveal></h2><motion.div className="v-outro-action" style={{ y: actionY, scale: actionScale, rotateX: actionTilt, transformPerspective: 1000 }}><Go>Start your shift</Go></motion.div>
    <div className="v-outro-crew">{CREW.map((dot, index) => <ArrivingMate key={dot.id} index={index} progress={progress}/>)}</div><Letterpress word="DotOS"/>
    <TokenContract/>
    <button type="button" className="v-more" aria-expanded={more} aria-controls="visual-answers" onClick={() => setMore(value => !value)}>Good to know<SvgIcon name={more ? 'minus' : 'plus'} size={16}/></button>
    <AnimatePresence>{more && <motion.div id="visual-answers" className="v-answers" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: quiet ? 0 : .35 }}>{ANSWERS.map(([question, answer]) => <details key={question}><summary>{question}<SvgIcon name="plus" size={15}/></summary><p>{answer}</p></details>)}</motion.div>}</AnimatePresence>
  </section>
}
