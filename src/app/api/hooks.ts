import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, startRuntime, subscribe } from './client'
import { setMode } from '@/pixel/theme'
import { syncReadAlerts } from '../inbox'
import { deliverAlert } from '../notifications'
import { syncPush } from '../push'
import type { Memory, NewMateInput, Permissions, ResponsibilityItem, WalletProvider } from './types'

export const qk = {
  wallet: ['wallet'] as const,
  tier: ['tier'] as const,
  network: ['network'] as const,
  mates: ['mates'] as const,
  mate: (id: string) => ['mate', id] as const,
  responsibilities: (mateId?: string) => ['responsibilities', mateId ?? 'all'] as const,
  activity: (mateId?: string) => ['activity', mateId ?? 'all'] as const,
  approvals: (status?: string) => ['approvals', status ?? 'all'] as const,
  installed: (mateId: string) => ['installed', mateId] as const,
  messages: (mateId: string) => ['messages', mateId] as const,
}

/** Keeps React Query in sync with the always-on runtime. */
export function useRuntimeSync() {
  const qc = useQueryClient()
  const activity = useActivity(undefined, 1000)
  const known = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!activity.data) return
    const current = new Set(activity.data.map(item => item.id))
    if (known.current) for (const item of [...activity.data].reverse()) if (item.kind === 'event' && !known.current.has(item.id)) deliverAlert(item)
    known.current = current
  }, [activity.data])
  const preferences = useQuery({ queryKey: ['preferences'], queryFn: api.preferences })
  useEffect(() => {
    if (!preferences.data) return
    setMode(preferences.data.mode, false)
    syncReadAlerts(preferences.data.readAlerts)
  }, [preferences.data])
  useEffect(() => {
    let timer: number | undefined
    const unsubscribe = subscribe(() => { window.clearTimeout(timer); timer = window.setTimeout(() => { qc.invalidateQueries() }, 40) })
    const stop = startRuntime()
    void syncPush().catch(() => {})
    return () => { window.clearTimeout(timer); unsubscribe(); stop() }
  }, [qc])
}

export const useWallet = () => useQuery({ queryKey: qk.wallet, queryFn: api.wallet })
export const useAccount = () => useQuery({ queryKey: ['account'], queryFn: api.account })
export const useTier = () => useQuery({ queryKey: qk.tier, queryFn: api.tier })
export const useNetwork = () => useQuery({ queryKey: qk.network, queryFn: api.network })
export const useServerHealth = () => useQuery({ queryKey: ['server-health'], queryFn: api.health, refetchInterval: 15000, retry: 1 })
export const useMates = () => useQuery({ queryKey: qk.mates, queryFn: api.mates })
export const useMate = (id: string) => useQuery({ queryKey: qk.mate(id), queryFn: () => api.mate(id) })
export const useResponsibilities = (mateId?: string) =>
  useQuery({ queryKey: qk.responsibilities(mateId), queryFn: () => api.responsibilities(mateId) })
export const useActivity = (mateId?: string, limit = 60) =>
  useQuery({ queryKey: [...qk.activity(mateId), limit], queryFn: () => api.activity({ mateId, limit }), placeholderData: (p) => p })
export const useInstalled = (mateId: string) =>
  useQuery({ queryKey: qk.installed(mateId), queryFn: () => api.installed(mateId), enabled: !!mateId })
export const useMessages = (mateId: string) =>
  useQuery({ queryKey: qk.messages(mateId), queryFn: () => api.messages(mateId), enabled: !!mateId })

export function useSendMessage(mateId: string) {
  return useMutation({ mutationFn: (message: string) => api.sendMessage(mateId, message), retry: false })
}
export function useAnalyzeTask() {
  return useMutation({ mutationFn: (taskId: string) => api.analyzeTask(taskId), retry: false })
}

export function useConnectWallet() {
  return useMutation({ mutationFn: (p: WalletProvider) => api.connectWallet(p) })
}
export function useDisconnectWallet() {
  return useMutation({ mutationFn: () => api.disconnectWallet() })
}

export function useSetPaused() {
  return useMutation({ mutationFn: ({ id, paused }: { id: string; paused: boolean }) => api.setPaused(id, paused) })
}

export function useAddResponsibility() {
  return useMutation({ mutationFn: ({ mateId, text, monitorConfig }: { mateId: string; text: string; monitorConfig?: import('./types').MonitorConfig }) => api.addResponsibility(mateId, text, monitorConfig) })
}

export function useToggleResponsibility(mateId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.toggleResponsibility(id, active),
    onMutate: async ({ id, active }) => {
      const key = qk.responsibilities(mateId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ResponsibilityItem[]>(key)
      qc.setQueryData<ResponsibilityItem[]>(key, (list) => list?.map((r) => (r.id === id ? { ...r, active } : r)))
      return { prev, key }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
  })
}

export function useRemoveResponsibility() {
  return useMutation({ mutationFn: (id: string) => api.removeResponsibility(id) })
}

export const useUpdateResponsibility = () => useMutation({ mutationFn: ({ id, text }: { id: string; text: string }) => api.updateResponsibility(id, { text }) })
export const useRemoveMate = () => useMutation({ mutationFn: api.removeMate })

export function useUpdatePermissions(mateId: string) {
  return useMutation({ mutationFn: (patch: Partial<Permissions>) => api.updatePermissions(mateId, patch) })
}

export function useUpdateMemory(mateId: string) {
  return useMutation({ mutationFn: (patch: Partial<Memory>) => api.updateMemory(mateId, patch) })
}

export function useInstallSkill() {
  return useMutation({
    mutationFn: ({ mateId, skill, remove }: { mateId: string; skill: string; remove?: boolean }) =>
      remove ? api.uninstallSkill(mateId, skill) : api.installSkill(mateId, skill),
  })
}

export function useCreateMate() {
  return useMutation({ mutationFn: (input: NewMateInput) => api.createMate(input) })
}
