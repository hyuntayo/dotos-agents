import { useSyncExternalStore } from 'react'

export type Toast = {
  id: string
  title: string
  body?: string
  mateId?: string
  kind: 'approval' | 'event' | 'success' | 'info'
  to?: string
}

let toasts: Toast[] = []
const subs = new Set<() => void>()
const notify = () => subs.forEach((f) => f())

export function toast(t: Omit<Toast, 'id'>, ttl = 5200) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts.slice(-3), { ...t, id }]
  notify()
  window.setTimeout(() => dismiss(id), ttl)
  return id
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function useToasts() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => toasts,
  )
}
