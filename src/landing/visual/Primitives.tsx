import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { Link } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useQuietMotion } from '../experience/motion-context'

export function Cut({ children, className = '' }: { children: ReactNode; className?: string }) {
  const host = useRef<HTMLDivElement>(null), quiet = useQuietMotion()
  const visible = useInView(host, { once: true, amount: .1 })
  return <motion.div ref={host} className={`v-cut ${className}`} initial={false} animate={quiet || visible ? { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' } : { opacity: 0, y: 35, clipPath: 'inset(0 0 18% 0)' }} transition={{ duration: quiet ? 0 : .9, ease: [.16, 1, .3, 1] }}>{children}</motion.div>
}
export function Go({ children = 'Get your Dot', to = '/app/new', className = '' }: { children?: ReactNode; to?: string; className?: string }) {
  return <Link className={`v-go ${className}`} to={to}>{children}<SvgIcon name="arrow-up-right" size={18} /></Link>
}
