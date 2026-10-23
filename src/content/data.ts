import type { PixelIconName } from '@/components/icons/pixel-icons'
import { MANIFESTS } from '../../shared/chain'
export type Skill = { name: string; icon: PixelIconName; desc: string; tools: string[]; mode: 'read'; stage: 'MVP' | 'Unavailable'; available: boolean }
const icons: PixelIconName[] = ['chart-line', 'eye', 'trophy', 'gift', 'siren', 'gift', 'clock', 'shield', 'chart-line']
export const SKILLS: Skill[] = MANIFESTS.flatMap((manifest, i): Skill[] => manifest.status === 'read-only' ? [{ name: manifest.name, icon: icons[i], desc: manifest.source, tools: [manifest.source, `v${manifest.version}`], mode: 'read', stage: 'MVP', available: true }] : [])

export const FAQ = [
  { q: 'Does my Dot hold my private key?', a: 'No. Monitoring reads public addresses. Optional wallet sign-in asks you to sign an authentication message. Dots never requests a seed phrase and cannot move your funds.' },
  { q: 'Does monitoring keep running when I close the site?', a: 'Yes. Active, configured tasks run on the server at their saved interval. Checks can be delayed by provider availability and rate limits. The activity feed shows results, source data and retry status.' },
  { q: 'Where do I receive alerts?', a: 'Alerts appear in your dashboard inbox. Enable browser notifications to receive them when the dashboard is closed.' },
  { q: 'What is included?', a: 'Up to six Dots, forty active monitoring tasks and saved AI conversations. Watch balances, wallet activity, Pons launches, creator fees and prices. AI replies share a daily allowance.' },
  { q: 'Can I access my workspace on another device?', a: 'Sign in with the same wallet to recover your saved account. Without wallet sign-in, your workspace is linked to this browser’s session cookie. You can export your workspace from Settings.' },
]
