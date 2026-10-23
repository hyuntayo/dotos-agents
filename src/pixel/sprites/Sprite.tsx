import { useEffect, useRef } from 'react'
import { MATES, mateRenderUrl, type BodyKind, type ColorKey, type Expression, type MateId } from '@/components/dotmate/sprites'
import { cn } from '@/lib/cn'
import { useMode } from '../theme'
import { drawUnit, unitSize, type UnitId } from './art'

type Who = { mate: MateId; body?: never; color?: never } | { mate?: never; body: BodyKind; color: ColorKey }

/** Transparent renders of the original 3D models; lightweight in dense lists. */
export function MateSprite({ scale = 4, expr = 'idle', still = false, className, label, ...who }: Who & { scale?: number; expr?: Expression; still?: boolean; className?: string; label?: string }) {
  const mode = useMode()
  const body = who.mate ? MATES[who.mate].body : who.body
  const color = who.mate ? MATES[who.mate].color : who.color
  return <img src={mateRenderUrl(body, color)} width={16 * scale} height={18 * scale} alt={label ?? (who.mate ? MATES[who.mate].name : 'Dot')} draggable={false} className={cn('mate-sprite', !still && 'mate-breathe', `mate-${expr}`, mode === 'pocket' && 'mate-pocket', className)} style={{ width: 16 * scale, height: 18 * scale, objectFit: 'contain', flexShrink: 0 }} />
}

/** Code-native pixel diagrams for memory, responsibilities and skills. */
export function UnitSprite({ unit, scale = 3, className }: { unit: UnitId; scale?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mode = useMode()
  const { w, h } = unitSize(unit)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    drawUnit(ctx, unit, 0, 0, mode)
  }, [unit, mode, w, h])
  return <canvas ref={ref} width={w} height={h} aria-hidden className={cn('pixelated', className)} style={{ width: w * scale, height: h * scale }} />
}
