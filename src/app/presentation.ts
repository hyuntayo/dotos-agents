import { availableSkill } from '../../shared/chain'
import type { MateView, ResponsibilityItem } from './api/types'

export const TASK_PRESETS = [
  { label: 'Portfolio', icon: 'chart-no-axes-combined', text: 'Watch my ETH portfolio' },
  { label: 'Price alert', icon: 'activity', text: 'Alert me if ETH drops more than 15%' },
  { label: 'Pons fees', icon: 'gift', text: 'Monitor Pons creator fees' },
  { label: 'Wallet activity', icon: 'scan-eye', text: 'Track my public wallet' },
  { label: 'Token launches', icon: 'rocket', text: 'Notify me when one of my Pons V2 tokens graduates' },
] as const

export const SKILL_NAMES: Record<string, { title: string; description: string; icon: string }> = {
  'Portfolio Monitor': { title: 'Portfolio tracking', description: 'Watch balances and portfolio changes.', icon: 'chart-no-axes-combined' },
  'Wallet Tracker': { title: 'Wallet activity', description: 'Follow transactions from public addresses.', icon: 'scan-eye' },
  'Pons Launch Watcher': { title: 'Token launches', description: 'Know when a Pons V2 token graduates.', icon: 'rocket' },
  'Reward Scanner': { title: 'Reward detection', description: 'Find rewards that are ready to claim.', icon: 'gift' },
  'Scheduled Purchase': { title: 'Recurring buys', description: 'Trading execution is unavailable.', icon: 'repeat-2' },
  'Token Price Watcher': { title: 'Price alerts', description: 'Get an alert when a price rule matches.', icon: 'activity' },
  'Position Monitor': { title: 'DeFi health', description: 'Watch position health and liquidation risk.', icon: 'shield-check' },
  'Pons Fee Monitor': { title: 'Creator fees', description: 'Track claimable balances, credits and payouts.', icon: 'gift' },
  'Stock Token Monitor': { title: 'Stock tokens', description: 'Awaiting a verified registry and data adapter.', icon: 'chart-no-axes-combined' },
}

export const helperRole = (mate: MateView) => ({ DeFi: 'Rewards & DeFi', 'Wallet Tracking': 'Wallet activity', 'Pons V2': 'Token launches', Treasury: 'Creator fees' })[mate.role] ?? mate.role
export const isPreviewTask = (task: ResponsibilityItem) => !availableSkill(task.skill)
export const taskLabel = (task: ResponsibilityItem) => task.text === 'Claim rewards when value exceeds $50' ? 'Find rewards when value exceeds $50' : task.text
export function taskStatus(task: ResponsibilityItem, mate?: MateView) {
  if (!task.active) return { label: 'Task paused', tone: 'muted', watching: false, enabled: false }
  if (mate?.paused) return { label: 'Dot paused', tone: 'muted', watching: false, enabled: false }
  if (mate && !mate.skills.includes(task.skill)) return { label: 'Skill needed', tone: 'warning', watching: false, enabled: false }
  if (task.execution === 'monitor') {
    if (task.monitor?.status === 'waiting') return { label: 'Setup needed', tone: 'warning', watching: false, enabled: true }
    if (task.monitor?.status === 'error') return { label: 'Retrying', tone: 'warning', watching: false, enabled: true }
    if (task.monitor?.catchingUp) return { label: 'Catching up', tone: 'warning', watching: false, enabled: true }
    if (task.monitor?.status === 'watching') return { label: 'Watching', tone: 'green', watching: true, enabled: true }
    return { label: 'Queued', tone: 'muted', watching: false, enabled: true }
  }
  if (task.execution === 'ai') return { label: 'AI response ready', tone: 'green', watching: false, enabled: true }
  if (isPreviewTask(task)) return { label: 'Execution unavailable', tone: 'muted', watching: false, enabled: false }
  if (task.execution === 'storage-only') return { label: 'Saved · not running', tone: 'muted', watching: false, enabled: true }
  return { label: 'Not checked', tone: 'muted', watching: false, enabled: true }
}
