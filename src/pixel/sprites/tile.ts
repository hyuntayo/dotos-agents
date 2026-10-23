// The repeating pixel pattern around the page column (like the side art on a game page).
import { PALETTES, type Mode } from '../theme'

const cache = new Map<Mode, string>()

export function tileUrl(mode: Mode) {
  const hit = cache.get(mode)
  if (hit) return hit
  const p = PALETTES[mode]
  const S = 32
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = p.side
  g.fillRect(0, 0, S, S)
  const dot = (x: number, y: number, col: string) => {
    g.fillStyle = col
    g.fillRect(x, y, 1, 1)
  }
  if (mode === 'night') {
    // a tiny crescent, plus-shaped stars and dust
    ;[
      [5, 4],
      [6, 4],
      [4, 5],
      [4, 6],
      [4, 7],
      [5, 8],
      [6, 8],
    ].forEach(([x, y]) => dot(x, y, p.tile2))
    ;[
      [22, 9],
      [12, 24],
    ].forEach(([x, y]) => {
      dot(x, y, p.tile2)
      dot(x - 1, y, p.tile)
      dot(x + 1, y, p.tile)
      dot(x, y - 1, p.tile)
      dot(x, y + 1, p.tile)
    })
    ;[
      [16, 15],
      [28, 20],
      [9, 14],
      [26, 29],
      [2, 26],
    ].forEach(([x, y]) => dot(x, y, p.tile))
  } else if (mode === 'day') {
    // little clouds and seeds
    ;[
      [4, 6, 6],
      [6, 5, 3],
    ].forEach(([x, y, w]) => {
      for (let k = 0; k < w; k++) dot(x + k, y, p.tile2)
    })
    ;[
      [20, 20, 7],
      [22, 19, 3],
    ].forEach(([x, y, w]) => {
      for (let k = 0; k < w; k++) dot(x + k, y, p.tile)
    })
    ;[
      [14, 12],
      [28, 6],
      [8, 26],
      [24, 29],
    ].forEach(([x, y]) => dot(x, y, p.tile2))
  } else {
    for (let y = 0; y < S; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < S; x += 8) dot(x, y, p.tile2)
  }
  const url = c.toDataURL()
  cache.set(mode, url)
  return url
}
