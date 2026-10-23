import { motion } from 'motion/react'

type Props = { active: boolean; quiet: boolean; stage: number }
const BASE='/models/note-holder-v1/'

export function NoteCarrier({ active, quiet, stage }: Props) {
  return <div className="v-note-holder" role="img" aria-label="BOB holding the entire card inside his wide open mouth" data-gripping={active||undefined}>
    <img className="v-note-holder-body" src={`${BASE}body-900.webp`} srcSet={`${BASE}body-900.webp 900w, ${BASE}body-1400.webp 1400w, ${BASE}body-2000.webp 2000w`} sizes="(max-width: 760px) 650px, (max-width: 1200px) 900px, 1000px" width="2000" height="1300" alt="" loading="lazy"/>
    <span className="v-note-holder-tooth" aria-hidden="true"/>
    <motion.img key={`hat-${stage}`} className="v-note-holder-hat" src={`${BASE}hat.webp`} width="371" height="290" alt="" loading="lazy" initial={false} animate={quiet||!active?{rotate:0}:{rotate:[0,-3,0]}} transition={{duration:quiet?0:.65,delay:quiet?0:.15,ease:'easeInOut'}}/>
    <div className="v-note-holder-eyes" aria-hidden="true">{['L','R'].map(side=><motion.img key={`${stage}-${side}`} className={`v-note-holder-eye v-note-holder-eye-${side}`} src={`${BASE}eye${side}.webp`} width="70" height="95" alt="" loading="lazy" initial={false} animate={quiet||!active?{scaleY:1}:{scaleY:[1,.12,1]}} transition={{duration:quiet?0:.3,delay:quiet?0:.45,ease:'easeInOut'}}/>)}</div>
  </div>
}
