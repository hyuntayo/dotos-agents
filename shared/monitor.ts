export interface MonitorConfig {
  wallets?: string[]
  tokens?: string[]
  direction?: 'above' | 'below' | 'drop' | 'rise' | 'change'
  threshold?: number
  intervalSeconds?: number
  baseline?: number
  repeat?: 'on-reentry'
  farms?: string[]
  strategies?: string[]
  markets?: string[]
}
export function inferredRule(text: string): Pick<MonitorConfig, 'direction' | 'threshold'> {
  const amount = text.match(/(?:\$|above\s*|below\s*|выше\s*|ниже\s*)(\d+(?:[.,]\d+)?)/i)
  const percent = text.match(/(\d+(?:[.,]\d+)?)\s*%/)
  const direction = /above|выше/i.test(text) ? 'above' : /below|ниже/i.test(text) ? 'below' : /drop|dump|пад|сниз/i.test(text) ? 'drop' : /rise|рост|вырос/i.test(text) ? 'rise' : 'change'
  return { direction, threshold: Number((percent?.[1] ?? amount?.[1] ?? '15').replace(',', '.')) }
}
export const MONITOR_INTERVALS: Record<string, number> = { 'Portfolio Monitor': 300, 'Wallet Tracker': 60, 'Token Price Watcher': 60, 'Pons Launch Watcher': 60, 'Pons Fee Monitor': 300, 'Reward Scanner': 3600, 'Kamino Position Monitor': 600, 'LP Position Monitor': 900 }
