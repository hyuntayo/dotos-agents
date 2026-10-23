// Dot-matrix sprite definitions for Dots.
// Every sprite is a 16x16 grid. Letters map to colour roles (see ROLE below);
// eyes, mouths and cheeks are drawn as overlays so they can animate.

export type Cell = readonly [x: number, y: number]
export type BodyKind = 'blob' | 'bot' | 'owl' | 'star'
export type ColorKey = 'mint' | 'violet' | 'amber' | 'pink' | 'sky'

export {mateRenderUrl} from './render-images'
export type Expression = 'idle' | 'working' | 'alert' | 'happy' | 'sleep'
export type EyeKind = 'solid' | 'owl' | 'visor'

export const GRID = 16

export interface BodyDef {
  grid: readonly string[]
  eyeKind: EyeKind
  /** top-left cell of each eye (for owls: top-left of the pupil) */
  eyes: { l: Cell; r: Cell; w: number; h: number }
  look: { x: number; y: number }
  mouth: Record<'smile' | 'grin' | 'o' | 'flat', readonly Cell[]>
  cheeks: readonly Cell[]
}

export interface Palette {
  base: string
  hi: string
  lo: string
  acc: string
  acc2: string
  glow: string
  eye: string
  cheek: string
}

export const PALETTES: Record<ColorKey, Palette> = {
  mint: { base: '#8da990', hi: '#B9FFE5', lo: '#1F9C72', acc: '#2FD898', acc2: '#FFD166', glow: '#EFFFF8', eye: '#EFFFF8', cheek: '#FF8FB8' },
  violet: { base: '#657ee6', hi: '#DDD3FF', lo: '#6A4FD6', acc: '#8C6DFF', acc2: '#FFD166', glow: '#F3EFFF', eye: '#7DF9FF', cheek: '#FF8FC4' },
  amber: { base: '#e9b944', hi: '#FFE3AA', lo: '#C9771C', acc: '#9B5410', acc2: '#FF7A3D', glow: '#FFF3DA', eye: '#FFFFFF', cheek: '#FF8A7A' },
  pink: { base: '#e9784b', hi: '#FFC9E4', lo: '#C63E84', acc: '#FFA3D2', acc2: '#FFD166', glow: '#FFF1F8', eye: '#FFFFFF', cheek: '#FFD166' },
  sky: { base: '#72b6ca', hi: '#C4ECFF', lo: '#2B89C7', acc: '#3FAFF0', acc2: '#FFD166', glow: '#ECF9FF', eye: '#FFFFFF', cheek: '#FF8FB8' },
}

export const INK = '#0B0B10'

/** grid letter -> palette role */
export const ROLE: Record<string, keyof Palette | 'white' | 'ink'> = {
  B: 'base',
  H: 'hi',
  L: 'hi',
  S: 'lo',
  A: 'acc',
  V: 'acc2',
  G: 'glow',
  W: 'white',
  K: 'ink',
}

const blob: BodyDef = {
  grid: [
    '................',
    '.......GG.......',
    '.......GG.......',
    '........A.......',
    '.....BBBBBB.....',
    '...BHHBBBBBBB...',
    '..BHBBBBBBBBBB..',
    '.BHBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.SBBBBBBBBBBBBS.',
    '..SBBBBBBBBBBS..',
    '...SSBBBBBBSS...',
    '....SS....SS....',
  ],
  eyeKind: 'solid',
  eyes: { l: [4, 7], r: [10, 7], w: 2, h: 3 },
  look: { x: 1, y: 1 },
  mouth: {
    smile: [[6, 11], [9, 11], [7, 12], [8, 12]],
    grin: [[6, 11], [7, 11], [8, 11], [9, 11], [7, 12], [8, 12]],
    o: [[7, 11], [8, 11], [7, 12], [8, 12]],
    flat: [[7, 12], [8, 12]],
  },
  cheeks: [[2, 10], [3, 10], [12, 10], [13, 10]],
}

const bot: BodyDef = {
  grid: [
    '................',
    '..G..........G..',
    '..A..........A..',
    '..BBBBBBBBBBBB..',
    '.BHHBBBBBBBBBBB.',
    '.BHBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBKKKKKKKKKKBB.',
    '.BKKKKKKKKKKKKB.',
    '.BKKKKKKKKKKKKB.',
    '.BBKKKKKKKKKKBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.SBBBBBBBBBBBBS.',
    '..SSSBBBBBBSSS..',
    '...SS......SS...',
  ],
  eyeKind: 'visor',
  eyes: { l: [4, 8], r: [10, 8], w: 2, h: 2 },
  look: { x: 2, y: 0 },
  mouth: {
    smile: [[6, 12], [9, 12], [7, 13], [8, 13]],
    grin: [[6, 12], [7, 12], [8, 12], [9, 12], [7, 13], [8, 13]],
    o: [[7, 12], [8, 12], [7, 13], [8, 13]],
    flat: [[7, 13], [8, 13]],
  },
  cheeks: [[2, 11], [3, 11], [12, 11], [13, 11]],
}

const owl: BodyDef = {
  grid: [
    '................',
    '.AA..........AA.',
    '.AAB........BAA.',
    '..BBB......BBB..',
    '..BHHHBBBBBBBB..',
    '.BHBBBBBBBBBBBB.',
    '.BBWWBBBBBBWWBB.',
    '.BWWWWBBBBWWWWB.',
    '.BWWWWBBBBWWWWB.',
    '.BBWWBBBBBBWWBB.',
    '.BBBBBBVVBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.SBBBLBLLBLBBBS.',
    '..SBBBLBBLBBBS..',
    '...SSBBBBBBSS...',
    '....VV....VV....',
  ],
  eyeKind: 'owl',
  eyes: { l: [3, 7], r: [11, 7], w: 2, h: 2 },
  look: { x: 1, y: 1 },
  mouth: {
    smile: [],
    grin: [],
    o: [],
    flat: [],
  },
  cheeks: [[2, 10], [3, 10], [12, 10], [13, 10]],
}

const star: BodyDef = {
  grid: [
    '.......BB.......',
    '.......BB.......',
    '......BHBB......',
    '......BHBB......',
    '.....BHBBBB.....',
    'BBBBBBBBBBBBBBBB',
    '.BHHBBBBBBBBBBB.',
    '..BBBBBBBBBBBB..',
    '...BBBBBBBBBB...',
    '...BBBBBBBBBB...',
    '...BBBBBBBBBB...',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '.BBBBBS..SBBBBB.',
    '.BBBS......SBBB.',
    'BBS..........SBB',
  ],
  eyeKind: 'solid',
  eyes: { l: [5, 7], r: [9, 7], w: 2, h: 2 },
  look: { x: 1, y: 1 },
  mouth: {
    smile: [[6, 10], [9, 10], [7, 11], [8, 11]],
    grin: [[6, 10], [7, 10], [8, 10], [9, 10], [7, 11], [8, 11]],
    o: [[7, 10], [8, 10], [7, 11], [8, 11]],
    flat: [[7, 11], [8, 11]],
  },
  cheeks: [[3, 9], [4, 9], [11, 9], [12, 9]],
}

export const BODIES: Record<BodyKind, BodyDef> = { blob, bot, owl, star }

export interface MateDef {
  id: string
  name: string
  body: BodyKind
  color: ColorKey
  role: string
  tagline: string
}

export const MATES = {
  bob: { id: 'bob', name: 'BOB', body: 'blob', color: 'violet', role: 'Portfolio', tagline: 'Watches every position so you don’t have to.' },
  max: { id: 'max', name: 'MAX', body: 'bot', color: 'amber', role: 'Pons Launches', tagline: 'Scans lending, LPs and rewards across protocols.' },
  iggy: { id: 'iggy', name: 'IGGY', body: 'owl', color: 'mint', role: 'Wallet Tracking', tagline: 'Never blinks at a watched wallet. Almost.' },
  nova: { id: 'nova', name: 'NOVA', body: 'star', color: 'pink', role: 'Treasury', tagline: 'Keeps creator fees and available escrow in view.' },
} as const satisfies Record<string, MateDef>

export type MateId = keyof typeof MATES
export const MATE_IDS = Object.keys(MATES) as MateId[]

/** Owl eye whites, used to clip pupils. */
export function whiteMask(def: BodyDef): Set<string> {
  const s = new Set<string>()
  def.grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'W') s.add(`${x},${y}`)
  })
  return s
}
