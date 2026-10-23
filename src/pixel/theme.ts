import { useSyncExternalStore } from 'react'
import { api } from '@/app/api/client'
import { toast } from '@/app/toast'

/** Page palettes. Switched from the header, like colour modes on a docs site. */
export type Mode = 'night' | 'day' | 'pocket'

export type Palette = {
  name: string
  /** tiled background around the page column */
  side: string
  tile: string
  tile2: string
  /** the page column */
  col: string
  ink: string
  soft: string
  line: string
  panel: string
  accent: string
  accentInk: string
  mint: string
  link: string
}

export const PALETTES: Record<Mode, Palette> = {
  night: {
    name:'Dark',side:'#050608',tile:'#0b0d13',tile2:'#121722',col:'#0d0f14',ink:'#f2f5fc',soft:'#8d98ac',line:'#252c39',panel:'#151b26',accent:'#377dff',accentInk:'#ffffff',mint:'#93dbb1',link:'#9bbdff',
  },
  day: {
    name:'Light',side:'#f1f3f6',tile:'#edf1f7',tile2:'#e0e8f3',col:'#ffffff',ink:'#202735',soft:'#758298',line:'#dce3ee',panel:'#f4f7fc',accent:'#2468ef',accentInk:'#ffffff',mint:'#398c61',link:'#3068ce',
  },
  pocket: {
    name: 'Terminal',
    side: '#8bac0f',
    tile: '#9bbc0f',
    tile2: '#306230',
    col: '#9bbc0f',
    ink: '#0f380f',
    soft: '#306230',
    line: '#0f380f',
    panel: '#8bac0f',
    accent: '#0f380f',
    accentInk: '#9bbc0f',
    mint: '#306230',
    link: '#0f380f',
  },
}

export const MODES: Mode[] = ['night', 'day', 'pocket']

/* ── store ───────────────────────────────────────────────────────── */

const KEY = 'dotmates-mode'
let mode: Mode = 'night'
try {
  const saved = localStorage.getItem(KEY) as Mode | null
  if (saved && saved in PALETTES) mode = saved
} catch {
  /* storage blocked */
}
const subs = new Set<() => void>()
let pendingMode: Mode | undefined
let saveRevision = 0

export function getMode() {
  return mode
}

export function setMode(m: Mode, persist = true) {
  if (!persist && pendingMode !== undefined) return
  if (mode === m) return
  const previous = mode
  mode = m
  try {
    localStorage.setItem(KEY, m)
  } catch {
    /* storage blocked */
  }
  subs.forEach((f) => f())
  if (persist) {
    pendingMode = m
    const revision = ++saveRevision
    void api.updatePreferences({ mode: m }).then(() => { if (revision === saveRevision) pendingMode = undefined }).catch(error => {
      if (revision === saveRevision) { pendingMode = undefined; setMode(previous, false) }
      toast({ kind: 'info', title: 'Appearance not saved', body: error.message })
    })
  }
}

export function useMode() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => mode,
  )
}

/* ── colour mapping for pixel art ────────────────────────────────── */

const GB = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
const cache = new Map<string, string>()

function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * In Pocket mode every colour becomes one of four greens; other modes keep the art as drawn.
 * Pages in Pocket are the two light greens, so art leans on the two dark ones to stay readable.
 */
export function ink(hex: string, m: Mode = mode) {
  if (m !== 'pocket') return hex
  const k = hex
  let v = cache.get(k)
  if (!v) {
    const l = lum(hex)
    v = GB[l < 0.3 ? 0 : l < 0.78 ? 1 : l < 0.92 ? 2 : 3]
    cache.set(k, v)
  }
  return v
}
