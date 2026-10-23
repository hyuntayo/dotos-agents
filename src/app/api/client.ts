import { connectEvm, messageHex } from './evm-wallet'
import type { TaskPlan } from './types'
import type { Account, ActivityItem, Approval, ChatMessage, DB, Mate, MateView, Memory, MonitorConfig, MonitorState, NewMateInput, Permissions, Preferences, PushStatus, ResponsibilityItem, ServerHealth, Tier, Wallet, WalletProvider } from './types'

export class ApiError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string) { super(message); this.status = status; this.code = code }
}
export type RuntimeEvent = { type: 'change' }
const listeners = new Set<(event: RuntimeEvent) => void>()
const notify = () => listeners.forEach(listener => listener({ type: 'change' }))
export function subscribe(listener: (event: RuntimeEvent) => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
let session: Promise<void> | undefined
let migrationWarning: string | undefined

async function fetchJson<T>(path: string, method = 'GET', input?: unknown, timeoutMs = 10000): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: input === undefined ? {} : { 'Content-Type': 'application/json' }, body: input === undefined ? undefined : JSON.stringify(input), signal: AbortSignal.timeout(timeoutMs) })
  } catch { throw new ApiError('The server is unavailable. Try again when it reconnects.', 0, 'OFFLINE') }
  const value = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(value?.error ?? 'The server could not save this change.', response.status, value?.code ?? 'SERVER_ERROR')
  if (value === null) throw new ApiError('The server returned an invalid response.', 502, 'INVALID_RESPONSE')
  return value as T
}
function localPreferences(): Partial<Preferences> {
  try {
    const mode = localStorage.getItem('dotmates-mode') ?? 'night'
    return { ...(['day', 'night', 'pocket'].includes(mode ?? '') ? { mode: mode as Preferences['mode'] } : {}), tourDone: localStorage.getItem('dotmates.dashboard-tour.v2') === 'done' }
  } catch { return { mode:'night' } }
}
export function ensureSession(): Promise<void> {
  if (!session) session = (async () => {
    const result = await fetchJson<{ created: boolean; imported: boolean }>('/session', 'POST', { preferences: localPreferences() })
    if (!result.imported) {
      let legacy: unknown
      try { const raw = localStorage.getItem('dotmates.demo.v1'); if (raw) legacy = JSON.parse(raw) } catch { /* Preserve the original save if it is unreadable. */ }
      if (legacy) {
        try {
          await fetchJson('/workspace/import', 'POST', { legacy })
          try { localStorage.removeItem('dotmates.demo.v1') } catch { /* The server keeps import idempotent. */ }
        } catch (error) { migrationWarning = `Your previous browser save was preserved. ${error instanceof Error ? error.message : 'Import failed.'}` }
      }
    }
  })().then(() => { openEvents() }).catch(error => { session = undefined; throw error })
  return session
}
let writeQueue: Promise<void> = Promise.resolve()
function request<T>(path: string, method = 'GET', input?: unknown, timeoutMs = 10000): Promise<T> {
  const execute = async () => {
    await ensureSession()
    try {
      const value = await fetchJson<T>(path, method, input, timeoutMs)
      if (method !== 'GET') notify()
      return value
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) session = undefined
      throw error
    }
  }
  if (method === 'GET' || timeoutMs > 10000) return execute()
  const result = writeQueue.then(execute)
  writeQueue = result.then(() => {}, () => {})
  return result
}
let source: EventSource | undefined
let runtimeUsers = 0
function openEvents() {
  if (!runtimeUsers || source) return
  source = new EventSource('/api/events')
  source.onmessage = () => notify()
}
export function startRuntime() {
  runtimeUsers++
  void ensureSession().then(openEvents).catch(() => { /* React Query exposes the connection error and retries. */ })
  return () => { runtimeUsers--; if (!runtimeUsers) { source?.close(); source = undefined } }
}
const idPath = (id: string) => encodeURIComponent(id)
const query = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)) })
  return params.size ? `?${params}` : ''
}
export const api = {
  exportLegacy: () => request('/workspace/legacy/export'),
  runtimeUsage: () => request<{ day: string; usage: Record<string, { aiRequests: number; checks: number; alerts: number }>; checks: number; alerts: number; executions: number; gasSpent: string; tokenAccess: string; aiSharedDailyLimit: number; legacyArchived: boolean }>('/runtime/usage'),
  account: () => request<Account>('/account'),
  wallet: () => request<Wallet>('/wallet'),
  tier: () => request<Tier>('/tier'),
  network: () => request<DB['network']>('/network'),
  health: () => fetchJson<ServerHealth>('/health'),
  pushStatus: () => request<PushStatus>('/notifications/push'),
  subscribePush: (subscription: PushSubscriptionJSON) => request<{ id: string }>('/notifications/push', 'POST', subscription),
  unsubscribePush: (id: string) => request<{ removed: boolean }>(`/notifications/push/${idPath(id)}`, 'DELETE'),
  messages: (mateId: string) => request<ChatMessage[]>(`/mates/${idPath(mateId)}/messages`),
  sendMessage: (mateId: string, message: string) => request<{ message: ChatMessage }>(`/mates/${idPath(mateId)}/messages`, 'POST', { message }, 60000),
  clearMessages: (mateId: string) => request<{ cleared: boolean }>(`/mates/${idPath(mateId)}/messages`, 'DELETE'),
  analyzeTask: (taskId: string) => request<{ message: ChatMessage }>(`/responsibilities/${idPath(taskId)}/run`, 'POST', {}, 60000),
  checkTask: (taskId: string) => request<MonitorState>(`/responsibilities/${idPath(taskId)}/check`, 'POST', {}, 60000),
  migrationWarning: () => migrationWarning,
  preferences: () => request<Preferences>('/preferences'),
  updatePreferences: (patch: Partial<Preferences>) => request<Preferences>('/preferences', 'PATCH', patch),
  mates: () => request<MateView[]>('/mates'),
  mate: async (id: string): Promise<MateView | null> => {
    try { return await request<MateView>(`/mates/${idPath(id)}`) } catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error }
  },
  responsibilities: (mateId?: string) => request<ResponsibilityItem[]>(`/responsibilities${query({ mateId })}`),
  activity: ({ mateId, limit = 60 }: { mateId?: string; limit?: number } = {}) => request<ActivityItem[]>(`/activity${query({ mateId, limit })}`),
  approvals: (status?: Approval['status']) => request<Approval[]>(`/approvals${query({ status })}`),
  installed: (id: string) => request<string[]>(`/mates/${idPath(id)}/skills`),
  async connectWallet(provider: WalletProvider) {
    const { address } = await connectEvm(provider)
    return request<Wallet>('/wallet', 'POST', { provider, address })
  },
  linkPublicAddress: (address: string) => request<Wallet>('/wallet', 'POST', { provider: 'public', address }),
  previewNewMate: (text: string) => request<TaskPlan>('/mates/preview', 'POST', { text }),
  previewTask: (mateId: string, text: string, monitorConfig?: MonitorConfig) => request<TaskPlan>('/responsibilities/preview', 'POST', { mateId, text, ...(monitorConfig ? { monitorConfig } : {}) }),
  async signIn(provider: WalletProvider) {
    const { wallet, address } = await connectEvm(provider)
    const challenge = await request<{ nonce: string; message: string }>('/auth/challenge', 'POST', { address })
    const encoded = await wallet.request({ method: 'personal_sign', params: [messageHex(challenge.message), address] })
    const account = await request<Account>('/auth/verify', 'POST', { nonce: challenge.nonce, signature: encoded, provider })
    try { localStorage.removeItem('dotos.push-subscription.v1') } catch { /* Optional browser cache. */ }
    source?.close(); source = undefined; openEvents(); notify()
    return account
  },
  async recoverLegacy() {
    const wallet = (window as unknown as { phantom?: { solana?: { connect: () => Promise<{ publicKey: { toString(): string } }>; signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }> } } }).phantom?.solana
    if (!wallet) throw Error('Open Phantom with the Solana wallet used for your previous account.')
    const result = await wallet.connect(), address = result.publicKey.toString()
    const challenge = await request<{ nonce: string; message: string }>('/auth/legacy/challenge', 'POST', { address })
    const signed = await wallet.signMessage(new TextEncoder().encode(challenge.message))
    return request('/auth/legacy/verify', 'POST', { nonce: challenge.nonce, signature: btoa(String.fromCharCode(...signed.signature)) })
  },
  async signOut() {
    const result = await request<{ signedOut: boolean }>('/auth/logout', 'POST', {})
    try { localStorage.removeItem('dotos.push-subscription.v1') } catch { /* Optional browser cache. */ }
    source?.close(); source = undefined; session = undefined
    await ensureSession(); notify(); return result
  },
  disconnectWallet: () => request<Wallet>('/wallet', 'DELETE'),
  resolveApproval: (id: string, decision: 'approved' | 'rejected') => request<Approval>(`/approvals/${idPath(id)}`, 'PATCH', { decision }),
  setPaused: (id: string, paused: boolean) => request<MateView>(`/mates/${idPath(id)}`, 'PATCH', { paused }),
  updateMate: (id: string, patch: Partial<Pick<Mate, 'name' | 'role' | 'body' | 'color'>>) => request<MateView>(`/mates/${idPath(id)}`, 'PATCH', patch),
  removeMate: (id: string) => request<boolean>(`/mates/${idPath(id)}`, 'DELETE'),
  addResponsibility: (mateId: string, text: string, monitorConfig?: MonitorConfig) => request<ResponsibilityItem>('/responsibilities', 'POST', { mateId, text, ...(monitorConfig ? { monitorConfig } : {}) }),
  updateResponsibility: (id: string, patch: { text?: string; active?: boolean; monitorConfig?: MonitorConfig }) => request<ResponsibilityItem>(`/responsibilities/${idPath(id)}`, 'PATCH', patch),
  toggleResponsibility: (id: string, active: boolean) => request<ResponsibilityItem>(`/responsibilities/${idPath(id)}`, 'PATCH', { active }),
  removeResponsibility: (id: string) => request<boolean>(`/responsibilities/${idPath(id)}`, 'DELETE'),
  updateMemory: (id: string, patch: Partial<Memory>) => request<Memory>(`/mates/${idPath(id)}/memory`, 'PATCH', patch),
  updatePermissions: (id: string, patch: Partial<Permissions>) => request<Permissions>(`/mates/${idPath(id)}/permissions`, 'PATCH', patch),
  installSkill: (mateId: string, skill: string) => request<string[]>(`/mates/${idPath(mateId)}/skills`, 'POST', { skill }),
  uninstallSkill: (mateId: string, skill: string) => request<string[]>(`/mates/${idPath(mateId)}/skills`, 'POST', { skill, remove: true }),
  createMate: (input: NewMateInput) => request<MateView>('/mates', 'POST', input),
  resetWorkspace: () => request<{ reset: boolean }>('/workspace/reset', 'POST', { confirm: 'RESET' }),
  exportWorkspace: () => request<{ exportedAt: string; workspace: DB }>('/workspace/export'),
  restoreWorkspace: (workspace: unknown) => request<{ restored: boolean; dots: number; tasks: number }>('/workspace/restore', 'POST', { workspace, confirm: 'RESTORE' }),
}
