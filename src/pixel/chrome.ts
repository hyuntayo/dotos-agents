import { useEffect, type CSSProperties } from 'react'
import { tileUrl } from './sprites/tile'
import { PALETTES, type Mode } from './theme'

/** CSS variables + the tiled background for the current palette. */
export function paletteStyle(mode: Mode): CSSProperties {
  const p = PALETTES[mode]
  return {
    '--side': p.side,
    '--col': p.col,
    '--ink': p.ink,
    '--soft': p.soft,
    '--line': p.line,
    '--panel': p.panel,
    '--accent': p.accent,
    '--accent-ink': p.accentInk,
    '--mint': p.mint,
    '--link': p.link,
    backgroundImage: `url(${tileUrl(mode)})`,
  } as CSSProperties
}

/** Overscroll areas and native controls follow the palette. */
export function usePageChrome(mode: Mode) {
  const side = PALETTES[mode].side
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.background
    html.style.background = side
    html.style.colorScheme = mode === 'night' ? 'dark' : 'light'
    return () => {
      html.style.background = prev
      html.style.colorScheme = ''
    }
  }, [side, mode])
}
