import type { ReactNode } from 'react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { mateRenderProps } from '@/components/dotmate/render-images'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CREW } from '../experience/data'

type Progress = MotionValue<number>
type PieceProps = { children: ReactNode; className: string; progress: Progress; from?: [number, number, number, number]; range?: [number, number]; reduced: boolean }

function Piece({ children, className, progress, from = [0, 40, 0, 1], range = [.04, .5], reduced }: PieceProps) {
  const x = useTransform(progress, range, [from[0], 0]), y = useTransform(progress, range, [from[1], 0])
  const rotate = useTransform(progress, range, [from[2], 0]), scale = useTransform(progress, range, [from[3], 1])
  const opacity = useTransform(progress, [range[0], Math.min(range[0] + .14, range[1])], [0, 1])
  return <motion.div className={className} style={reduced ? undefined : { x, y, rotate, scale, opacity }}>{children}</motion.div>
}

const BEATS = [0, .18, .36, .55, .8, 1]
const POSES = [
  { x: [-65, -22, 8, -3, 0, 0], y: [45, -7, 6, -2, 0, 0], rotate: [-20, -7, 6, -2, 0, 0], scaleX: [.85, 1, 1.03, .99, 1, 1], scaleY: [.85, 1, .97, 1.01, 1, 1] },
  { x: [0, 0, 0, 0, 0, 0], y: [95, 35, -22, 7, 0, 0], rotate: [10, 5, -5, 2, 0, 0], scaleX: [.88, .96, 1, 1.06, 1, 1], scaleY: [.88, 1.04, 1.03, .94, 1, 1] },
  { x: [0, -8, -7, 5, 3, 0], y: [75, 35, 0, 0, 0, 0], rotate: [-8, -10, -7, 5, 7, 0], scaleX: [.92, 1, 1, 1, 1, 1], scaleY: [.92, 1, 1, 1, 1, 1] },
  { x: [65, 25, -8, 5, -2, 0], y: [-42, -14, 7, -4, 2, 0], rotate: [55, 22, -13, 8, -3, 0], scaleX: [.72, .9, 1.04, .99, 1, 1], scaleY: [.72, .9, 1.04, .99, 1, 1] },
]

function DutyMascot({ index, progress, reduced }: { index: number; progress: Progress; reduced: boolean }) {
  const mate = CREW[index], pose = POSES[index]
  const x = useTransform(progress, BEATS, pose.x), y = useTransform(progress, BEATS, pose.y), rotate = useTransform(progress, BEATS, pose.rotate)
  const scaleX = useTransform(progress, BEATS, pose.scaleX), scaleY = useTransform(progress, BEATS, pose.scaleY), opacity = useTransform(progress, [.02, .16], [0, 1])
  return <motion.div className="v-duty-mascot-piece" style={reduced ? undefined : { x, y, rotate, scaleX, scaleY, opacity }}><img className="v-duty-mascot" {...mateRenderProps(mate.body, mate.color, '(max-width: 760px) 180px, (max-width: 1100px) 250px, 330px')} alt="" width="450" height="520" loading="lazy"/></motion.div>
}

function BobScene({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const coinX = useTransform(progress, [.28, .7], [45, 0]), coinY = useTransform(progress, [.28, .7], [-64, 0])
  return <>
    <Piece className="d-wallet-piece" progress={progress} from={[-110, 28, -16, .9]} range={[.02, .48]} reduced={reduced}><div className="d-wallet"><header><SvgIcon name="wallet" size={17}/><span>Public wallet</span></header><strong>Balances<small>ETH & ERC-20</small></strong><div className="d-wallet-slots"><span/><span/><span/></div><span className="d-wallet-clasp"><SvgIcon name="wallet" size={19}/></span></div></Piece>
    <Piece className="d-chart-piece" progress={progress} from={[45, -55, 18, .9]} range={[.12, .62]} reduced={reduced}><div className="d-chart"><header><span>YOUR CONDITION</span><strong>Price rule</strong></header><div className="d-price-options"><span>Above / below</span><span>Change in %</span></div><span>You choose the threshold</span></div></Piece>
    <Piece className="d-coin-piece" progress={progress} from={[0, -85, -35, .75]} range={[.22, .65]} reduced={reduced}><motion.div style={!reduced ? { x: coinX, y: coinY } : undefined}><span className="d-coin"><svg viewBox="0 0 50 60" aria-hidden="true"><path d="M25 4 8 32l17 10 17-10Zm0 43L8 36l17 21 17-21Z" fill="#8b794b"/></svg></span></motion.div></Piece>
  </>
}

function MaxScene({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const launchY = useTransform(progress, [.14, .82], [80, -25]), launchRotate = useTransform(progress, [.14, .82], [16, -9]), line = useTransform(progress, [.15, .75], [0, 1])
  return <>
    <svg className="d-launch-route" viewBox="0 0 640 440" aria-hidden="true"><motion.path d="M302 384C513 362 528 243 451 93" fill="none" stroke="#7c744e" strokeWidth="1" style={reduced ? undefined : { pathLength: line }}/><path d="m447 104 4-13 9 10" fill="none" stroke="#b5a46e"/></svg>
    <Piece className="d-launch-pass-piece" progress={progress} from={[-35, 90, -14, .9]} range={[.12, .55]} reduced={reduced}><div className="d-launch-pass"><span>PONS V2</span><SvgIcon name="rocket" size={25}/><strong>Launch watch</strong><span className="d-pass-rule"/><small>Launches / graduations</small></div></Piece>
    <Piece className="d-rocket-piece" progress={progress} from={[0, 85, 20, .7]} range={[.05, .4]} reduced={reduced}><motion.div className="d-rocket-flight" style={reduced ? undefined : { y: launchY, rotate: launchRotate }}><svg className="d-paper-rocket" viewBox="0 0 160 240" aria-hidden="true"><path d="m62 121-35 63 34-15m39-48 35 63-34-15" fill="#a28b53" stroke="#d1be83"/><path d="M81 11C37 52 42 112 61 180h40c21-68 25-128-20-169Z" fill="#e7dbb6" stroke="#f3e7c6"/><path d="M81 11v169h20c21-68 25-128-20-169Z" fill="#c3ac71"/><path d="M49 71q32-17 64 0" fill="none" stroke="#a28a54"/><path d="m68 95 13-8 13 8v22l-13 8-13-8Z" fill="#334a5d" stroke="#8b9da6"/><path d="m61 180 20 36 20-36" fill="#e0bb69"/><path d="m73 181 8 24 8-24" fill="#f5e0b2"/><path d="m81 139-10 38 10 15 11-15Z" fill="#d8c18a" stroke="#9b8450"/></svg><svg className="d-rocket-trail" viewBox="0 0 160 50" aria-hidden="true"><path d="M81 0v36M61 0l-9 23M101 0l9 23" stroke="#b49b62" fill="none" strokeWidth="2"/></svg></motion.div></Piece>
  </>
}

function IggyScene({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const trace = useTransform(progress, [.12, .7], [0, 1]), packetX = useTransform(progress, [.22, .8], [0, 354]), packetY = useTransform(progress, [.22, .5, .8], [0, -92, 0]), scanX = useTransform(progress, [.2, .72], [-55, 55])
  return <>
    <svg className="d-transfer-route" viewBox="0 0 640 440" aria-hidden="true"><motion.path d="M112 257C174 102 465 103 524 257" fill="none" stroke="#6a9c87" strokeWidth="1.5" style={reduced ? undefined : { pathLength: trace }}/><path d="m514 247 11 12 4-16" stroke="#a3cab2" fill="none"/></svg>
    <Piece className="d-address-piece" progress={progress} from={[-80, 0, -5, 1]} range={[.02, .4]} reduced={reduced}><div className="d-address"><SvgIcon name="wallet" size={25}/><span>Public wallet</span><strong>Your address</strong></div></Piece>
    <Piece className="d-inbox-piece" progress={progress} from={[80, 0, 7, 1]} range={[.14, .52]} reduced={reduced}><div className="d-inbox"><SvgIcon name="scan-eye" size={25}/><span>Activity</span><strong>Transfer</strong><span className="d-inbox-check"><SvgIcon name="check-check" size={16}/></span></div></Piece>
    <svg className="d-packet-plane" viewBox="0 0 640 440" aria-hidden="true"><motion.g style={!reduced ? { x: packetX, y: packetY } : undefined}><g className="d-transfer-packet"><path d="m87 224 65-7 5 39-65 7Z" fill="#cfddbf" stroke="#7f9d88"/><path d="m88 225 35 17 28-24m-59 43 23-24m17-1 24 17" fill="none" stroke="#7f9d88"/></g></motion.g></svg>
    <motion.div className="d-scan-light" style={reduced ? undefined : { x: scanX }} aria-hidden="true"/>
  </>
}

function NovaScene({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const unfold = useTransform(progress, [.08, .52], ['inset(0% 0% 88% 0%)', 'inset(0% 0% 0% 0%)']), stampOpacity = useTransform(progress, [.4, .58], [0, 1]), stampScale = useTransform(progress, [.4, .58], [1.35, 1])
  return <>
    <Piece className="d-fee-roll-piece" progress={progress} from={[0, -50, 8, .95]} range={[.02, .38]} reduced={reduced}>
      <div className="d-fee-roll"/>
      <motion.div className="d-receipt-unfold" style={reduced ? undefined : { clipPath: unfold }}>
        <div className="d-fee-receipt"><header><SvgIcon name="coins" size={19}/><span>Creator fees</span></header><strong>Fee state</strong><div className="d-receipt-rules"><span/><span/><span/></div><motion.span className="d-fee-stamp" style={reduced ? undefined : { opacity: stampOpacity, scale: stampScale }}><SvgIcon name="check-check" size={17}/>READ ONLY</motion.span></div>
      </motion.div>
    </Piece>
    <Piece className="d-fee-label-piece" progress={progress} from={[-40, 25, -20, .85]} range={[.25, .68]} reduced={reduced}><span className="d-fee-label"><SvgIcon name="check-check" size={17}/>Escrow & claims</span></Piece>
  </>
}

export function DutyArtwork({ index, skill, progress, quote, quiet, reduced, playing }: { index: number; skill: number; progress: Progress; quote: string; quiet: boolean; reduced: boolean; playing: boolean }) {
  const mate = CREW[index]
  const frameX = useTransform(progress, [0, .32], [index === 0 ? 65 : index === 2 ? -65 : 0, 0]), frameY = useTransform(progress, [0, .32], [index === 1 ? 70 : 0, 0])
  const frameRotate = useTransform(progress, [0, .38], [index === 3 ? -5 : 0, 0]), frameOpacity = useTransform(progress, [0, .12], [.15, 1])
  const frameScale = useTransform(progress, [0, .42], [index === 0 ? .91 : .95, 1])
  const frameTilt = useTransform(progress, [0, .42], [index === 1 ? 12 : index === 3 ? -7 : 0, 0])
  const clip = useTransform(progress, [0, .32], ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'])
  return <motion.figure className="v-duty-art" data-art={mate.id} data-skill={skill} data-playing={playing && !quiet || undefined} data-quiet={quiet || undefined} aria-labelledby={`duty-title-${mate.id}`} style={reduced ? undefined : { x: frameX, y: frameY, scale: frameScale, rotateX: frameTilt, transformPerspective: 1000, rotate: frameRotate, opacity: frameOpacity, clipPath: index === 2 ? clip : undefined }}>
    <div className="v-duty-illustration" aria-hidden="true">{index === 0 ? <BobScene progress={progress} reduced={reduced}/> : index === 1 ? <MaxScene progress={progress} reduced={reduced}/> : index === 2 ? <IggyScene progress={progress} reduced={reduced}/> : <NovaScene progress={progress} reduced={reduced}/>}<DutyMascot index={index} progress={progress} reduced={reduced}/><span className="v-duty-ground"/></div>
    <Piece className="v-duty-bubble-piece" progress={progress} from={[0, 16, 0, .96]} range={[.28, .64]} reduced={reduced}><div className="v-duty-bubble"><span>{mate.name}</span><p>{quote}</p></div></Piece>
    <figcaption className="sr-only">{mate.name} explains {index === 0 ? 'balances and price rules' : index === 1 ? 'Pons launches' : index === 2 ? 'public wallet transfers' : 'creator fees'}.</figcaption>
  </motion.figure>
}
