import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

/** Chunky pixel button. `to` routes inside the app, `href` leaves the site. */
export function PxButton({ children, to, href, onClick, tone = 'accent', className, disabled = false }: { children: ReactNode; to?: string; href?: string; onClick?: () => void; tone?: 'accent' | 'plain'; className?: string; disabled?: boolean }) {
  const cls = cn('pxbtn', tone === 'plain' && 'pxbtn-plain', className)
  if (to)
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    )
  return (
    <button type="button" onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  )
}
