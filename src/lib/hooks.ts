import { useEffect, useState, type RefObject } from 'react'

export function useSize<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect
      setSize({ width: r.width, height: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

/** Re-renders every `ms` — handy for "x seconds ago" labels. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

export function shortAddr(a: string, n = 4) {
  return `${a.slice(0, n)}…${a.slice(-n)}`
}

