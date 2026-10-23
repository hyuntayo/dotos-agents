export const SKILLS = ['Portfolio Monitor', 'Wallet Tracker', 'Pons Launch Watcher', 'Pons Fee Monitor', 'Reward Scanner', 'Scheduled Purchase', 'Token Price Watcher', 'Position Monitor', 'Stock Token Monitor'] as const
export const BODIES = ['blob', 'bot', 'owl', 'star'] as const
export const COLORS = ['mint', 'violet', 'amber', 'pink', 'sky'] as const
export const CREW = [
  { id: 'bob', name: 'BOB', body: 'blob', color: 'violet', role: 'Portfolio' },
  { id: 'max', name: 'MAX', body: 'bot', color: 'amber', role: 'Pons Launches' },
  { id: 'iggy', name: 'IGGY', body: 'owl', color: 'mint', role: 'Wallet Tracking' },
  { id: 'nova', name: 'NOVA', body: 'star', color: 'pink', role: 'Creator fees' },
] as const

/** Shared by the task preview and the API so saved tasks use the same skill. */
export function classify(text: string): { skill: typeof SKILLS[number]; cadence: string; mate: 'bob' | 'max' | 'iggy' | 'nova' } {
  const t = text.toLowerCase()
  if (/fee|escrow|treasury|комисси|казна/.test(t)) return { skill: 'Pons Fee Monitor', cadence: 'every 5 min', mate: 'nova' }
  if (/stock|equity|акци/.test(t)) return { skill: 'Stock Token Monitor', cadence: 'unavailable', mate: 'bob' }
  if (/graduat|pump|bonding|launch|памп|запуск|градуац/.test(t)) return { skill: 'Pons Launch Watcher', cadence: 'every minute', mate: 'max' }
  if (/reward|claim|yield|наград|вознаграж/.test(t)) return { skill: 'Reward Scanner', cadence: 'hourly', mate: 'max' }
  if (/health|ltv|liquidat|kamino|ликвидац|здоровь/.test(t)) return { skill: 'Position Monitor', cadence: 'every 10 min', mate: 'max' }
  if (/\blp\b|range|meteora|pool|ликвидност|диапазон/.test(t)) return { skill: 'Position Monitor', cadence: 'every 15 min', mate: 'max' }
  if (/buy|dca|every (mon|tue|wed|thu|fri|sat|sun|day|week)|swap|купить|покупай|обмен/.test(t)) return { skill: 'Scheduled Purchase', cadence: t === 'buy $50 sol every monday' ? 'weekly' : 'scheduled', mate: 'max' }
  if (/drop|alert|%|price|dump|above|below|цен|падени|выше|ниже/.test(t)) return { skill: 'Token Price Watcher', cadence: 'every minute', mate: 'bob' }
  if (/wallet|whale|follow|track|кошел|кит|отслеж/.test(t) && !/portfolio|портфел/.test(t)) return { skill: 'Wallet Tracker', cadence: 'every minute', mate: 'iggy' }
  return { skill: 'Portfolio Monitor', cadence: 'every 5 min', mate: 'bob' }
}
