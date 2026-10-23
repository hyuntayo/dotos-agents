import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { TaskPlanCard } from './TaskPlanCard'
import { availableSkill } from '../../../shared/chain'
import { useState } from 'react'
import { WATCH_SETUPS, type WatchSetup } from '@/content/task-entry'
import { inferredRule } from '../../../shared/monitor'
import type { MonitorConfig } from '../api/types'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { classify } from '@/content/classify'
import { useAddResponsibility, useMates, useResponsibilities, useTier } from '../api/hooks'
import { TASK_PRESETS, SKILL_NAMES } from '../presentation'
import { closeTaskComposer, finishTaskComposer, useTaskComposer } from '../taskComposer'
import { toast } from '../toast'
import { AppDialog } from './AppDialog'
import { Avatar } from './bits'

function ComposerForm({ initialMate, setup, onAdded }: { initialMate?: string; setup?: WatchSetup; onAdded: () => void }) {
  const { data: mates } = useMates()
  const { data: tasks } = useResponsibilities()
  const { data: tier } = useTier()
  const [picked, setPicked] = useState(initialMate ?? '')
  const [text, setText] = useState(setup ? WATCH_SETUPS[setup] : '')
  const [addresses, setAddresses] = useState('')
  const [tokens, setTokens] = useState('')
  const [thresholdDraft, setThresholdDraft] = useState<string | null>(null)
  const [directionDraft, setDirectionDraft] = useState<MonitorConfig['direction'] | null>(null)
  const preview = useMutation({ mutationFn: () => api.previewTask(mateId, text.trim(), { wallets: addresses.split(/[\s,]+/).filter(Boolean), tokens: tokens.split(/[\s,]+/).filter(Boolean), ...(priceTask ? { direction, threshold: Number(threshold) } : {}) }) })
  const add = useAddResponsibility()
  const mateId = picked || mates?.[0]?.id || ''
  const mate = mates?.find(item => item.id === mateId)
  const skill = text.trim() ? classify(text) : null
  const priceTask = skill?.skill === 'Token Price Watcher'
  const inferred = inferredRule(text)
  const direction = directionDraft ?? inferred.direction
  const threshold = thresholdDraft ?? (/\d+(?:[.,]\d+)?\s*%|(?:\$|above\s*|below\s*)\d+/i.test(text) ? String(inferred.threshold) : '')
  const priceValid = !priceTask || threshold.trim() !== '' && Number.isFinite(Number(threshold)) && Number(threshold) > 0 && Number(threshold) <= 1000000000
  const atLimit = !!tier && (tasks?.filter(task => task.active).length ?? 0) >= tier.responsibilities
  const classifiedLaunchSupported = !!skill && availableSkill(skill.skill)
  const valid = classifiedLaunchSupported && !!mate && text.trim().length > 0 && !atLimit && priceValid
  const reviewing = preview.data?.text === text.trim() && preview.data?.mateId === mateId
  const submit = () => {
    if (!valid || add.isPending) return
    if (!preview.data || preview.data.text !== text.trim() || preview.data.mateId !== mateId) { preview.mutate(); return }
    add.mutate({ mateId, text: text.trim(), monitorConfig: preview.data.monitorConfig }, { onSuccess: () => { toast({ kind: 'success', title: 'Task added', body: `${mate.name} has your task saved. The reviewed monitoring rules are saved.` }); onAdded() } })
  }
  return <form className="task-composer" onSubmit={event => { event.preventDefault(); submit() }}>
    {!reviewing && <>
    <label className="w-field"><span>Who should watch?</span><div className="w-select-with-avatar">{mate && <Avatar mate={mate} scale={2} still />}<select aria-label="Assign to Dot" value={mateId} onChange={event => setPicked(event.target.value)}>{mates?.map(item => <option key={item.id} value={item.id}>{item.name}{item.paused ? ' · paused' : ''}</option>)}</select></div></label>
    <label className="w-field"><span>What should it watch?</span><textarea autoFocus aria-label="Task instructions" placeholder="Alert me if ETH drops more than 15%" value={text} maxLength={300} onChange={event => setText(event.target.value)} required rows={3} /></label>
    <label className="w-field"><span>Public wallets (optional)</span><input aria-label="Task wallets" placeholder="0x..." value={addresses} onChange={event => { setAddresses(event.target.value); preview.reset() }} /></label>
    <label className="w-field"><span>Tokens: ETH or EVM contract addresses</span><input aria-label="Task tokens" placeholder="ETH" value={tokens} onChange={event => { setTokens(event.target.value); preview.reset() }} /></label>
    {priceTask && <div className="stack-sm"><label className="w-field"><span>Price condition</span><select aria-label="Price condition" value={direction} onChange={event => { setDirectionDraft(event.target.value as MonitorConfig['direction']); preview.reset() }}><option value="above">Above (USD)</option><option value="below">Below (USD)</option><option value="drop">Drops by (%)</option><option value="rise">Rises by (%)</option><option value="change">Changes by (%)</option></select></label><label className="w-field"><span>{direction === 'above' || direction === 'below' ? 'Target price in USD' : 'Change in percent'}</span><input aria-label="Price threshold" type="number" min="0.00000001" max="1000000000" step="any" value={threshold} required onChange={event => { setThresholdDraft(event.target.value); preview.reset() }}/></label></div>}
    <div className="w-presets" aria-label="Task templates">{TASK_PRESETS.map(preset => <button type="button" key={preset.label} onClick={() => { setText(preset.text); setThresholdDraft(null); setDirectionDraft(null); preview.reset() }}><SvgIcon name={preset.icon} size={14} />{preset.label}</button>)}</div>
    {skill && <div className="task-composer-preview"><SvgIcon name="repeat-2" size={17} /><span><strong>{SKILL_NAMES[skill.skill]?.title ?? skill.skill}</strong><small>{skill.cadence} · The required skill is enabled automatically.</small></span></div>}
    {mate?.paused && <p className="w-notice"><SvgIcon name="pause" size={15} />{mate.name} is paused. Resume it to enable this task.</p>}
    {skill && !availableSkill(skill.skill) && <p className="w-notice"><SvgIcon name="shield-check" size={15} />Trading is unavailable. Choose a monitoring task instead.</p>}
    {atLimit && <p className="w-error" role="alert">Task limit reached. Pause a task to make room.</p>}
    </>}
    {preview.data && preview.data.text === text.trim() && preview.data.mateId === mateId && <TaskPlanCard plan={preview.data} />}
    {preview.isError && <p className="w-error" role="alert">{preview.error.message}</p>}
    {add.isError && <p className="w-error" role="alert">{add.error.message}</p>}
    <div className="w-dialog-actions"><button type="button" className="pxbtn pxbtn-plain" onClick={() => reviewing ? preview.reset() : closeTaskComposer()}>{reviewing ? 'Edit task' : 'Cancel'}</button><button type="submit" className="pxbtn" disabled={!valid || add.isPending || preview.isPending}>{add.isPending ? 'Adding…' : preview.isPending ? 'Preparing review...' : preview.data?.text === text.trim() && preview.data?.mateId === mateId ? 'Activate task' : 'Review task'}<SvgIcon name="plus" size={15} /></button></div>
  </form>
}

export function TaskComposer() {
  const state = useTaskComposer()
  return <AppDialog open={state.open} onClose={closeTaskComposer} title="Add a task">{state.open && <ComposerForm initialMate={state.mateId} setup={state.setup} onAdded={() => finishTaskComposer(state)} />}</AppDialog>
}
