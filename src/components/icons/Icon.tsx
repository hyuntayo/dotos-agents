import { memo, useId, useMemo, type CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import { PIXEL_ICONS, type PixelIconName } from './pixel-icons'

export type { PixelIconName }

type IconProps = {
  name: PixelIconName
  size?: number
  className?: string
  style?: CSSProperties
  label?: string
}

/** Crisp pixel icon (pixelarticons). */
export function Icon({ name, size = 18, className, style, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0', className)}
      style={style}
    >
      <path d={PIXEL_ICONS[name]} />
    </svg>
  )
}

// ── rasterizer: pixelarticons paths are axis-aligned polygons on a 24px grid ──

type Edge = [number, number, number, number]
const cache = new Map<string, [number, number][]>()

function edgesOf(d: string): Edge[] {
  const tokens = d.match(/[MmHhVvLlZz]|-?\d*\.?\d+/g) ?? []
  const edges: Edge[] = []
  let i = 0
  let cmd = 'M'
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const num = () => parseFloat(tokens[i++])
  const line = (nx: number, ny: number) => {
    edges.push([x, y, nx, ny])
    x = nx
    y = ny
  }
  while (i < tokens.length) {
    const t = tokens[i]
    if (/[A-Za-z]/.test(t)) {
      cmd = t
      i++
      if (cmd === 'Z' || cmd === 'z') {
        if (x !== sx || y !== sy) line(sx, sy)
        continue
      }
    }
    switch (cmd) {
      case 'M':
        x = sx = num()
        y = sy = num()
        cmd = 'L'
        break
      case 'm':
        x = sx = x + num()
        y = sy = y + num()
        cmd = 'l'
        break
      case 'L':
        line(num(), num())
        break
      case 'l': {
        const dx = num()
        const dy = num()
        line(x + dx, y + dy)
        break
      }
      case 'H':
        line(num(), y)
        break
      case 'h':
        line(x + num(), y)
        break
      case 'V':
        line(x, num())
        break
      case 'v':
        line(x, y + num())
        break
      default:
        i++
    }
  }
  return edges
}

export function rasterize(name: PixelIconName): [number, number][] {
  const hit = cache.get(name)
  if (hit) return hit
  const edges = edgesOf(PIXEL_ICONS[name])
  const cells: [number, number][] = []
  for (let py = 0; py < 24; py++) {
    for (let px = 0; px < 24; px++) {
      const cx = px + 0.5
      const cy = py + 0.5
      let wind = 0
      for (const [x0, y0, x1, y1] of edges) {
        const side = (x1 - x0) * (cy - y0) - (cx - x0) * (y1 - y0)
        if (y0 <= cy && y1 > cy && side > 0) wind++
        else if (y1 <= cy && y0 > cy && side < 0) wind--
      }
      if (wind !== 0) cells.push([px, py])
    }
  }
  cache.set(name, cells)
  return cells
}

type DotIconProps = {
  name: PixelIconName
  size?: number
  className?: string
  /** faint unlit LED grid behind the icon */
  matrix?: boolean
  /** dots pop in a diagonal wave when an ancestor `.group` is hovered */
  wave?: boolean
  dot?: number
}

/** The same pixel icon, rendered as an LED dot matrix. */
export const DotIcon = memo(function DotIcon({
  name,
  size = 48,
  className,
  matrix = false,
  wave = true,
  dot = 0.4,
}: DotIconProps) {
  const cells = useMemo(() => rasterize(name), [name])
  const pid = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={cn('shrink-0 overflow-visible', wave && 'dot-icon-wave', className)}
    >
      {matrix && (
        <>
          <defs>
            <pattern id={pid} width="1" height="1" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r={dot * 0.8} fill="currentColor" />
            </pattern>
          </defs>
          <rect width="24" height="24" fill={`url(#${pid})`} opacity={0.12} />
        </>
      )}
      <g fill="currentColor">
        {cells.map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x + 0.5}
            cy={y + 0.5}
            r={dot}
            style={{ '--d': `${(x + y) * 16}ms` } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  )
})
