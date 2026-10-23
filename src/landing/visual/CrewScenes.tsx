import { mateRenderProps } from '@/components/dotmate/render-images'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CREW } from '../experience/data'
import { useQuietMotion } from '../experience/motion-context'
import { useReducedAnimation } from '../useReducedAnimation'
import { LineReveal } from './SceneMotion'
import { useWideScene } from './use-visual'
import './crew-scenes.css'
import './crew-arrivals.css'

function useSceneProgress(source: MotionValue<number>, quiet: boolean, reduced: boolean) {
  const value=useMotionValue(reduced ? 1 : source.get())
  useMotionValueEvent(source,'change',next=>{if(!quiet&&!reduced)value.set(next)})
  useEffect(()=>{if(reduced)value.set(1);else if(!quiet)value.set(source.get())},[quiet,reduced,source,value])
  return value
}

const JOBS=['Price conditions','Pons launches','Wallet transfers','Creator fees']
const ROLES=['Prices','Launches','Transfers','Fees']
function ShiftMate({index,progress,reduced}:{index:number;progress:MotionValue<number>;reduced:boolean}){
  const mate=CREW[index]
  const host=useRef<HTMLElement>(null),quiet=useQuietMotion()
  const entered=useInView(host,{once:true,amount:.3,margin:'0px 0px -36px 0px'})
  const [imageReady,setImageReady]=useState(false)
  useEffect(()=>{
    if(!host.current)return
    if(quiet&&(!entered||!imageReady))host.current.dataset.skipArrival='true'
    else if(!quiet&&!entered)delete host.current.dataset.skipArrival
  },[quiet,entered,imageReady])
  const y=useTransform(progress,[0,.5,1],index%2?[40,-12,-28]:[-24,6,32])
  const rotate=useTransform(progress,[0,1],index%2?[5,-4]:[-5,4])
  const slipY=useTransform(progress,[0,1],index%2?[-20,16]:[20,-16])
  return <article ref={host} className="v-shift-role" data-arrival={['roll','bounce','peek','twirl'][index]} data-entered={entered&&imageReady||undefined} style={{'--shift-color':mate.accent,'--arrival-delay':`${index%3*.09}s`} as CSSProperties}>
    <motion.div className="v-shift-actor" style={reduced?undefined:{y,rotate}}>
      <div className="v-shift-portrait"><div className="v-shift-arrival"><Link to={`/app/m/${mate.id}`} aria-label={`Meet ${mate.name}`}><motion.img {...mateRenderProps(mate.body,mate.color,'(max-width: 760px) 180px, (max-width: 1200px) 260px, 360px')} alt={mate.name} width="450" height="520" loading="lazy" onLoad={()=>setImageReady(true)} whileHover={quiet?undefined:{y:-12,rotate:3}} transition={{duration:.4}}/></Link></div></div>
      <motion.div className="v-shift-job" style={reduced?undefined:{y:slipY}}><SvgIcon name={mate.icon} size={16}/><span>{JOBS[index]}</span></motion.div>
    </motion.div>
    <span className="v-shift-contact" aria-hidden="true"/>
    <svg className="v-shift-desk" viewBox="0 0 420 90" aria-hidden="true"><path d="m29 24 181-20 181 20-181 24Z" fill="#182b43" stroke="#49607d"/><path d="m29 24 181 24 181-24v8L210 57 29 32Z" fill="#132238" stroke="#354d6b"/><path d="M57 37v37m306-37v37M210 57v28" stroke="#354d6b" strokeWidth="2"/><path d="m144 20 66-7 65 7-65 9Z" fill="none" stroke="var(--shift-color)" strokeOpacity=".4"/></svg>
    <div className="v-shift-role-name"><strong>{mate.name}</strong><span>{ROLES[index]}</span><SvgIcon name="arrow-up-right" size={15}/></div>
  </article>
}

export function CrewShift(){
  const host=useRef<HTMLElement>(null),windowRef=useRef<HTMLDivElement>(null),film=useRef<HTMLDivElement>(null)
  const quiet=useQuietMotion(),reduced=useReducedAnimation(),wide=useWideScene(),pinned=wide&&!reduced
  const [travel,setTravel]=useState(0)
  const {scrollYProgress}=useScroll({target:host,offset:pinned?['start 78px','end end']:['start .85','end .6']})
  const progress=useSceneProgress(scrollYProgress,quiet,reduced),x=useTransform(progress,[0,1],[0,-travel])
  const rule=useTransform(progress,[0,1],['0%','100%'])
  useEffect(()=>{const measure=()=>{if(windowRef.current&&film.current)setTravel(Math.max(0,film.current.scrollWidth-windowRef.current.clientWidth))};const observer=new ResizeObserver(measure);if(windowRef.current)observer.observe(windowRef.current);if(film.current)observer.observe(film.current);measure();return()=>observer.disconnect()},[])
  return <section ref={host} id="crew" className="v-shift" data-motion-scene="crew-shift" data-pinned={pinned||undefined} data-reduced={reduced||undefined}>
    <div className="v-shift-sticky v-shell">
      <h2><LineReveal from="left">Off your screen.</LineReveal><LineReveal delay={.12}>Still on it.</LineReveal></h2>
      <div ref={windowRef} className="v-shift-window"><motion.div ref={film} className="v-shift-film" style={wide&&!reduced?{x}:undefined}>{CREW.map((mate,index)=><ShiftMate key={mate.id} index={index} progress={progress} reduced={reduced}/>)}</motion.div></div>
      <div className="v-shift-footer" aria-hidden="true"><div><motion.span style={{width:rule}}/></div></div>
    </div>
  </section>
}

function PassingReading({side,progress}:{side:-1|1;progress:MotionValue<number>}){
  const x=useTransform(progress,[0,.65],[side*172,side*290]),y=useTransform(progress,[0,.65],[side===-1?-85:-45,90]),rotate=useTransform(progress,[0,.65],[side*12,side*30]),opacity=useTransform(progress,[0,.2,.65],[1,1,0])
  return <motion.div className="v-signal-reading" style={{x,y,rotate,opacity}} aria-hidden="true"><strong>{side===-1?'Prices':'Transfers'}</strong><SvgIcon name="minus" size={17}/></motion.div>
}

export function SignalFold(){
  const host=useRef<HTMLElement>(null),quiet=useQuietMotion(),reduced=useReducedAnimation(),wide=useWideScene(),pinned=wide&&!reduced
  const {scrollYProgress}=useScroll({target:host,offset:pinned?['start 78px','end end']:['start .85','end .55']})
  const progress=useSceneProgress(scrollYProgress,quiet,reduced)
  // Fully tuck the paper below the pocket's rim before bringing the flap forward.
  const letterY=useTransform(progress,[0,.18,.65,1],[-112,-112,110,110])
  const letterScale=useTransform(progress,[0,.18,.65,1],[1,1,.76,.76])
  const letterRotate=useTransform(progress,[0,.18,.6,1],[-5,-5,0,0]),flap=useTransform(progress,[.72,.93],[180,0]),flapZ=useTransform(progress,value=>value>=.72?4:0)
  const novaX=useTransform(progress,[0,.9],[100,0]),novaY=useTransform(progress,[0,.9],[70,0]),novaRotate=useTransform(progress,[0,.9],[19,-8])
  const seal=useTransform(progress,[.94,1],[0,1]),envelopeY=useTransform(progress,[0,1],[48,-8])
  return <section ref={host} id="signal" className="v-signal" data-motion-scene="signal-fold" data-pinned={pinned||undefined} data-reduced={reduced||undefined}>
    <div className="v-signal-sticky v-shell">
      <div className="v-signal-layout"><div className="v-signal-copy"><h2><LineReveal from="right">Less checking.</LineReveal><LineReveal delay={.12}>Good timing.</LineReveal></h2><p>Your rule matches.<br/>Your Dot brings the signal.</p></div>
        <div className="v-signal-stage" role="img" aria-label="How configured alerts reach your inbox.">
          {!reduced&&<><PassingReading side={-1} progress={progress}/><PassingReading side={1} progress={progress}/></>}
          <motion.div className="v-signal-envelope" style={reduced?undefined:{y:envelopeY}}>
            <svg className="v-signal-envelope-back" viewBox="0 0 400 300" aria-hidden="true"><path d="M30 115H370V280H30Z" fill="#6e9c8b" stroke="#9fc0a9"/><path d="M30 280 200 180 370 280" fill="#507e72"/></svg>
            <motion.div className="v-signal-letter" style={reduced?{y:110,rotate:0,scale:.76}:{y:letterY,rotate:letterRotate,scale:letterScale}} aria-hidden="true"><SvgIcon name="activity" size={20}/><strong>Your signal</strong></motion.div>
            <svg className="v-signal-envelope-face" viewBox="0 0 400 300" aria-hidden="true"><path d="M30 115 207 216 30 280Z" fill="#abcab2" stroke="#8bb098"/><path d="m370 115-177 101 177 64Z" fill="#8db69e" stroke="#719e88"/><path d="M30 280 184 185q16-10 32 0l154 95Z" fill="#bcd4bb" stroke="#98baa0"/><text x="200" y="260" textAnchor="middle" fontSize="11" fill="#456652" letterSpacing="2">INBOX</text></svg>
            <motion.svg className="v-signal-envelope-flap" viewBox="0 0 340 110" aria-hidden="true" style={reduced?{rotateX:0,zIndex:4}:{rotateX:flap,zIndex:flapZ}}><path d="M.5 .5H339.5L170 109.5Z" fill="#c9dbc4" stroke="#9bbca2" strokeLinejoin="round"/></motion.svg>
            <motion.span className="v-signal-seal" style={reduced?{scale:1,opacity:1}:{scale:seal,opacity:seal}}><SvgIcon name="check-check" size={22}/></motion.span>
          </motion.div>
          <motion.img className="v-signal-nova" {...mateRenderProps('star','pink','(max-width: 760px) 140px, 155px')} alt="" width="230" height="250" loading="lazy" style={reduced?undefined:{x:novaX,y:novaY,rotate:novaRotate}}/>
        </div>
      </div>
    </div>
  </section>
}
