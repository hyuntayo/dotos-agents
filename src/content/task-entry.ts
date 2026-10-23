export const WATCH_SETUPS = {
  balances: 'Watch my ETH portfolio',
  transfers: 'Track my public wallet transfers',
  launches: 'Watch new Pons V2 launches and graduations',
  fees: 'Monitor Pons creator fees',
  prices: 'Alert me when ETH is above my target price',
} as const
export type WatchSetup = keyof typeof WATCH_SETUPS
export const isWatchSetup = (value: string | null): value is WatchSetup => value !== null && Object.hasOwn(WATCH_SETUPS, value)
export function watchSetupLink(mate: string, setup: WatchSetup = 'balances') {
  return `/app/tasks?${new URLSearchParams({ setup: '1', mate, preset: setup })}`
}
