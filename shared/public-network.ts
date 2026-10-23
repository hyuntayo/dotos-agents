export type PublicSkillActivity = {
  name: string
  enabled: number
  monitoring: number
  needsSetup: number
  delayed: number
  queued: number
  lastCheckAt: number | null
}

export type PublicNetwork = {
  activeDots: number
  responsibilities: number
  checks: number
  alerts24h: number
  enabledResponsibilities: number
  waitingResponsibilities: number
  delayedResponsibilities: number
  queuedResponsibilities: number
  lastCheckAt: number | null
  observedAt: number
  runtime: { online: boolean; lastTickAt: number | null }
  skills: PublicSkillActivity[]
}
