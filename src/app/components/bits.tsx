import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import type { Expression } from '@/components/dotmate/sprites'
import { Icon, type PixelIconName } from '@/components/icons/Icon'
import { MateSprite } from '@/pixel/sprites/Sprite'
import type { ActivityKind, Mate, MateStatus } from '../api/types'

export { PxButton as Btn } from '@/pixel/ui'

/** Status colours are palette variables, so they follow Night / Day / Pocket. */
export const STATUS: Record<MateStatus, { label: string; color: string; expr: Expression }> = {
  working: { label: 'Watching', color: 'var(--mint)', expr: 'working' },
  needs_you: { label: 'Request', color: 'var(--accent)', expr: 'alert' },
  sleeping: { label: 'Paused', color: 'var(--soft)', expr: 'sleep' },
}

export const KIND: Record<ActivityKind, { icon: PixelIconName; color: string; label: string }> = {
  check: { icon: 'check', color: 'var(--mint)', label: 'Check' },
  event: { icon: 'radio', color: 'var(--mint)', label: 'Alert' },
  action: { icon: 'zap', color: 'var(--soft)', label: 'Action' },
  approval: { icon: 'hand', color: 'var(--soft)', label: 'Request' },
  system: { icon: 'info-box', color: 'var(--soft)', label: 'Update' },
}

export function Avatar({ mate, scale = 2, expr = 'idle', still = false, className }: { mate: Pick<Mate, 'body' | 'color' | 'name'>; scale?: number; expr?: Expression; still?: boolean; className?: string }) {
  return <MateSprite body={mate.body} color={mate.color} scale={scale} expr={expr} still={still} label={mate.name} className={className} />
}

export function StatusTag({ status, className }: { status: MateStatus; className?: string }) {
  const s = STATUS[status]
  return (
    <span className={cn('tag', status === 'needs_you' && 'is-blink', className)} style={{ color: s.color }}>
      {s.label}
    </span>
  )
}

export function PageTitle({ kicker, children, sub, right }: { kicker: string; children: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="ptitle">
      <div>
        <div className="tiny">{kicker}</div>
        <h1>{children}</h1>
        {sub && <p className="ptitle-sub">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

/** Bordered box with an optional title bar. */
export function Panel({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('panel', className)}>
      {(title || right) && (
        <header className="panel-head">
          <span className="tiny">{title}</span>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Toggle({ on, onChange, label, danger = false }: { on: boolean; onChange: (v: boolean) => void; label: string; danger?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn('toggle', on && 'on', danger && 'danger')}>
      <i aria-hidden />
    </button>
  )
}

export function Chip({ on, onClick, children, className }: { on?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn('chip', on && 'on', className)}>
      {children}
    </button>
  )
}

export function Range({ value, min, max, step = 1, onChange, label, unit }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string; unit?: string }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="range">
      <span className="range-top">
        <span className="tiny">{label}</span>
        <b>
          {value}
          {unit && <small> {unit}</small>}
        </b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ ['--p' as string]: `${pct}%` }} />
    </label>
  )
}

export function CopyText({ text, display, className }: { text: string; display?: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          /* clipboard blocked */
        }
        setDone(true)
        window.setTimeout(() => setDone(false), 1400)
      }}
      className={cn('copy', className)}
      title="Copy"
    >
      {done ? 'copied' : (display ?? text)}
      <Icon name={done ? 'check' : 'copy'} size={12} />
    </button>
  )
}

export function Empty({ icon, title, text, children }: { icon: PixelIconName; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={24} />
      </span>
      <div className="empty-title">{title}</div>
      {text && <p>{text}</p>}
      {children && <div className="empty-act">{children}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skel', className)} />
}

/** Rubber stamp that thumps down. */
export function Stamp({ kind, className }: { kind: 'approved' | 'rejected'; className?: string }) {
  return (
    <motion.span
      initial={{ scale: 2.2, opacity: 0, rotate: -22 }}
      animate={{ scale: 1, opacity: 1, rotate: -9 }}
      transition={{ type: 'spring', stiffness: 460, damping: 18 }}
      className={cn('stamp', kind === 'approved' ? 'ok' : 'no', className)}
    >
      {kind === 'approved' ? 'Approved' : 'Skipped'}
    </motion.span>
  )
}

/* ── wallet modal store ── */
let walletOpen = false
const wsubs = new Set<() => void>()
export const walletModal = {
  open() {
    walletOpen = true
    wsubs.forEach((f) => f())
  },
  close() {
    walletOpen = false
    wsubs.forEach((f) => f())
  },
}
export function useWalletModal() {
  return useSyncExternalStore(
    (f) => {
      wsubs.add(f)
      return () => wsubs.delete(f)
    },
    () => walletOpen,
  )
}
