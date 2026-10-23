import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { MateModel } from '@/components/dotmate/MateModel'
import { SKILLS } from '@/content/data'
import { shortAddr } from '@/lib/hooks'
import { useActivity, useInstallSkill, useInstalled, useMate, useRemoveMate, useResponsibilities, useSetPaused, useUpdateMemory } from '../api/hooks'
import { api } from '../api/client'
import { toast } from '../toast'
import type { MateView } from '../api/types'
import { Btn, CopyText, Empty, Panel, Skeleton } from '../components/bits'
import { ResponsibilityTable } from '../components/ResponsibilityTable'
import { Tape } from '../components/Tape'
import { helperRole, SKILL_NAMES, taskStatus } from '../presentation'
import { openTaskComposer } from '../taskComposer'
import { CompanionChat } from '../components/CompanionChat'

type TabId = 'chat' | 'jobs' | 'activity' | 'memory' | 'skills'
const TABS: { id: TabId; label: string }[] = [{ id: 'chat', label: 'Chat' }, { id: 'jobs', label: 'Responsibilities' }, { id: 'activity', label: 'Activity' }, { id: 'memory', label: 'Memory' }, { id: 'skills', label: 'Skills' }]

export function SkillGrid({ mateId, mateName }: { mateId: string; mateName?: string }) {
  const { data: installed } = useInstalled(mateId)
  const { data: tasks } = useResponsibilities(mateId)
  const install = useInstallSkill()
  const set = new Set(installed ?? [])
  const render = () => <div className="data-table-wrap"><table className="data-table w-skills-table" aria-label="Monitoring skills"><thead><tr><th>Skill</th><th>Enabled for {mateName ?? 'this Dot'}</th></tr></thead><tbody>{SKILLS.map(skill => {
    const info = SKILL_NAMES[skill.name]
    const on = set.has(skill.name)
    const busy = install.isPending && install.variables?.skill === skill.name
    const used = tasks?.filter(task => task.skill === skill.name && task.active).length ?? 0
    return <tr key={skill.name}><td><div className="w-skill-copy"><span className="w-skill-icon"><SvgIcon name={info?.icon ?? 'zap'} size={20} /></span><span><strong>{info?.title ?? skill.name}</strong><span>{skill.desc}</span>{used > 0 && <small>Used by {used} task{used > 1 ? 's' : ''}{!on && ' · enable to resume watching'}</small>}</span></div></td><td><button type="button" className={`w-skill-switch ${on ? 'is-enabled' : ''}`} aria-label={`${on ? 'Disable' : 'Enable'} ${skill.name}`} aria-pressed={on} disabled={busy || !installed || !skill.available} onClick={() => install.mutate({ mateId, skill: skill.name, remove: on })}><SvgIcon name={busy ? 'loader-circle' : on ? 'check' : 'plus'} size={14} />{busy ? 'Saving…' : on ? 'Enabled' : 'Enable'}</button></td></tr>
  })}</tbody></table></div>
  return render()
}

function MemoryTab({ m }: { m: MateView }) {
  const update = useUpdateMemory(m.id)
  const [editing, setEditing] = useState(false)
  const [wallets, setWallets] = useState(m.memory.wallets.join('\n'))
  const [tokens, setTokens] = useState(m.memory.tokens.join(', '))
  const [protocols, setProtocols] = useState(m.memory.protocols.join(', '))
  const [constraints, setConstraints] = useState(m.memory.constraints.join('\n'))
  const items = (value: string) => value.split(/[\n,]/).map(item => item.trim()).filter(Boolean)
  if (editing) return <form className="stack-sm" onSubmit={event => { event.preventDefault(); update.mutate({ wallets: items(wallets), tokens: items(tokens), protocols: items(protocols), constraints: constraints.split('\n').map(item => item.trim()).filter(Boolean) }, { onSuccess: () => { setEditing(false); toast({ kind: 'success', title: 'Watched assets saved' }) } }) }}>
    <h2>Saved assets for {m.name}</h2><p>Save addresses and rules for background monitoring.</p>
    <label className="w-field"><span>Public wallet addresses · one per line</span><textarea aria-label="Saved wallet addresses" rows={3} value={wallets} onChange={event => setWallets(event.target.value)} /></label>
    <label className="w-field"><span>Tokens · comma separated</span><input aria-label="Saved tokens" value={tokens} onChange={event => setTokens(event.target.value)} /></label>
    <label className="w-field"><span>Protocols · comma separated</span><input aria-label="Saved protocols" value={protocols} onChange={event => setProtocols(event.target.value)} /></label>
    <label className="w-field"><span>Rules · one per line</span><textarea aria-label="Saved rules" rows={3} value={constraints} onChange={event => setConstraints(event.target.value)} /></label>
    {update.isError && <p className="w-error" role="alert">{update.error.message}</p>}
    <div className="row-btns"><button type="button" className="pxbtn pxbtn-plain" disabled={update.isPending} onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="pxbtn" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save watched assets'}</button></div>
  </form>
  const rows = [['Your wallets', m.memory.wallets.length ? m.memory.wallets.map(wallet => shortAddr(wallet, 6)).join(', ') : 'No wallet'], ['Watched wallets', m.memory.watched], ['Tokens', m.memory.tokens.join(', ') || 'None yet'], ['Protocols', m.memory.protocols.join(', ') || 'Public wallet data'], ['Saved rules', m.memory.constraints.join(', ') || 'Read-only']] as const
  return <div className="stack-sm"><div className="w-mate-tab-heading"><div><h2>What {m.name} remembers</h2><p>Saved addresses, tokens and rules kept for background monitoring.</p></div><Btn tone="plain" onClick={() => { setWallets(m.memory.wallets.join("\n")); setTokens(m.memory.tokens.join(", ")); setProtocols(m.memory.protocols.join(", ")); setConstraints(m.memory.constraints.join("\n")); setEditing(true) }}>Edit watched assets</Btn></div><Panel><table className="kv"><tbody>{rows.map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table></Panel>{m.memory.wallets[0] && <CopyText text={m.memory.wallets[0]} display="Copy wallet address" />}</div>
}

function ManageMate({ m }: { m: MateView }) {
  const navigate = useNavigate()
  const [name, setName] = useState(m.name)
  const [role, setRole] = useState(m.role)
  const [confirm, setConfirm] = useState(false)
  const update = useMutation({ mutationFn: () => api.updateMate(m.id, { name: name.trim(), role: role.trim() }), onSuccess: () => toast({ kind: 'success', title: 'Dot updated' }) })
  const remove = useRemoveMate()
  return <details className="w-planned"><summary>Manage {m.name}</summary><form className="stack-sm" onSubmit={event => { event.preventDefault(); update.mutate() }}><label className="w-field"><span>Name</span><input aria-label="Edit Dot name" maxLength={10} required value={name} onChange={event => setName(event.target.value)} /></label><label className="w-field"><span>Role</span><input aria-label="Edit Dot role" maxLength={60} required value={role} onChange={event => setRole(event.target.value)} /></label><div className="row-btns"><button type="submit" className="pxbtn" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save Dot'}</button><button type="button" className="w-danger-button" onClick={() => setConfirm(true)}>Remove Dot…</button></div></form>{confirm && <div className="w-inline-confirm"><span>Remove {m.name}, its tasks and history?</span><button type="button" className="pxbtn pxbtn-plain" disabled={remove.isPending} onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="w-danger-button" disabled={remove.isPending} onClick={() => remove.mutate(m.id, { onSuccess: () => { toast({ kind: 'info', title: 'Dot removed' }); navigate('/app') } })}>{remove.isPending ? 'Removing…' : 'Remove Dot'}</button></div>}</details>
}

export function MatePage() {
  const { id = '' } = useParams()
  const { data: m, isLoading } = useMate(id)
  const { data: tasks } = useResponsibilities(id)
  const { data: activity, isLoading: activityLoading } = useActivity(id, 40)
  const pause = useSetPaused()
  const [search, setSearch] = useSearchParams()
  const tab: TabId = TABS.find(item => item.id === search.get('tab'))?.id ?? 'jobs'
  const watching = tasks?.filter(task => taskStatus(task, m ?? undefined).watching).length ?? 0
  if (isLoading) return <div className="stack"><Skeleton className="h-[275px]" /><Skeleton className="h-[300px]" /></div>
  if (!m) return <Empty icon="robot-face" title="Dot not found" text="It may have been removed or your workspace may have been reset."><Btn to="/app" tone="plain">Back to overview</Btn></Empty>
  return <div className="stack"><Link to="/app" className="back">Back to overview</Link><div className="w-mate-hero"><div className="w-mate-model"><MateModel body={m.body} color={m.color} interactive paused={m.paused} activityCount={m.stats.checks + (m.stats.replies ?? 0)} onPausedChange={value => pause.mutate({ id, paused: value })} className="workspace-model" label={`${m.name} model. Tap to interact; drag to rotate.`} /></div><div className="w-mate-hero-info"><span className={`w-status ${m.paused ? 'muted' : watching ? 'green' : 'muted'}`}><i />{m.paused ? 'Paused' : watching ? 'Watching for you' : tasks?.length ? 'Tasks saved' : 'Ready for a task'}</span><h1>{m.name}</h1><p>{helperRole(m)}</p><div className="w-mate-numbers"><div><strong>{watching}</strong><span>Active watches</span></div><div><strong>{tasks?.length ?? 0}</strong><span>Assigned tasks</span></div><div><strong>{(m.stats.replies ?? 0).toLocaleString('en-US')}</strong><span>AI replies</span></div></div><div className="row-btns"><Btn tone="plain" onClick={() => setSearch({ tab: 'chat' }, { replace: true })}>Talk to {m.name}</Btn><Btn onClick={() => openTaskComposer(id)}><SvgIcon name="plus" size={15} />Add task</Btn><Btn tone="plain" disabled={pause.isPending} onClick={() => pause.mutate({ id, paused: !m.paused })}>{pause.isPending ? 'Saving…' : m.paused ? `Resume ${m.name}` : `Pause ${m.name}`}</Btn></div></div></div><ManageMate key={id} m={m} />{m.paused && <p className="w-notice"><SvgIcon name="pause" size={16} />{m.name} is paused. Resume it to enable its saved tasks.</p>}<div><div className="tabs" role="tablist" aria-label={`${m.name} details`}>{TABS.map(item => <button type="button" role="tab" key={item.id} aria-selected={tab === item.id} aria-controls={`mate-panel-${item.id}`} id={`mate-tab-${item.id}`} onClick={() => setSearch({ tab: item.id }, { replace: true })} className={`tab ${tab === item.id ? 'on' : ''}`}>{item.label}</button>)}</div><div className="tabpanel" role="tabpanel" id={`mate-panel-${tab}`} aria-labelledby={`mate-tab-${tab}`}>{tab === 'chat' && <CompanionChat key={id} mate={m} />}{tab === 'jobs' && <div className="stack-sm"><div className="w-mate-tab-heading"><div><h2>{m.name}’s tasks</h2><p>Pause one task here, or pause {m.name} to stop them all.</p></div></div><ResponsibilityTable mateId={id} mates={[m]} /></div>}{tab === 'activity' && <Tape items={activity} showMate={false} loading={activityLoading} />}{tab === 'memory' && <MemoryTab key={id} m={m} />}{tab === 'skills' && <SkillGrid mateId={id} mateName={m.name} />}</div></div></div>
}
