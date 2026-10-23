import { mateRenderProps } from '@/components/dotmate/render-images'
import { PALETTES, useMode } from '@/pixel/theme'

/** Short route fallback; the initial landing has its own pre-React jump scene. */
export function Splash({ inline = false }: { inline?: boolean }) {
  const mode = useMode(), palette = PALETTES[mode]
  return <div role="status" aria-label="Opening DotOS" className="grid place-items-center" style={inline ? { minHeight: '50vh' } : { minHeight: '100dvh', background: palette.side }}>
    <div className="flex flex-col items-center gap-3"><img {...mateRenderProps('blob','violet','110px')} width="110" height="127" alt="" style={{ objectFit: 'contain' }}/><span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: palette.soft }}>Opening DotOS</span></div>
  </div>
}
