import type { CSSProperties } from 'react'

export function SvgIcon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return <span aria-hidden="true" className={`svg-icon ${className}`} style={{ '--svg': `url("/icons/${name}.svg")`, width: size, height: size } as CSSProperties} />
}
