import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useMates } from '../api/hooks'
import { dismiss, useToasts } from '../toast'
import { Avatar } from './bits'

const BAR = { approval: 'var(--accent)', event: 'var(--mint)', success: 'var(--mint)', info: 'var(--soft)' }

/** Status updates stay within the viewport, including during transitions. */
export function Toasts() {
  const toasts = useToasts()
  const { data: mates } = useMates()
  const nav = useNavigate()
  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const m = mates?.find((x) => x.id === t.mateId)
          return (
            <motion.button
              key={t.id}
              layout
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={() => {
                if (t.to) nav(t.to)
                dismiss(t.id)
              }}
              className="toast"
              style={{ borderLeftColor: BAR[t.kind] }}
            >
              {m && <Avatar mate={m} scale={2} expr={t.kind === 'approval' ? 'alert' : t.kind === 'success' ? 'happy' : 'working'} />}
              <span className="toast-text">
                <b>
                  {m && t.kind === 'approval' ? `${m.name} ` : ''}
                  {t.title}
                </b>
                {t.body && <span>{t.body}</span>}
              </span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
