import { mateRenderProps } from '@/components/dotmate/render-images'
import { motion } from 'motion/react'
import { MateModel } from '@/components/dotmate/MateModel'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CREW } from '../experience/data'
export type HeroMode = 'awake' | 'sleeping' | 'working'

const POSES = [
  { x: '0%', y: '0%', scale: 1, rotate: 0 },
  { x: '-74%', y: '14%', scale: .5, rotate: -9 },
  { x: '74%', y: '16%', scale: .5, rotate: 8 },
  { x: '45%', y: '-23%', scale: .36, rotate: 7 },
]

type Props = {
  index: number
  selected: number
  prepared: boolean
  compact: boolean
  quiet: boolean
  suspended: boolean
  mode: HeroMode
  choose: (index: number) => void
  onPausedChange: (paused: boolean) => void
}

export function HeroActor({ index, selected, prepared, compact, quiet, suspended, mode, choose, onPausedChange }: Props) {
  const mate = CREW[index], slot = (index - selected + CREW.length) % CREW.length, lead = slot === 0
  // Every character keeps the same footprint and render throughout the move.
  // Prepare on selection, rather than waiting for the movement to finish.
  // A two-character cache retains the renderer; hidden viewers stop drawing.
  const pose = compact ? { ...POSES[slot], x: ['0%', '-43%', '43%', '26%'][slot], y: ['0%', '-3%', '-1%', '-30%'][slot], scale: [1, .34, .34, .28][slot] } : POSES[slot]
  return <motion.div
    className="v-studio-mate"
    data-lead={lead || undefined}
    data-mate={mate.id}
    data-slot={slot}
    initial={false}
    animate={{ ...pose, rotate: quiet ? 0 : pose.rotate }}
    transition={{ duration: quiet ? 0 : .72, ease: [.22, 1, .36, 1] }}
  >
    <button type="button" className="v-mate-select" aria-label={`Choose ${mate.name}`} aria-hidden={lead || undefined} tabIndex={lead ? -1 : 0} onClick={() => choose(index)}>
      <motion.img className="v-actor-render" {...mateRenderProps(mate.body,mate.color,'(max-width: 760px) 390px, 650px')} alt="" width="650" height="700" animate={quiet || suspended || lead ? { y: 0 } : { y: [0, -8, 0] }} transition={{ duration: 5 + index, repeat: quiet || suspended || lead ? 0 : Infinity, ease: 'easeInOut' }}/>
      <motion.span animate={{ scale: 1 / pose.scale }} transition={{ duration: quiet ? 0 : .72, ease: [.22, 1, .36, 1] }}>{mate.name}<SvgIcon name="arrow-up-right" size={12}/></motion.span>
    </button>
    {prepared && <motion.div className="v-lead-model" aria-hidden={!lead || undefined} inert={!lead}>
      <MateModel mate={mate.id} interactive keepAlive className="v-hero-model" paused={mode === 'sleeping'} scanning={mode === 'working'} suspended={suspended || !lead} onPausedChange={onPausedChange} label={`${mate.name}, interactive lead companion`}/>
    </motion.div>}
  </motion.div>
}
