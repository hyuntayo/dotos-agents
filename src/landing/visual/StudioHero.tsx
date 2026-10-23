import { useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { motion, useInView, useScroll, useSpring, useTransform } from 'motion/react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { watchSetupLink, type WatchSetup } from '@/content/task-entry'
import { CREW } from '../experience/data'
import { useQuietMotion } from '../experience/motion-context'
import { Go } from './Primitives'
import { HeroActor, type HeroMode } from './HeroActor'
import { LineReveal } from './SceneMotion'

const studioQuery = '(max-width: 760px)'
const subscribeStudio = (listener: () => void) => { const media = matchMedia(studioQuery); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener) }
const SETUPS: WatchSetup[] = ['balances', 'launches', 'transfers', 'fees']
export function StudioHero({ suspended, onVideo }: { suspended: boolean; onVideo: () => void }) {
  const host = useRef<HTMLElement>(null), quiet = useQuietMotion()
  const visible = useInView(host, { margin: '80px' }), everVisible = useInView(host, { once: true, margin: '80px' })
  const compact = useSyncExternalStore(subscribeStudio, () => matchMedia(studioQuery).matches, () => false)
  const [selected, setSelected] = useState(0), [mode, setMode] = useState<HeroMode>('awake'), [cache, setCache] = useState([0])
  const dot = CREW[selected]
  const { scrollYProgress } = useScroll({ target: host, offset: ['start start', 'end start'] })
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26 })
  const stageY = useTransform(progress, [0, 1], [0, 135]), stageScale = useTransform(progress, [0, 1], [1, .7])
  const titleY = useTransform(progress, [0, 1], [0, -95]), titleFade = useTransform(progress, [0, .8, 1], [1, .35, 0])
  const choose = (index: number) => { setCache(previous => [index, ...previous.filter(value => value !== index)].slice(0, 2)); setSelected(index); setMode('awake') }
  return <section ref={host} className="v-hero v-shell" data-motion-scene="hero-curtain" data-mate={dot.id} style={{ '--mate': dot.accent } as CSSProperties}>
    <div className="v-hero-top"><button type="button" onClick={onVideo}><SvgIcon name="play" size={13}/>The film</button></div>
    <motion.div className="v-hero-title" style={quiet ? undefined : { y: titleY, opacity: titleFade }}><h1><LineReveal>Your day.</LineReveal><LineReveal from="left" delay={.14}>Their shift.</LineReveal></h1></motion.div>
    <motion.div className="v-studio" style={quiet ? undefined : { y: stageY, scale: stageScale }}>
      <span className="v-studio-word" aria-hidden="true">DotOS</span>
      {CREW.map((mate, index) => <HeroActor key={mate.id} index={index} selected={selected} prepared={cache.includes(index) && everVisible} compact={compact} quiet={quiet} suspended={suspended || !visible} mode={mode} choose={choose} onPausedChange={value => setMode(value ? 'sleeping' : 'awake')}/>)}
      <div className="v-studio-caption"><span>{dot.name}<small>{dot.role}</small></span><div className="v-model-modes" role="group" aria-label="Character animations">{[['awake', 'sun', 'Awake'], ['sleeping', 'moon', 'Sleep']].map(([id, icon, name]) => <button type="button" key={id} aria-label={`${name} lead companion`} aria-pressed={mode === id} onClick={() => setMode(id as HeroMode)}><SvgIcon name={icon} size={14}/><span>{name}</span></button>)}</div></div>
    </motion.div>
    <div className="v-hero-actions"><Go/><Link className="v-try" to={watchSetupLink(dot.id, SETUPS[selected])}>Set up {dot.name}<SvgIcon name="arrow-up-right" size={14}/></Link></div>
    <div className="v-hero-foot"><a href="#system" aria-label="How DotOS works"><SvgIcon name="arrow-down" size={18}/></a></div>
  </section>
}
