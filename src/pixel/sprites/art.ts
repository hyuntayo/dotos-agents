// Square-pixel art: the mates (from the shared sprite data) and the three Dot units.
import { BODIES, INK, MATES, PALETTES, ROLE, type BodyKind, type ColorKey, type Expression, type MateId, type Palette } from '@/components/dotmate/sprites'
import { ink, type Mode } from '../theme'

type Ctx = CanvasRenderingContext2D

const px = (ctx: Ctx, x: number, y: number, c: string, m: Mode) => {
  ctx.fillStyle = ink(c, m)
  ctx.fillRect(x, y, 1, 1)
}

function roleColor(ch: string, pal: Palette) {
  const r = ROLE[ch]
  if (r === 'white') return '#FFFFFF'
  if (r === 'ink') return INK
  return pal[r as keyof Palette]
}

export type MatePose = {
  expr: Expression
  /** eyes looking left/right (-2..2) and up/down (-1..1) */
  look?: { x: number; y: number }
  blink?: boolean
  /** walk cycle 0–3: on 1 and 3 the body lifts a pixel and the feet step apart / together */
  step?: number
}

/** Draws a 16×16 mate with its top-left at (x, y), one canvas unit per pixel. */
export function drawMate(ctx: Ctx, id: MateId, x: number, y: number, pose: MatePose, m: Mode) {
  drawBody(ctx, MATES[id].body, MATES[id].color, x, y, pose, m)
}

/** Any body in any colour — the mates people make in the app. */
export function drawBody(ctx: Ctx, body: BodyKind, color: ColorKey, x: number, y: number, pose: MatePose, m: Mode) {
  const def = BODIES[body]
  const pal = PALETTES[color]
  const step = pose.step ?? 0
  const lift = step === 1 || step === 3 ? -1 : 0
  const last = def.grid.length - 1
  def.grid.forEach((row, gy) => {
    for (let gx = 0; gx < row.length; gx++) {
      const ch = row[gx]
      if (ch === '.') continue
      if (gy === last && body !== 'star') {
        // feet stay on the ground and step: apart on 1, together on 3
        const d = step === 1 ? (gx < 8 ? -1 : 1) : step === 3 ? (gx < 8 ? 1 : -1) : 0
        px(ctx, x + gx + d, y + gy, roleColor(ch, pal), m)
      } else px(ctx, x + gx, y + gy + lift, roleColor(ch, pal), m)
    }
  })

  const { expr } = pose
  const closed = pose.blink || expr === 'sleep'
  const happy = expr === 'happy'
  const lx = Math.max(-def.look.x, Math.min(def.look.x, pose.look?.x ?? 0))
  const ly = Math.max(-def.look.y, Math.min(def.look.y, (pose.look?.y ?? 0) + (expr === 'alert' ? -1 : 0)))
  const { l, r, w, h } = def.eyes
  const dot = (cx: number, cy: number, c: string) => px(ctx, x + cx, y + cy + lift, c, m)

  if (def.eyeKind === 'owl') {
    const white = new Set<string>()
    def.grid.forEach((row, gy) => [...row].forEach((ch, gx) => ch === 'W' && white.add(`${gx},${gy}`)))
    if (closed || happy) {
      white.forEach((k) => {
        const [cx, cy] = k.split(',').map(Number)
        dot(cx, cy, pal.base)
      })
      for (const e of [l, r]) {
        if (happy) [[e[0] - 1, e[1] + 1], [e[0], e[1]], [e[0] + 1, e[1]], [e[0] + 2, e[1] + 1]].forEach(([a, b]) => dot(a, b, INK))
        else for (let i = -1; i <= 2; i++) dot(e[0] + i, e[1] + 1, INK)
      }
    } else {
      for (const [ex, ey] of [l, r])
        for (let i = 0; i < w; i++)
          for (let j = 0; j < h; j++) {
            const cx = ex + i + lx
            const cy = ey + j + ly
            if (white.has(`${cx},${cy}`)) dot(cx, cy, INK)
          }
    }
  } else {
    const eye = def.eyeKind === 'visor' ? pal.eye : INK
    for (const [ex, ey] of [l, r]) {
      if (happy) [[ex - 1, ey + 1], [ex, ey], [ex + 1, ey], [ex + 2, ey + 1]].forEach(([a, b]) => dot(a, b, eye))
      else if (closed) {
        dot(ex + lx, ey + h - 1, eye)
        dot(ex + 1 + lx, ey + h - 1, eye)
      } else {
        for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) dot(ex + i + lx, ey + j + ly, eye)
        if (def.eyeKind === 'solid') dot(ex + lx, ey + ly, '#FFFFFF')
      }
    }
  }
  const mouth = expr === 'alert' ? def.mouth.o : happy ? def.mouth.grin : expr === 'sleep' ? def.mouth.flat : def.mouth.smile
  mouth.forEach(([a, b]) => dot(a, b, INK))
  def.cheeks.forEach(([a, b]) => dot(a, b, pal.cheek))
}

/* ── the three units, as little sprites ─────────────────────────── */

export type UnitId = 'pocket' | 'classic' | 'pro'

const UNIT_COLORS: Record<string, string> = {
  o: '#b5aea2', // key ring
  a: '#FFC453', // amber shell
  h: '#FFE3AA',
  s: '#C9771C',
  k: '#1b1b1a', // bezel
  g: '#0f1311', // lcd
  m: '#46F2B4', // mate on screen
  b: '#1B1B1A',
  w: '#F3F1EB',
  r: '#FF5A1F',
  c: '#EDE8DD', // classic shell
  C: '#FFFFFF',
  S: '#B9B2A4',
  d: '#2b2a30', // pro body
  D: '#4a4952',
  x: '#141416',
  n: '#6a6870',
  e: '#0d0d0f',
  t: '#46F2B4',
  v: '#A68CFF',
  f: '#0b0b0c',
  L: '#FF5A1F',
  T: '#9B958A',
}

export const UNITS: Record<UnitId, string[]> = {
  pocket: [
    '......oooo......',
    '.....o....o.....',
    '......oooo......',
    '.......ss.......',
    '.....haaaas.....',
    '....haaaaaas....',
    '...haaaaaaaas...',
    '..haakkkkkkaas..',
    '..hakggggggkas..',
    '.haakgmggmgkaas.',
    '.haakggmmggkaas.',
    '.haakggggggkaas.',
    '.haaakkkkkkaaas.',
    '.haaaaaaaaaaaas.',
    '.haabaawaaraaas.',
    '.haaaaaaaaaaaas.',
    '..haaaaaaaaaas..',
    '...saaaaaaaass..',
    '.....ssssss.....',
  ],
  classic: [
    '............L...',
    '............T...',
    '..CccccccccccS..',
    '.CccccccccccccS.',
    '.CckkkkkkkkkkcS.',
    '.CckggggggggkcS.',
    '.CckggmggmggkcS.',
    '.CckgggmmgggkcS.',
    '.CckggggggggkcS.',
    '.CckkkkkkkkkkcS.',
    '.CccccccccccccS.',
    '.CcScScccbcrrcS.',
    '.CcScScccccrrcS.',
    '.CccccccccccccS.',
    '..SSSSSSSSSSSS..',
  ],
  pro: [
    '.DDDDDDDDDDDDDDDDDDDD.',
    'Ddkkkkkkkkkkkkdddddddx',
    'Ddkggggggggggkddnnnndx',
    'DdkggvvggggggkdnnnnndX',
    'DdkgvvvvgggggkdnnwnndX',
    'DdkggvvggggggkdnnnnndX',
    'Ddkggggggggggkddnnnndx',
    'DdkkkkkkkkkkkkdddddddX',
    'DddddddddddddddrtddddX',
    'DdeeeeeeeeeeedddvwdddX',
    'DddddddddddddddddddLdX',
    '.xxxxxxxxxxxxxxxxxxxx.',
    '..ff..............ff..',
  ].map((r) => r.replace(/X/g, 'x')),
}

export function drawUnit(ctx: Ctx, id: UnitId, x: number, y: number, m: Mode) {
  UNITS[id].forEach((row, gy) => {
    for (let gx = 0; gx < row.length; gx++) {
      const ch = row[gx]
      if (ch !== '.') px(ctx, x + gx, y + gy, UNIT_COLORS[ch] ?? '#ff00ff', m)
    }
  })
}

export function unitSize(id: UnitId) {
  return { w: UNITS[id][0].length, h: UNITS[id].length }
}
