import { useEffect, useId, useRef, useState } from 'react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import './dashboard-guide.css'

const STEPS = [
  { title: 'Start with your wallet.', text: 'Link a public wallet address here if you want. You can create a Dot without connecting a wallet.', target: '.workspace-top .workspace-wallet' },
  { title: 'Read your system.', text: 'See your active Dots, running responsibilities, unread alerts and recorded checks.', target: '.os-overview-stats' },
  { title: 'Meet your crew.', text: 'Each Dot has a specialty. Open its card to see tasks, watched assets and skills. The controls below let you add a task or pause the robot.', target: '.w-helper-grid > li:first-child, .w-empty' },
  { title: 'Give a robot a job.', text: 'Add a task from a template or your own instructions. Choose a Dot and a check frequency. It keeps watching until you pause it.', target: '[data-guide-target="1"]' },
  { title: 'See what is running.', text: 'Watching means a task is active. Paused tasks wait for you. Open the full Tasks page to filter, inspect or resume a watch.', target: '[data-guide-target="2"]' },
  { title: 'Catch the important changes.', text: 'Your crew reports matching events here. Open an alert to read the details and mark it as read. Your unread count updates with it.', target: '[data-guide-target="3"]' },
  { title: 'Find your way around.', text: 'Responsibilities manages your watches. Activity keeps their results. Skills equips your Dots. Use Ctrl K to find a page, Dot or task.', target: '.workspace-sidebar nav[aria-label="Workspace"], .workspace-mobile-nav' },
]

type Rect = { x: number; y: number; width: number; height: number }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

export function DashboardGuide({ step, onStep, onClose }: { step: number | null; onStep: (step: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const mask = useId()
  const [bounds, setBounds] = useState<Rect | null>(null)
  const [measuredStep, setMeasuredStep] = useState<number | null>(null)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [panelHeight, setPanelHeight] = useState(280)
  const open = step !== null
  const current = STEPS[step ?? 0]

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (!open) { if (element.open) element.close(); return }
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    const previousScroll = window.scrollY
    document.body.style.overflow = 'hidden'
    if (!element.open) element.showModal()
    next.current?.focus({ preventScroll: true })
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      window.scrollTo({ top: previousScroll, behavior: 'instant' })
      const focus = previousFocus && previousFocus !== document.body && previousFocus.isConnected ? previousFocus : document.querySelector<HTMLElement>('[data-tour-launch]')
      focus?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (step === null) return
    let frame = 0
    let cancelled = false
    let target: Element | undefined
    let needsScroll = true
    next.current?.focus({ preventScroll: true })
    const measure = () => {
      if (cancelled) return
      frame = 0
      const width = window.innerWidth
      const height = window.innerHeight
      setViewport(previous => previous.width === width && previous.height === height ? previous : { width, height })
      target = Array.from(document.querySelectorAll(current.target)).find(node => {
        const rect = node.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      if (!target) return
      if (needsScroll) {
        needsScroll = false
        const rect = target.getBoundingClientRect()
        if (!target.closest('.workspace-top, .workspace-sidebar, .workspace-mobile-nav')) {
          const top = width < 720 ? 94 : Math.max(110, (height - Math.min(rect.height, 400) - 170) / 2)
          window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - top), behavior: 'instant' })
        }
      }
      const rect = target.getBoundingClientRect()
      const x = clamp(rect.left - 7, 6, width - 12)
      const y = clamp(rect.top - 7, 6, height - 12)
      const box = { x, y, width: Math.min(rect.right + 7, width - 6) - x, height: Math.min(rect.bottom + 7, height - 6) - y }
      setBounds(previous => previous && Object.keys(box).every(key => Math.abs(previous[key as keyof Rect] - box[key as keyof Rect]) < .5) ? previous : box)
      setMeasuredStep(step)
      if (panel.current) setPanelHeight(panel.current.getBoundingClientRect().height)
    }
    const schedule = () => { if (!frame && !cancelled) frame = requestAnimationFrame(measure) }
    const resize = new ResizeObserver(schedule)
    resize.observe(document.querySelector('.workspace-main') ?? document.body)
    if (panel.current) resize.observe(panel.current)
    const mutations = new MutationObserver(schedule)
    const main = document.querySelector('.workspace-main')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const settle = window.setTimeout(schedule, 260)
    document.fonts.ready.then(schedule)
    schedule()
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      clearTimeout(settle)
      resize.disconnect()
      mutations.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [step, current.target])

  const width = Math.min(360, viewport.width - 32)
  let left = viewport.width - width - 18
  let top = viewport.height - panelHeight - 18
  if (bounds && viewport.width < 720 && bounds.y - panelHeight - 18 >= 16) {
    top = bounds.y - panelHeight - 18
  }
  if (bounds && viewport.width >= 720) {
    const right = bounds.x + bounds.width
    const bottom = bounds.y + bounds.height
    if (right + width + 36 <= viewport.width) { left = right + 18; top = bounds.y }
    else if (bottom + panelHeight + 36 <= viewport.height) { left = right - width; top = bottom + 18 }
    else if (bounds.x - width - 36 >= 0) { left = bounds.x - width - 18; top = bounds.y }
    else if (bounds.y - panelHeight - 18 >= 90) { left = right - width; top = bounds.y - panelHeight - 18 }
  }
  left = clamp(left, 16, viewport.width - width - 16)
  top = clamp(top, 16, viewport.height - panelHeight - 16)
  const advance = () => (step ?? 0) === STEPS.length - 1 ? onClose() : onStep((step ?? 0) + 1)

  return <dialog ref={dialog} className="dashboard-tour" aria-labelledby="dashboard-tour-title" aria-describedby="dashboard-tour-description" data-step={step ?? 'closed'} data-ready={bounds && measuredStep === step ? 'true' : 'false'} onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); advance() }
    if (event.key === 'ArrowLeft' && step && step > 0) { event.preventDefault(); onStep(step - 1) }
    if (event.key === 'Tab') {
      const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }}>
    <svg className="tour-veil" width={viewport.width} height={viewport.height} aria-hidden="true">
      <defs><mask id={mask}><rect width="100%" height="100%" fill="white" />{bounds && <rect {...bounds} fill="black" rx="8" />}</mask></defs>
      <rect width="100%" height="100%" fill="#10150f" opacity=".76" mask={`url(#${mask})`} />
      {bounds && <rect {...bounds} rx="8" className="tour-spotlight" />}
    </svg>
    <div ref={panel} className="tour-card" style={{ left, top, width }}>
      <div className="tour-card-top"><span>0{(step ?? 0) + 1} / 0{STEPS.length}</span><button type="button" className="tour-close" aria-label="Close tour" onClick={onClose}><SvgIcon name="x" size={17} /></button></div>
      <div className="tour-progress" aria-label="Tour progress">{STEPS.map((item, index) => <button key={item.title} type="button" aria-label={`Go to step ${index + 1}`} aria-current={step === index ? 'step' : undefined} className={index <= (step ?? 0) ? 'is-reached' : ''} onClick={() => onStep(index)} />)}</div>
      <h2 id="dashboard-tour-title">{current.title}</h2>
      <p id="dashboard-tour-description">{current.text}</p>
      <p className="tour-note">Saved workspace · Read-only monitoring.</p>
      <div className="tour-controls"><button type="button" className="tour-skip" onClick={onClose}>Skip tour</button><div><button type="button" className="tour-back" disabled={step === 0} aria-label="Previous step" onClick={() => onStep(Math.max(0, (step ?? 0) - 1))}><SvgIcon name="arrow-left" size={16} /></button><button ref={next} type="button" className="tour-next" onClick={advance}>{step === STEPS.length - 1 ? 'Finish tour' : 'Next'}<SvgIcon name={step === STEPS.length - 1 ? 'check' : 'arrow-right'} size={15} /></button></div></div>
    </div>
  </dialog>
}
