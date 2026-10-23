import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useMates, useResponsibilities, useSetPaused } from '../api/hooks'
import { api } from '../api/client'
import { helperRole, taskStatus } from '../presentation'
import { Avatar } from './bits'
import './workspace-pulse.css'

export function WorkspacePulse() {
  const reducedMotion = useReducedMotion()
  const mates = useMates(), tasks = useResponsibilities(), pause = useSetPaused()
  const usage = useQuery({ queryKey: ['runtime-usage'], queryFn: api.runtimeUsage, refetchInterval: 30000 })
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<'name' | 'checks'>('name')
  const [ascending, setAscending] = useState(true)
  const rows = (mates.data ?? []).map(mate => {
    const jobs = (tasks.data ?? []).filter(task => task.mateId === mate.id)
    const watching = jobs.filter(job => taskStatus(job, mate).watching).length
    const needsSetup = jobs.some(job => job.active && job.monitor?.status === 'waiting')
    const retrying = jobs.some(job => job.active && job.monitor?.status === 'error')
    const latest = Math.max(0, ...jobs.map(job => job.monitor?.lastCheckAt ?? 0))
    const state = mate.paused ? 'Sleeping' : retrying ? 'Retrying' : needsSetup ? 'Needs setup' : watching ? 'Watching' : jobs.some(job => taskStatus(job, mate).enabled) ? 'Queued' : 'Ready'
    return { mate, jobs, watching, latest, state }
  }).filter(row => filter === 'all' || (filter === 'watching' ? row.watching > 0 : row.mate.paused))
    .sort((a, b) => (sort === 'name' ? a.mate.name.localeCompare(b.mate.name) : a.mate.stats.checks - b.mate.stats.checks || a.mate.name.localeCompare(b.mate.name)) * (ascending ? 1 : -1))
  const changeSort = (value: typeof sort) => { setAscending(sort === value ? !ascending : value === 'name'); setSort(value) }
  const days = usage.data ? Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${usage.data!.day}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - 6 + index)
    const key = date.toISOString().slice(0, 10), value = usage.data!.usage[key]
    return { key, day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), checks: value?.checks ?? 0, alerts: value?.alerts ?? 0 }
  }) : []
  const maximum = Math.max(1, ...days.map(day => day.checks))
  return <section className="ws-pulse" aria-label="Workspace monitoring overview">
    <div className="w-section-heading"><h2>On your watch</h2><span className="ws-pulse-kicker">YOUR WORKSPACE / LIVE DATA</span></div>
    <div className="ws-pulse-grid">
      <div className="ws-crew-panel">
        <div className="ws-panel-heading"><div><span className="ws-pulse-kicker">CREW STATUS</span><h3>The current shift</h3></div><div className="ws-crew-filters" aria-label="Filter crew status">{[['all', 'All'], ['watching', 'Watching'], ['sleeping', 'Sleeping']].map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div></div>
        {(mates.isError || tasks.isError) && <p className="w-error" role="status">Could not refresh crew status. Showing saved data.</p>}
        <div className="ws-crew-scroll"><table className="ws-crew-table" aria-label="Crew monitoring status"><thead><tr><th aria-sort={sort === 'name' ? ascending ? 'ascending' : 'descending' : 'none'}><button type="button" onClick={() => changeSort('name')}>Dot<SvgIcon name="arrow-down" size={11} /></button></th><th>State</th><th aria-sort={sort === 'checks' ? ascending ? 'ascending' : 'descending' : 'none'}><button type="button" onClick={() => changeSort('checks')}>Checks<SvgIcon name="arrow-down" size={11} /></button></th><th>Last check</th><th><span className="sr-only">Change Dot status</span></th></tr></thead><tbody>{rows.map(({ mate, state, latest }) => <motion.tr key={mate.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .25 }}>
          <th scope="row"><Link to={`/app/m/${mate.id}`}><Avatar mate={mate} scale={2} still /><span><strong>{mate.name}</strong><small>{helperRole(mate)}</small></span></Link></th>
          <td><span className="ws-crew-state" data-state={state}>{state}</span></td><td><motion.span key={mate.stats.checks} initial={{ opacity: .45 }} animate={{ opacity: 1 }}>{mate.stats.checks.toLocaleString('en-US')}</motion.span></td><td>{latest ? <time dateTime={new Date(latest).toISOString()} title={new Date(latest).toLocaleString()}>{new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time> : <span className="ws-not-yet">—</span>}</td>
          <td><button type="button" className="ws-pause-button" aria-label={`${mate.paused ? 'Wake' : 'Sleep'} ${mate.name}`} disabled={pause.isPending && pause.variables?.id === mate.id} onClick={() => pause.mutate({ id: mate.id, paused: !mate.paused })}><SvgIcon name={pause.isPending && pause.variables?.id === mate.id ? 'loader-circle' : mate.paused ? 'sun' : 'moon'} size={15} /></button></td>
        </motion.tr>)}{!rows.length && <tr><td colSpan={5} className="ws-crew-empty">{mates.isLoading || tasks.isLoading ? 'Reading your crew…' : filter === 'all' ? 'Create a Dot to start watching.' : `No ${filter} Dots.`}</td></tr>}</tbody></table></div>
        {pause.isError && <p className="w-error" role="alert">{pause.error.message}</p>}
        <div className="ws-panel-foot"><span>{rows.length} Dots in view</span><Link to="/app/tasks">Open responsibilities<SvgIcon name="arrow-up-right" size={12} /></Link></div>
      </div>
      <div className="ws-history-panel"><div className="ws-panel-heading"><div><span className="ws-pulse-kicker">LAST 7 DAYS / UTC</span><h3>A little work, every day</h3></div><SvgIcon name="activity" size={18} /></div>
        <div className="ws-week-total"><strong>{usage.data ? days.reduce((sum, day) => sum + day.checks, 0).toLocaleString('en-US') : '—'}</strong><span>recorded checks</span></div>
        {usage.isError && <p className="w-error" role="status">Activity could not refresh. {usage.data ? 'Showing the last saved totals.' : 'Try again shortly.'}</p>}
        <div className="ws-week-chart" role="img" aria-label={days.length ? `Checks over seven days: ${days.map(day => `${day.day} ${day.checks}`).join(', ')}` : 'Loading weekly activity'}>{days.map(day => <div key={day.key} title={`${day.key}: ${day.checks} checks, ${day.alerts} alerts`}><span className="ws-bar-track"><motion.i data-empty={!day.checks || undefined} initial={reducedMotion ? false : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: .5 }} style={{ height: `${day.checks ? Math.max(5, day.checks / maximum * 100) : 2}%` }} /></span><small>{day.day.slice(0, 1)}</small></div>)}</div>
        <table className="ws-week-summary" aria-label="Seven day monitoring totals"><tbody><tr><th>Successful checks</th><td>{usage.data ? days.reduce((sum, day) => sum + day.checks, 0) : '—'}</td></tr><tr><th>Alerts recorded</th><td>{usage.data ? days.reduce((sum, day) => sum + day.alerts, 0) : '—'}</td></tr></tbody></table>
        <Link className="ws-history-link" to="/app/activity">See the activity<SvgIcon name="arrow-up-right" size={14} /></Link>
      </div>
    </div>
  </section>
}
