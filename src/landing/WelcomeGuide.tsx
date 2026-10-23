import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { DotOSWordmark } from '@/components/brand/DotOSBrand'
import { useReducedAnimation } from './useReducedAnimation'
import { usePortraitVideo } from './usePortraitVideo'
import { GUIDE_CHAPTERS, GUIDE_DURATION, GUIDE_POSTER, GUIDE_VIDEO, GUIDE_PORTRAIT_POSTER, GUIDE_PORTRAIT_VIDEO, rememberGuide } from './guide-content'
import './welcome-guide.css'

export function WelcomeGuide({ open, onClose }: { open: boolean; onClose: (destination?: 'workspace') => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playback = useRef({ wasOpen: false, position: 0, wanted: true, beforeReading: false })
  const reduced = useReducedAnimation()
  const portrait = usePortraitVideo()
  const startup = document.documentElement.dataset.startupStage === 'video'
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reading, setReading] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const chapter = GUIDE_CHAPTERS[Math.max(0, GUIDE_CHAPTERS.findLastIndex(item => time >= item.start))]

  const play = (player: HTMLVideoElement) => {
    void player.play().catch(() => {
      if (player.error) setFailed(true)
      // The Play button remains available when the browser blocks autoplay.
    })
  }
  const dismiss = () => {
    if (closingTimer.current !== null) return
    playback.current.wanted = false
    video.current?.pause()
    rememberGuide()
    if (reduced) { onClose(); return }
    setLeaving(true)
    closingTimer.current = setTimeout(() => { closingTimer.current = null; onClose() }, 320)
  }

  useEffect(() => () => { if (closingTimer.current !== null) clearTimeout(closingTimer.current) }, [])
  useEffect(() => {
    const element = dialog.current
    if (!element || !open) { playback.current.wasOpen = false; return }
    if (!playback.current.wasOpen) {
      playback.current.position = 0
      playback.current.wanted = !reduced
      setTime(0); setReading(false); setFailed(false); setLeaving(false)
    }
    playback.current.wasOpen = true
    const player = video.current
    const mediaFailed = () => setFailed(true)
    const mediaLoaded = () => setFailed(false)
    player?.addEventListener('error', mediaFailed)
    player?.addEventListener('loadeddata', mediaLoaded)
    if (player?.error) mediaFailed()
    const previousOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    element.showModal()
    if (document.documentElement.dataset.startupStage === 'video') {
      document.documentElement.setAttribute('data-intro-ready', '')
      document.getElementById('dotos-intro-cover')?.remove()
    }
    skip.current?.focus({ preventScroll: true })
    if (reduced) { playback.current.wanted = false; player?.pause() }
    else if (player && playback.current.wanted) void player.play().catch(() => { if (player.error) mediaFailed() })
    return () => {
      player?.removeEventListener('error', mediaFailed)
      player?.removeEventListener('loadeddata', mediaLoaded)
      player?.pause()
      if (element.open) element.close()
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousRootOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open, reduced, portrait])

  const seek = (start: number) => {
    playback.current.position = start
    if (video.current && video.current.readyState >= 1) video.current.currentTime = start
    setTime(start)
  }
  const togglePlayback = () => {
    const player = video.current
    if (!player || failed) return
    playback.current.wanted = player.paused
    if (player.paused) play(player)
    else player.pause()
  }
  const toggleReading = () => {
    if (!reading) {
      playback.current.beforeReading = playback.current.wanted
      playback.current.wanted = false
      video.current?.pause()
    } else {
      playback.current.wanted = playback.current.beforeReading
      if (video.current && playback.current.wanted) play(video.current)
    }
    setReading(!reading)
  }
  return <dialog ref={dialog} className="welcome-guide" lang="en" aria-labelledby="welcome-guide-title" aria-describedby="welcome-guide-description" data-startup={startup || undefined} data-leaving={leaving || undefined} data-reading={reading || undefined} data-failed={failed || undefined} onCancel={event => { event.preventDefault(); dismiss() }}>
    <h2 id="welcome-guide-title" className="welcome-guide-sr">Meet DotOS.</h2>
    <p id="welcome-guide-description" className="welcome-guide-sr">A {GUIDE_DURATION}-second silent introduction. Choose a Dot, add Memory and Skills, create a responsibility and follow its Activity.</p>
    {open && <>
      <header className="welcome-guide-top"><span className="welcome-guide-brand"><DotOSWordmark /></span><button ref={skip} type="button" className="welcome-guide-skip" aria-label="Skip intro" onClick={dismiss}>Skip intro<SvgIcon name="x" size={18} /></button></header>
      <div className="welcome-guide-stage" data-portrait={portrait || undefined} aria-hidden={reading || undefined}>
        <div className="welcome-guide-fill" aria-hidden="true" />
        <video key={portrait ? 'portrait' : 'landscape'} ref={video} src={portrait ? GUIDE_PORTRAIT_VIDEO : GUIDE_VIDEO} poster={startup ? undefined : portrait ? GUIDE_PORTRAIT_POSTER : GUIDE_POSTER} playsInline muted preload="metadata" autoPlay={!reduced && playback.current.wanted} aria-label="Silent Dots introduction" onLoadedMetadata={event => {
          const player = event.currentTarget
          player.currentTime = Math.min(playback.current.position, Math.max(0, player.duration - .1))
          setTime(player.currentTime)
          if (playback.current.wanted) play(player)
        }} onTimeUpdate={event => { playback.current.position = event.currentTarget.currentTime; setTime(event.currentTarget.currentTime) }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={dismiss} onError={() => setFailed(true)} />
        <div className={failed ? 'welcome-guide-fallback' : 'welcome-guide-sr'} aria-live="off" key={chapter.start}><h3>{chapter.title}</h3><p>{chapter.text}</p>{failed && <p className="welcome-guide-error" role="status">The intro could not load. Read the guide or open the workspace.</p>}</div>
      </div>
      {reading && <section className="welcome-guide-transcript" id="intro-transcript" aria-label="Introduction transcript"><span className="welcome-guide-eyebrow">DOTOS / QUICK START</span><h3>A little setup.<br />A lot less checking.</h3><ol>{GUIDE_CHAPTERS.map((item, index) => <li key={item.start}><span>0{index + 1}</span><div><h4>{item.label}</h4><p>{item.text}</p></div></li>)}</ol></section>}
      <footer className="welcome-guide-bottom"><div className="welcome-guide-tools"><button type="button" className="welcome-guide-play" aria-label={playing ? 'Pause intro' : 'Play intro'} onClick={togglePlayback} disabled={failed || reading}><SvgIcon name={playing ? 'pause' : 'play'} size={18} /></button><button type="button" className="welcome-guide-read" aria-expanded={reading} aria-controls="intro-transcript" onClick={toggleReading}>{reading ? 'Back to intro' : 'Read the guide'}</button></div>
        <nav className="welcome-guide-chapters" aria-label="Intro chapters">{GUIDE_CHAPTERS.map(item => <button key={item.start} type="button" aria-label={'Go to ' + item.label} title={item.label} aria-current={chapter.start === item.start ? 'step' : undefined} disabled={reading} onClick={() => seek(item.start)}><span><i style={{ width: Math.max(0, Math.min(1, (time - item.start) / item.duration)) * 100 + '%' }} /></span></button>)}</nav>
        <Link to="/app" className="welcome-guide-launch" onClick={() => { rememberGuide(); onClose('workspace') }}>Open DotOS<SvgIcon name="arrow-up-right" size={18} /></Link>
      </footer>
    </>}
  </dialog>
}
