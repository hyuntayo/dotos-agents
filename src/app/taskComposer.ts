import { useSyncExternalStore } from 'react'
import type { WatchSetup } from '@/content/task-entry'

type Composer = { open: boolean; mateId?: string; setup?: WatchSetup }
let composer: Composer = { open: false }
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const useTaskComposer = () => useSyncExternalStore(subscribe, () => composer)
export const openTaskComposer = (mateId?: string, setup?: WatchSetup) => { composer = { open: true, mateId, setup }; listeners.forEach(listener => listener()) }
export const closeTaskComposer = () => { composer = { open: false }; listeners.forEach(listener => listener()) }
export const finishTaskComposer = (snapshot: Composer) => { if (composer === snapshot) closeTaskComposer() }
