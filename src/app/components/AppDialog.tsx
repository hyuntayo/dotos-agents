import { useEffect, useId, useRef, type ReactNode } from 'react'
import { SvgIcon } from '@/components/icons/SvgIcon'

/** Native dialogs provide focus trapping, Escape, and focus restoration. */
export function AppDialog({ open, onClose, title, children, className = '' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])
  return <dialog ref={ref} className={`workspace-dialog ${className}`} aria-labelledby={id} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(element => element.getClientRects().length)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target !== ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }}><div className="workspace-dialog-heading"><h2 id={id}>{title}</h2><button type="button" className="w-icon-button" aria-label="Close dialog" onClick={onClose}><SvgIcon name="x" size={18} /></button></div>{children}</dialog>
}
