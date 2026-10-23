import { useSyncExternalStore } from 'react'
import { api } from './api/client'
import { toast } from './toast'

const KEY = 'dotmates.inbox.v1'
const read = () => {
  try { const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []) } catch { return new Set<string>() }
}
let seen = read()
const empty = new Set<string>()
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const useReadAlerts = () => useSyncExternalStore(subscribe, () => seen, () => empty)
export function markAlertsRead(ids: string[]) {
  if (ids.every(id => seen.has(id))) return
  const previous = seen
  seen = new Set([...seen, ...ids])
  try { localStorage.setItem(KEY, JSON.stringify([...seen].slice(-1000))) } catch { /* Session-only inbox if storage is unavailable. */ }
  listeners.forEach(listener => listener())
  void api.updatePreferences({ readAlerts: ids }).catch(error => {
    syncReadAlerts([...previous])
    toast({ kind: 'info', title: 'Read status not saved', body: error.message })
  })
}
export function syncReadAlerts(ids: string[]) {
  if (ids.length === seen.size && ids.every(id => seen.has(id))) return
  seen = new Set(ids)
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* Cache is optional. */ }
  listeners.forEach(listener => listener())
}
window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) { seen = read(); listeners.forEach(listener => listener()) } })
