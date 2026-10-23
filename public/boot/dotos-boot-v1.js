/* The small pre-React scene owns only #dotos-boot and temporary root attributes. */
(() => {
  'use strict'
  const start = () => {
  const html = document.documentElement, screen = document.getElementById('dotos-boot'), root = document.getElementById('root')
  if (!screen || !root || !html.hasAttribute('data-booting')) { screen?.remove(); return }
  if (screen.hasAttribute('data-controlled')) return
  screen.setAttribute('data-controlled', '')
  const actor = screen.querySelector('.dotos-boot-actor'), portrait = screen.querySelector('.dotos-boot-mate')
  const backdrop = screen.querySelector('.dotos-boot-backdrop'), status = screen.querySelector('[data-boot-status]')
  const bar = screen.querySelector('.dotos-boot-track>span'), skip = screen.querySelector('[data-boot-skip]')
  const preference = matchMedia('(prefers-reduced-motion: reduce)'), events = new AbortController()
  const started = performance.now()
  let imageAt = 0, appAt = 0, leaving = false, done = false, userSkipped = false, poll = 0, deadline = 0, releaseTimer = 0
  const animations = []
  const reduced = () => preference.matches
  const setReduced = () => screen.toggleAttribute('data-reduced', reduced())
  const finish = () => {
    if (done) return
    done = true
    clearInterval(poll); clearTimeout(deadline); clearTimeout(releaseTimer); events.abort()
    animations.forEach(animation => animation.cancel())
    html.removeAttribute('data-booting'); html.removeAttribute('data-boot-revealing'); html.removeAttribute('data-boot-scroll-lock')
    html.dataset.startupStage = 'ready'
    root.inert = false; root.removeAttribute('aria-hidden'); root.removeAttribute('aria-busy')
    screen.remove()
    if (userSkipped) { const heading = root.querySelector('h1'); if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) } }
    document.dispatchEvent(new Event('dotos:boot-complete'))
  }
  const play = (element, frames, options) => {
    if (typeof element?.animate !== 'function') return
    const animation = element.animate(frames, options)
    animations.push(animation)
    return animation
  }
  const reveal = () => {
    if (leaving || done) return
    leaving = true
    clearInterval(poll)
    // Restore the scrollbar before measuring the destination, while still opaque.
    html.removeAttribute('data-boot-scroll-lock')
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (done) return
      html.setAttribute('data-boot-revealing', '')
      screen.dataset.phase = 'reveal'
      const fast = reduced() || userSkipped
      const target = root.querySelector('.v-studio-mate[data-lead] .v-actor-render')
      const destination = target?.getBoundingClientRect(), origin = actor.getBoundingClientRect()
      const canLand = !fast && destination && destination.width > 0 && destination.top < innerHeight && !screen.hasAttribute('data-image-failed')
      const duration = canLand ? 780 : fast ? 120 : 260
      const ease = 'cubic-bezier(.22,1,.36,1)'
      if (canLand) {
        // object-fit:contain: use the original PNG's visible image rectangle.
        const ratio = Math.min(destination.width / 450, destination.height / 520)
        const width = 450 * ratio, height = 520 * ratio
        const x = destination.left + destination.width / 2 - (origin.left + origin.width / 2)
        const y = destination.top + destination.height / 2 - (origin.top + origin.height / 2)
        const transform = `translate3d(${x}px,${y}px,0) scale(${width / origin.width},${height / origin.height})`
        play(actor, [{ transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: 0 }, { transform, opacity: 1, offset: .78 }, { transform, opacity: 0, offset: 1 }], { duration, easing: ease, fill: 'forwards' })
      } else play(actor, [{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' })
      play(backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: Math.min(duration, 520), easing: ease, fill: 'forwards' })
      screen.querySelectorAll('.dotos-boot-header,.dotos-boot-caption,.dotos-boot-shadow').forEach(node => play(node, [{ opacity: 1 }, { opacity: 0 }], { duration: Math.min(duration, 180), fill: 'forwards' }))
      releaseTimer = setTimeout(finish, duration + 40)
    }))
  }
  const imageReady = () => {
    if (imageAt) return
    imageAt = performance.now(); screen.setAttribute('data-image-ready', '')
  }
  const check = () => {
    if (done || leaving) return
    const now = performance.now(), app = root.querySelector('.visual-site')
    if (app && !appAt) appAt = now
    const fontReady = !document.fonts || document.fonts.status === 'loaded' || appAt && now - appAt > 700
    const modelReady = !!root.querySelector('.v-studio-mate[data-lead] .v-hero-model[data-model-ready=true]')
    const imageLoaded = portrait.complete && portrait.naturalWidth > 0
    if (imageLoaded) imageReady()
    else if (portrait.complete) { screen.setAttribute('data-image-failed', ''); if (!imageAt) imageAt = now - 1200 }
    bar.style.transform = `scaleX(${[!!appAt, imageLoaded, fontReady, modelReady].filter(Boolean).length / 4})`
    if (imageAt && now - imageAt >= 1080) screen.dataset.phase = 'settled'
    if (!appAt) { if (screen.dataset.phase === 'settled' && status.textContent !== 'Getting the crew ready.') status.textContent = 'Getting the crew ready.'; return }
    const visualsReady = modelReady || now - appAt >= 1500
    const jumpFinished = reduced() || userSkipped || imageAt && now - imageAt >= 1150 || now - started >= 2400
    const message = visualsReady ? 'Ready for your day.' : 'Getting the crew ready.'
    if (status.textContent !== message) status.textContent = message
    if (jumpFinished && fontReady && (visualsReady || reduced())) reveal()
  }
  const skipScene = () => { userSkipped = true; html.setAttribute('data-intro-skipped', ''); if (leaving) finish(); else reveal() }
  const onPreference = () => { setReduced(); if (reduced() && leaving) finish(); else check() }
  try {
    setReduced()
    requestAnimationFrame(() => { if (!done) skip.focus({ preventScroll: true }) })
    portrait.addEventListener('load', imageReady, { signal: events.signal })
    portrait.addEventListener('error', () => { screen.setAttribute('data-image-failed', ''); imageAt = performance.now() - 1200; check() }, { signal: events.signal })
    skip.addEventListener('click', skipScene, { signal: events.signal })
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); skipScene() } }, { signal: events.signal })
    preference.addEventListener('change', onPreference, { signal: events.signal })
    window.addEventListener('resize', () => { if (leaving) finish() }, { signal: events.signal })
    window.addEventListener('pagehide', finish, { signal: events.signal })
    poll = setInterval(check, 80)
    // A failed route/model/image must never leave the page inert indefinitely.
    deadline = setTimeout(() => { userSkipped = true; reveal() }, 8000)
    check()
  } catch {
    finish()
  }
  }
  if (document.documentElement.dataset.startupStage === 'video') {
    document.addEventListener('dotos:boot-start', start, { once: true })
  } else start()
})()
