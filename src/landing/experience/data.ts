import type { MateId } from '@/components/dotmate/sprites'

export const CREW = [
  { id: 'bob' as MateId, name: 'BOB', role: 'Portfolio & prices', body: 'blob', color: 'violet', accent: '#a69cff', line: 'A second pair of eyes.', watch: 'Balances & price rules', icon: 'wallet', code: '01' },
  { id: 'max' as MateId, name: 'MAX', role: 'Pons launches', body: 'bot', color: 'amber', accent: '#efc76f', line: 'Early to the next thing.', watch: 'Launches & graduations', icon: 'rocket', code: '02' },
  { id: 'iggy' as MateId, name: 'IGGY', role: 'Wallet activity', body: 'owl', color: 'mint', accent: '#a1d4b3', line: 'Nothing gets past IGGY.', watch: 'Public wallet transfers', icon: 'scan-eye', code: '03' },
  { id: 'nova' as MateId, name: 'NOVA', role: 'Creator fees', body: 'star', color: 'pink', accent: '#edb4a5', line: 'Your next little heads-up.', watch: 'Escrow, credits & claims', icon: 'coins', code: '04' },
] as const

export const TOOLS = [
  { name: 'Portfolio Monitor', icon: 'wallet', category: 'wallet', source: 'Robinhood Chain', watch: 'ETH & ERC-20 balances', interval: '5 min', result: 'Balance changes, saved in your activity.', detail: 'Keep public addresses in one place. Compare balances at your saved interval.' },
  { name: 'Wallet Tracker', icon: 'scan-eye', category: 'wallet', source: 'Robinhood Chain', watch: 'Public wallet transfers', interval: '1 min', result: 'A heads-up for incoming and outgoing transfers.', detail: 'Follow public wallet activity. Open the transaction source from your results.' },
  { name: 'Pons Launch Watcher', icon: 'rocket', category: 'pons', source: 'Pons V2', watch: 'Launches & graduations', interval: '1 min', result: 'Launch and graduation observations.', detail: 'Watch new Pons launches and the move from the curve to the pool.' },
  { name: 'Pons Fee Monitor', icon: 'coins', category: 'pons', source: 'Pons V2', watch: 'Escrow, credits & claims', interval: '5 min', result: 'Creator fee history, ready to inspect.', detail: 'Track the public fee state. Your Dot reads it; claims stay in your hands.' },
  { name: 'Token Price Watcher', icon: 'activity', category: 'wallet', source: 'Coinbase / Pons', watch: 'ETH & Pons token prices', interval: '1 min', result: 'Price alerts when your condition is met.', detail: 'Set an above or below rule. Receive a signal when the price enters that rule.' },
] as const

