import type { BodyKind, ColorKey } from '@/components/dotmate/sprites'
import type { PixelIconName } from '@/components/icons/pixel-icons'
import type { MonitorConfig } from '../../../shared/monitor'
export type { MonitorConfig } from '../../../shared/monitor'

export type WalletProvider = 'metamask' | 'rabby' | 'coinbase' | 'injected' | 'public'

export interface Wallet {
  connected: boolean
  address?: string
  provider?: WalletProvider
}

export interface Permissions {
  protocols: string[]
  dailyLimit: number
  spentToday: number
  assets: string[]
  transfers: boolean
  swaps: boolean
  maxSwap: number
  largeTxApproval: boolean
}

export interface Memory {
  wallets: string[]
  watched: number
  tokens: string[]
  protocols: string[]
  risk: 'Low' | 'Moderate' | 'High'
  constraints: string[]
}

export interface Mate {
  id: string
  name: string
  body: BodyKind
  color: ColorKey
  role: string
  createdAt: number
  paused: boolean
  stats: { checks: number; events: number; actions: number; replies?: number }
  skills: string[]
  memory: Memory
  permissions: Permissions
  lastActivityAt: number
}

export type MateStatus = 'working' | 'needs_you' | 'sleeping'

export interface MateView extends Mate {
  status: MateStatus
  pending: number
  responsibilities: number
  lastLine?: string
}

export interface ResponsibilityItem {
  id: string
  mateId: string
  text: string
  skill: string
  cadence: string
  active: boolean
  createdAt: number
  runs: number
  lastRun: number
  execution?: 'storage-only' | 'ai' | 'monitor'
  monitorConfig?: MonitorConfig
  monitor?: MonitorState
  lastResult?: { content: string; model: string; at: number }
}

export interface AIStatus { provider: 'openrouter'; configured: boolean; model: string }
export interface MonitorState { catchingUp?: boolean; chainId?: number; source?: string; blockNumber?: number; status: 'queued' | 'watching' | 'waiting' | 'error'; nextRunAt: number; checks: number; failures: number; lastCheckAt?: number; lastAttemptAt?: number; message?: string; result?: string; snapshot?: unknown }
export interface Account { authenticated: boolean; address?: string; verifiedAt?: number; recovered?: boolean }
export interface ServerHealth { status: string; storage: string; mode: string; monitoring: boolean; push?: boolean; ai?: AIStatus; runtime?: { enabled: boolean; running: boolean; lastTickAt: number; pending: number; providers: Record<string, { configured: boolean; available?: boolean; lastSuccessAt?: number }> } }
export interface PushStatus { configured: boolean; publicKey: string | null; subscriptions: { id: string; createdAt: number; lastSuccessAt: number | null; error: string | null }[] }
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; at: number; model?: string; taskId?: string }

export interface Preferences {
  mode: 'day' | 'night' | 'pocket'
  tourDone: boolean
  readAlerts: string[]
}

export type ActivityKind = 'check' | 'event' | 'action' | 'approval' | 'system'

export interface ActivityItem {
  id: string
  mateId: string
  at: number
  kind: ActivityKind
  text: string
  detail?: string
  sig?: string
  icon?: PixelIconName
}

export interface Approval {
  id: string
  mateId: string
  createdAt: number
  action: string
  summary: string
  reason: string
  amountUsd: number
  status: 'pending' | 'approved' | 'rejected'
  resolvedAt?: number
  sig?: string
}

export interface Tier {
  name: 'FREE' | 'PLUS' | 'PRO'
  mates: number
  responsibilities: number
}

export interface DB {
  version: number
  wallet: Wallet
  tier: Tier
  mates: Mate[]
  responsibilities: ResponsibilityItem[]
  activity: ActivityItem[]
  approvals: Approval[]
  installed: Record<string, string[]>
  conversations?: Record<string, ChatMessage[]>
  network: { active: number; responsibilities: number; tasks: number; skills: number; executions: number }
}

export interface NewMateInput {
  name: string
  body: BodyKind
  color: ColorKey
  role: string
  responsibilities: string[]
}

export interface TaskPlan { text: string; mateId: string; skill: string; network: string; source: string; version: string; available: boolean; reason?: string; monitorConfig: MonitorConfig; condition: string; repeat: string; action: string; approval: string; budget: string }
