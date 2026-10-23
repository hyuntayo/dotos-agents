import { useState } from 'react'
import { Link } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { ago } from '@/lib/time'
import { useNow } from '@/lib/hooks'
import { useInstallSkill, useMates, useRemoveResponsibility, useResponsibilities, useSetPaused, useToggleResponsibility, useUpdateResponsibility } from '../api/hooks'
import type { MateView } from '../api/types'
import { SKILL_NAMES, taskLabel, taskStatus } from '../presentation'
import { toast } from '../toast'
import { Avatar, Btn } from './bits'
import { AppDialog } from './AppDialog'
import { TaskAnalysis } from './TaskAnalysis'
import { TaskMonitoring } from './TaskMonitoring'

export function ResponsibilityTable({ mates: supplied, compact = false, limit, mateId, filter = 'all', search = '', owner = 'all' }: { mates?: MateView[]; compact?: boolean; limit?: number; mateId?: string; filter?: 'all' | 'watching' | 'paused'; search?: string; owner?: string }) {
  const { data: allMates } = useMates()
  const mates = supplied ?? allMates
  const { data: list, isLoading } = useResponsibilities(mateId)
  const toggle = useToggleResponsibility(mateId)
  const pause = useSetPaused()
  const install = useInstallSkill()
  const remove = useRemoveResponsibility()
  const update = useUpdateResponsibility()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const now = useNow(30_000)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const all = (list ?? []).map(task => {
    const mate = mates?.find(item => item.id === task.mateId)
    return { task, mate, status: taskStatus(task, mate) }
  })
  const rows = all.filter(({ task, mate, status }) => (owner === 'all' || task.mateId === owner) && (filter === 'all' || (filter === 'watching' ? status.enabled : status.label.includes('paused'))) && `${taskLabel(task)} ${mate?.name ?? ''} ${task.skill}`.toLowerCase().includes(search.toLowerCase()))
  const detail = all.find(row => row.task.id === selected)
  const close = () => { setSelected(null); setConfirm(false); setEditing(false) }
  const busy = (row: typeof all[number]) => (toggle.isPending && toggle.variables?.id === row.task.id) || (pause.isPending && pause.variables?.id === row.task.mateId) || (install.isPending && install.variables?.mateId === row.task.mateId && install.variables.skill === row.task.skill)
  const change = (row: typeof all[number]) => {
    if (busy(row)) return
    if (row.task.active && row.mate?.paused) pause.mutate({ id: row.mate.id, paused: false })
    else if (row.task.active && row.status.label === 'Skill needed') install.mutate({ mateId: row.task.mateId, skill: row.task.skill })
    else toggle.mutate({ id: row.task.id, active: !row.task.active })
  }
  const actionLabel = (row: typeof all[number]) => row.task.active && row.status.label === 'Skill needed' ? 'Enable skill' : row.task.active && !row.mate?.paused ? 'Pause' : 'Resume'
  return <div className="w-task-list">
    <div className="data-table-wrap"><table className={`data-table w-task-table ${compact ? 'is-compact' : ''}`} aria-label="Your tasks"><thead><tr><th>Task</th>{!compact && !mateId && <th className="w-task-owner">Dot</th>}<th className="w-task-status">Status</th><th><span className="sr-only">Manage task</span></th></tr></thead><tbody>{(limit ? rows.slice(0, limit) : rows).map(row => {
      const { task, mate, status } = row
      const pending = busy(row)
      return <tr key={task.id} data-task-id={task.id}><td className="w-task-cell"><button type="button" className="w-task-name" aria-label={`Task details: ${taskLabel(task)}`} onClick={() => { setSelected(task.id); setConfirm(false); setEditing(false); setText(task.text) }}>{taskLabel(task)}</button><span className="w-task-meta">{!mateId && <span className={`w-task-inline-owner ${compact ? 'always' : ''}`}>{mate?.name} · </span>}{task.monitorConfig?.intervalSeconds ? `every ${task.monitorConfig.intervalSeconds}s` : task.cadence}{!compact && (task.monitor?.lastCheckAt ? ` · Checked ${ago(task.monitor.lastCheckAt, now)}` : task.runs ? ` · AI analysis ${ago(task.lastRun, now)}` : task.execution === 'monitor' ? ' · Background checks enabled' : ' · Monitoring not connected')}</span></td>{!compact && !mateId && <td className="w-task-owner">{mate && <Link to={`/app/m/${mate.id}`} className="table-avatar"><Avatar mate={mate} scale={2} still />{mate.name}</Link>}</td>}<td className="w-task-status"><span className={`w-status ${status.tone}`}><i />{status.label}</span></td><td className="w-task-actions"><button type="button" className="w-task-toggle" aria-label={`${actionLabel(row)}: ${taskLabel(task)}`} disabled={pending} onClick={() => change(row)}><SvgIcon name={pending ? 'loader-circle' : actionLabel(row) === 'Pause' ? 'pause' : actionLabel(row) === 'Enable skill' ? 'zap' : 'play'} size={13} /><span>{pending ? 'Saving…' : actionLabel(row)}</span></button></td></tr>
    })}{!rows.length && <tr><td colSpan={!compact && !mateId ? 4 : 3} className="w-table-empty">{isLoading ? 'Loading tasks…' : list?.length ? 'No tasks match your filters.' : 'No tasks yet. Add your first watch.'}</td></tr>}</tbody></table></div>
    <AppDialog open={!!detail} onClose={close} title="Task details">{detail && <div className="w-task-details"><h3>{taskLabel(detail.task)}</h3>{editing ? <form className="stack-sm" onSubmit={event => { event.preventDefault(); update.mutate({ id: detail.task.id, text: text.trim() }, { onSuccess: () => { setEditing(false); toast({ kind: "success", title: "Task updated" }) } }) }}><label className="w-field"><span>Task instructions</span><textarea aria-label="Edit task instructions" required maxLength={300} rows={3} value={text} onChange={event => setText(event.target.value)} /></label><div className="row-btns"><button type="button" className="pxbtn pxbtn-plain" onClick={() => setEditing(false)}>Cancel edit</button><button type="submit" className="pxbtn" disabled={update.isPending || !text.trim()}>{update.isPending ? "Saving…" : "Save task"}</button></div></form> : <Btn tone="plain" onClick={() => { setText(detail.task.text); setEditing(true) }}>Edit task</Btn>}<dl><dt>Dot</dt><dd>{detail.mate?.name}</dd><dt>Status</dt><dd><span className={`w-status ${detail.status.tone}`}>{detail.status.label}</span></dd><dt>Skill</dt><dd>{SKILL_NAMES[detail.task.skill]?.title ?? detail.task.skill}</dd><dt>Frequency</dt><dd>{detail.task.monitorConfig?.intervalSeconds ? `every ${detail.task.monitorConfig.intervalSeconds}s` : detail.task.cadence}</dd><dt>Last AI analysis</dt><dd>{detail.task.runs ? ago(detail.task.lastRun, now) : 'No analysis yet'}</dd></dl><TaskMonitoring key={`monitor-${detail.task.id}`} task={detail.task} /><TaskAnalysis key={detail.task.id} task={detail.task} mate={detail.mate} />{detail.mate?.paused && detail.task.active && <p className="w-notice"><SvgIcon name="pause" size={15} />{detail.mate.name} is paused. Resume the Dot to enable this task.</p>}{detail.status.label === 'V2 planned' && <p className="w-notice"><SvgIcon name="shield-check" size={16} />Planned for V2. This task is saved without execution.</p>}{confirm ? <div className="w-inline-confirm"><span>Remove this task?</span><button type="button" className="pxbtn pxbtn-plain" onClick={() => setConfirm(false)}>Keep task</button><button type="button" className="w-danger-button" disabled={remove.isPending} onClick={() => remove.mutate(detail.task.id, { onSuccess: () => { close(); toast({ kind: 'info', title: 'Task removed' }) } })}>{remove.isPending ? 'Removing…' : 'Remove task'}</button></div> : <div className="w-dialog-actions"><button type="button" className="w-danger-button" onClick={() => setConfirm(true)}>Remove task</button><Btn tone="plain" onClick={close}>Close</Btn><Btn disabled={busy(detail)} onClick={() => change(detail)}>{busy(detail) ? 'Saving…' : actionLabel(detail) === 'Enable skill' ? 'Enable skill' : actionLabel(detail) === 'Resume' && detail.mate?.paused ? `Resume ${detail.mate.name}` : `${actionLabel(detail)} task`}</Btn></div>}</div>}</AppDialog>
  </div>
}
