import { availableSkill } from '../../../shared/chain'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import type { MonitorConfig, ResponsibilityItem } from '../api/types'
import { inferredRule, MONITOR_INTERVALS } from '../../../shared/monitor'
import { ago } from '@/lib/time'
import { useNow } from '@/lib/hooks'
import { toast } from '../toast'
import { Btn } from './bits'
import { PonsHistory } from './PonsHistory'

const entries = (text: string) => text.split(/[\s,]+/).map(value => value.trim()).filter(Boolean)
export function TaskMonitoring({ task }: { task: ResponsibilityItem }) {
  const saved = task.monitorConfig ?? {}, rule = inferredRule(task.text)
  const [wallets, setWallets] = useState(saved.wallets?.join('\n') ?? '')
  const [tokens, setTokens] = useState(saved.tokens?.join(', ') ?? '')
  const [direction, setDirection] = useState<MonitorConfig['direction']>(saved.direction ?? rule.direction)
  const [threshold, setThreshold] = useState(saved.threshold?.toString() ?? rule.threshold?.toString() ?? '15')
  const [interval, setInterval] = useState(saved.intervalSeconds ?? MONITOR_INTERVALS[task.skill] ?? 300)
  const [baseline, setBaseline] = useState(saved.baseline?.toString() ?? '')
  const now = useNow(30000)
  const check = useMutation({ mutationFn: () => api.checkTask(task.id), retry: false })
  const save = useMutation({ mutationFn: () => {
    const monitorConfig: MonitorConfig = { wallets: entries(wallets), tokens: entries(tokens), direction, threshold: Number(threshold), intervalSeconds: interval }
    if (baseline) monitorConfig.baseline = Number(baseline)
    return api.updateResponsibility(task.id, { monitorConfig })
  }, onSuccess: () => toast({ kind: 'success', title: 'Monitoring settings saved' }) })
  if (!availableSkill(task.skill)) return null
  return <section className="w-monitoring stack-sm" aria-label="Task monitoring">
    <h4>Robinhood Chain · read-only</h4><p>{task.monitor?.message ?? (task.monitor?.status === 'watching' ? 'Watching for changes that match your rules.' : task.execution === 'monitor' ? 'Queued for a background check.' : 'Monitoring is not enabled on this server.')}</p>
    {task.monitor?.source && <p><small>{task.monitor.source}{task.monitor.blockNumber ? ` · block ${task.monitor.blockNumber}` : ''}</small></p>}
    {task.monitor?.lastCheckAt && <p><strong>{task.monitor.result}</strong><br /><small>Checked {ago(task.monitor.lastCheckAt, now)} · {task.monitor.checks} completed checks</small></p>}
    {['Pons Fee Monitor', 'Pons Launch Watcher'].includes(task.skill) && <PonsHistory snapshot={task.monitor?.snapshot} fees={task.skill === 'Pons Fee Monitor'} catchingUp={task.monitor?.catchingUp} />}
    {task.monitor?.snapshot !== undefined && <details><summary>Latest source data</summary><pre className="w-monitor-snapshot">{JSON.stringify(task.monitor.snapshot, null, 2)}</pre></details>}
    <Btn tone="plain" disabled={task.execution !== 'monitor' || !task.active || check.isPending} onClick={() => check.mutate()}>{check.isPending ? 'Checking…' : 'Check now'}</Btn>
    {check.isError && <p className="w-error" role="alert">{check.error.message}</p>}
    <details><summary>Monitoring settings</summary><form className="stack-sm" onSubmit={event => { event.preventDefault(); save.mutate() }}>
      <label className="w-field"><span>Wallet addresses · one per line</span><textarea aria-label="Monitoring wallet addresses" value={wallets} onChange={event => setWallets(event.target.value)} rows={2} placeholder="Use the linked wallet or saved assets when empty" /></label>
      <label className="w-field"><span>Tokens · ETH or ERC-20 contract addresses</span><input aria-label="Monitoring tokens" value={tokens} onChange={event => setTokens(event.target.value)} placeholder="Use saved tokens when empty" /></label>
      {task.skill === 'Token Price Watcher' && <label className="w-field"><span>Price condition</span><select aria-label="Price condition" value={direction} onChange={event => setDirection(event.target.value as MonitorConfig['direction'])}>{[['drop', 'Drops by % from starting price'], ['rise', 'Rises by % from starting price'], ['change', 'Changes by % from starting price'], ['above', 'Above USD price'], ['below', 'Below USD price']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      {task.skill === 'Token Price Watcher' && <label className="w-field"><span>Price threshold · % or USD</span><input type="number" min={0} step="any" required aria-label="Monitoring threshold" value={threshold} onChange={event => setThreshold(event.target.value)} /></label>}
      {task.skill === 'Token Price Watcher' && <label className="w-field"><span>Starting price · USD (empty = first successful check)</span><input type="number" min="0.000000001" step="any" aria-label="Starting price" value={baseline} onChange={event => setBaseline(event.target.value)} /></label>}
      <p><small>Alerts repeat after a condition clears and matches again. Saving settings starts new observations.</small></p>
      <label className="w-field"><span>Check interval · seconds</span><input type="number" min={30} max={86400} required aria-label="Monitoring interval" value={interval} onChange={event => setInterval(Number(event.target.value))} /></label>
      {save.isError && <p className="w-error" role="alert">{save.error.message}</p>}
      <button type="submit" className="pxbtn" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save monitoring settings'}</button>
    </form></details>
  </section>
}
