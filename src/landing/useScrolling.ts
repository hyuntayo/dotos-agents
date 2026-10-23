import { useSyncExternalStore } from 'react'

let scrolling = false
let timer = 0
const listeners = new Set<() => void>()
function update(next: boolean) {
  if (scrolling === next) return
  scrolling = next
  listeners.forEach(listener => listener())
}
function onScroll() {
  update(true)
  clearTimeout(timer)
  timer = window.setTimeout(() => update(false), 160)
}
function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener('scroll', onScroll, { passive: true })
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer); scrolling = false
    }
  }
}

// One passive listener; React updates only at the start/end of a scroll burst.
export function useScrolling() {
  return useSyncExternalStore(subscribe, () => scrolling, () => false)
}
