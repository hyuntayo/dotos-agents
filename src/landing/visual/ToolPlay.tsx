import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router'
import { watchSetupLink, type WatchSetup } from '@/content/task-entry'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CREW, TOOLS } from '../experience/data'
import { useQuietMotion } from '../experience/motion-context'
import { useReducedAnimation } from '../useReducedAnimation'
import { LineReveal } from './SceneMotion'
import { DutyArtwork } from './DutyArtwork'
import './duty-stories.css'

const LABELS = ['Balances', 'Transfers', 'Launches', 'Fees', 'Prices']
const SKILL_SETUPS: WatchSetup[] = ['balances', 'transfers', 'launches', 'fees', 'prices']
const DUTIES = [
  { skills: [0, 4], title: ['A second', 'pair of eyes.'], line: 'I compare your balances and flag the price rules you set.', priceLine: 'I watch your price rule. When it matches, I let you know.' },
  { skills: [2], title: ['New launch?', 'I’m on it.'], line: 'I watch Pons launches and save the ones that appear.' },
  { skills: [1], title: ['I follow', 'the trail.'], line: 'I follow public wallet transfers and keep their source in Activity.' },
  { skills: [3], title: ['Every fee.', 'In view.'], line: 'I read your creator fees. Claims stay in your hands.' },
]

function DutyStory({ index, suspended, pageVisible }: { index: number; suspended: boolean; pageVisible: boolean }) {
  const host = useRef<HTMLElement>(null), quiet = useQuietMotion(), reduced = useReducedAnimation()
  const visible = useInView(host, { margin: '80px' })
  const { scrollYProgress } = useScroll({ target: host, offset: ['start .9', 'end .28'] })
  const progress = useMotionValue(reduced ? 1 : scrollYProgress.get())
  useMotionValueEvent(scrollYProgress, 'change', next => { if (!quiet) progress.set(next) })
  useEffect(() => {
    if (reduced || quiet && !visible) progress.set(1)
    else if (!quiet) progress.set(scrollYProgress.get())
  }, [quiet, reduced, visible, progress, scrollYProgress])
  const duty = DUTIES[index], mate = CREW[index]
  const [skill, setSkill] = useState(duty.skills[0])
  const copyY = useTransform(progress, [0, .36], [[22, 68, 0, -42][index], 0]), copyOpacity = useTransform(progress, [0, .24], [.35, 1])
  const copyX = useTransform(progress, [0, .36], [[-48, 0, 58, 0][index], 0])
  const rule = useTransform(progress, [0, 1], ['0%', '100%'])
  const quote = index === 0 && skill === 4 ? duty.priceLine! : duty.line
  return <article ref={host} id={`duty-${mate.id}`} className="v-duty" data-mate={mate.id} style={{ '--duty-accent': mate.accent } as CSSProperties}>
    <motion.div className="v-duty-copy" style={reduced ? undefined : { x: copyX, y: copyY, opacity: copyOpacity }}>
      <div className="v-duty-byline"><span>{mate.name}</span><SvgIcon name={mate.icon} size={17}/></div>
      <h3 id={`duty-title-${mate.id}`}>{duty.title[0]}<br/><span>{duty.title[1]}</span></h3>
      {duty.skills.length > 1 ? <div className="v-duty-skills" role="group" aria-label="BOB’s monitoring skills">{duty.skills.map(value => <button key={value} type="button" aria-pressed={skill === value} onClick={() => setSkill(value)}><SvgIcon name={TOOLS[value].icon} size={15}/>{LABELS[value]}</button>)}</div> : <span className="v-duty-skill"><SvgIcon name={TOOLS[skill].icon} size={16}/>{LABELS[skill]}</span>}
      <div className="v-duty-controls"><Link className="v-duty-try" to={watchSetupLink(mate.id, SKILL_SETUPS[skill])}>Set up {mate.name}<SvgIcon name="arrow-up-right" size={16}/></Link></div>
      <p className="v-duty-result">{TOOLS[skill].source}</p>
    </motion.div>
    <DutyArtwork index={index} skill={skill} progress={progress} quote={quote} quiet={quiet} reduced={reduced} playing={visible && pageVisible && !suspended}/>
    <div className="v-duty-baseline" aria-hidden="true"><motion.span style={{ width: rule }}/></div>
  </article>
}

export function ToolPlay({ suspended }: { suspended: boolean }) {
  const host = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0), [pageVisible, setPageVisible] = useState(!document.hidden)
  useEffect(() => { const update = () => setPageVisible(!document.hidden); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update) }, [])
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const section = host.current
      if (!section) return
      const bounds = section.getBoundingClientRect()
      if (bounds.top > innerHeight || bounds.bottom < 0) return
      const chapters = [...section.querySelectorAll('.v-duty')]
      const next = chapters.findLastIndex(chapter => chapter.getBoundingClientRect().top < innerHeight * .55)
      setActive(Math.max(0, next))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule); schedule()
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule) }
  }, [])
  return <section ref={host} id="capabilities" className="v-duty-stories v-shell" data-motion-scene="mascot-field-notes">
    <header className="v-duty-heading"><h2><LineReveal from="right">Here’s what</LineReveal><LineReveal delay={.1}>we do.</LineReveal></h2></header>
    <nav className="v-duty-nav" aria-label="Meet the specialists">{CREW.map((mate, index) => <a key={mate.id} href={`#duty-${mate.id}`} aria-current={active === index ? 'location' : undefined} style={{ '--duty-accent': mate.accent } as CSSProperties}>{mate.name}<SvgIcon name="arrow-down" size={13}/></a>)}</nav>
    <div className="v-duty-chapters">{DUTIES.map((_, index) => <DutyStory key={CREW[index].id} index={index} suspended={suspended} pageVisible={pageVisible}/>)}</div>
  </section>
}
