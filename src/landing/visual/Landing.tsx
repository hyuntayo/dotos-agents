import { useEffect,useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence,MotionConfig,motion,useScroll } from 'motion/react'
import { DotOSWordmark } from '@/components/brand/DotOSBrand'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { PROJECT_X_URL } from '@/content/links'
import { ExperienceMotion } from '../experience/motion-context'
import { ChapterMenu } from '../experience/ChapterMenu'
import { WelcomeGuide } from '../WelcomeGuide'
import { useReducedAnimation } from '../useReducedAnimation'
import { StudioHero } from './StudioHero'
import { Atmosphere } from './Atmosphere'
import { ShiftStory } from './ShiftStory'
import { CrewShift,SignalFold } from './CrewScenes'
import { ToolPlay } from './ToolPlay'
import { LivePulse } from './LivePulse'
import { Outro,PrivacyScene } from './Outro'
import { useStartupVideo } from './use-startup-video'
import './visual.css'
import './scene-motion.css'
import './readable-type.css'
import './launch-ready.css'

const YEAR=new Date().getFullYear(),NAV=[['system','How'],['crew','Crew'],['capabilities','Tools'],['network','Live']]
export function Landing(){
  const [menu,setMenu]=useState(false),[video,setVideo]=useStartupVideo(),[paused,setPaused]=useState(false),[active,setActive]=useState('')
  const reduced=useReducedAnimation(),quiet=reduced||paused||menu||video,suspended=paused||menu||video,{scrollYProgress}=useScroll()
  useEffect(()=>{document.title='DotOS — Your day. Their shift.';const color=document.documentElement.style.colorScheme,background=document.documentElement.style.backgroundColor;document.documentElement.style.colorScheme='dark';document.documentElement.style.backgroundColor='#090b0f';return()=>{document.documentElement.style.colorScheme=color;document.documentElement.style.backgroundColor=background}},[])
  useEffect(()=>{const sections=NAV.map(([id])=>document.getElementById(id)!);const observer=new IntersectionObserver(()=>setActive(sections.filter(node=>node.getBoundingClientRect().top<innerHeight*.5).at(-1)?.id??''),{rootMargin:'-15% 0px -40% 0px'});sections.forEach(node=>observer.observe(node));return()=>observer.disconnect()},[])
  const showVideo=()=>{setMenu(false);setVideo(true)}
  return <MotionConfig reducedMotion="user"><ExperienceMotion.Provider value={quiet}><div className="visual-site" data-motion={quiet?'off':'on'} inert={menu||video} aria-hidden={menu||video||undefined}><Atmosphere/><a className="v-skip" href="#main">Skip to content</a><motion.div className="v-page-progress" aria-hidden="true" style={{scaleX:scrollYProgress}}/><header className="v-header"><div className="v-nav v-shell"><Link to="/" aria-label="DotOS home"><DotOSWordmark/></Link><nav aria-label="Main navigation">{NAV.map(([id,name])=><a key={id} href={`#${id}`} aria-current={active===id?'location':undefined}>{name}</a>)}<Link to="/docs">Docs</Link></nav><div><button type="button" className="v-motion-button" aria-label={paused?'Resume page animations':'Pause page animations'} aria-pressed={!paused} onClick={()=>setPaused(value=>!value)}><SvgIcon name={paused?'play':'pause'} size={13}/></button><Link className="v-open" to="/app">Open DotOS<SvgIcon name="arrow-up-right" size={14}/></Link><button className="v-menu-button" type="button" aria-label="Open menu" aria-controls="experience-menu" aria-expanded={menu} onClick={()=>setMenu(true)}><SvgIcon name="menu" size={21}/></button></div></div></header><main id="main"><StudioHero suspended={suspended} onVideo={showVideo}/><ShiftStory suspended={suspended}/><CrewShift/><SignalFold/><ToolPlay suspended={suspended}/><LivePulse suspended={video||menu}/><PrivacyScene/><Outro/></main><footer className="v-footer v-shell"><span>© {YEAR} DotOS / Robinhood Chain</span><div><button type="button" aria-label="Watch video guide" onClick={showVideo}>Film<SvgIcon name="play" size={12}/></button><Link to="/docs">Docs</Link><Link to="/privacy">Privacy</Link><a href={PROJECT_X_URL} target="_blank" rel="noopener noreferrer">X<SvgIcon name="arrow-up-right" size={12}/></a></div></footer></div><AnimatePresence>{menu&&<ChapterMenu quiet={reduced||paused} onClose={()=>setMenu(false)}/>}</AnimatePresence></ExperienceMotion.Provider><WelcomeGuide open={video} onClose={destination=>setVideo(false,destination)}/></MotionConfig>
}
