import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { TaskPlanCard } from '../components/TaskPlanCard'
import { availableSkill } from '../../../shared/chain'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { PALETTES, type BodyKind, type ColorKey } from '@/components/dotmate/sprites'
import { MateModel } from '@/components/dotmate/MateModel'
import { MateSprite } from '@/pixel/sprites/Sprite'
import { classify } from '@/content/classify'
import { useCreateMate, useMates, useResponsibilities, useTier, useWallet } from '../api/hooks'
import { PageTitle, walletModal } from '../components/bits'
import { SKILL_NAMES, TASK_PRESETS } from '../presentation'
import { toast } from '../toast'

const BODIES: { body: BodyKind; label: string }[] = [{ body: 'blob', label: 'Operator' }, { body: 'bot', label: 'Technician' }, { body: 'owl', label: 'Scout' }, { body: 'star', label: 'Pilot' }]
const COLORS: ColorKey[] = ['violet', 'amber', 'mint', 'pink', 'sky']

export function NewMatePage() {
  const nav = useNavigate()
  const { data: wallet } = useWallet()
  const { data: tier } = useTier()
  const { data: mates } = useMates()
  const { data: tasks } = useResponsibilities()
  const create = useCreateMate()
  const [body, setBody] = useState<BodyKind>('blob')
  const [color, setColor] = useState<ColorKey>('violet')
  const [name, setName] = useState('')
  const [text, setText] = useState<string>('')
  const preview = useMutation({ mutationFn: () => api.previewNewMate(text.trim()) })
  const classified = classify(text)
  const full = !!tier && (mates?.length ?? 0) >= tier.mates
  const taskLimit = !!tier && (tasks?.filter(task => task.active).length ?? 0) >= tier.responsibilities
  const classifiedLaunchSupported = availableSkill(classified.skill)
  const valid = classifiedLaunchSupported && !!name.trim() && !!text.trim() && !full && !taskLimit
  const role = classified.mate === 'max' ? 'Pons Launches' : classified.mate === 'iggy' ? 'Wallet Tracking' : classified.mate === 'nova' ? 'Creator fees' : 'Portfolio'
  const submit = () => {
    if (!valid || create.isPending) return
    if (preview.data?.text !== text.trim()) { preview.mutate(); return }
    create.mutate({ name: name.trim(), body, color, role, responsibilities: [text.trim()] }, { onSuccess: mate => { toast({ kind: 'success', title: `${mate.name} is ready`, body: 'Your first task is assigned.' }); nav(`/app/m/${mate.id}`) } })
  }
  return <div className="stack"><PageTitle kicker="New Dot" sub="Choose a character and give it its first task.">Meet your new Dot.</PageTitle><div className="w-create-layout"><form className="w-create-form" onSubmit={event => { event.preventDefault(); submit() }}><section><div className="w-create-section"><span>01</span><h2>Choose a character</h2></div><div className="w-body-picker">{BODIES.map(item => <button type="button" key={item.body} aria-label={`Choose ${item.label}`} aria-pressed={body === item.body} onClick={() => setBody(item.body)}><MateSprite body={item.body} color={color} scale={4} still /><span>{item.label}</span></button>)}</div><div className="w-color-picker" aria-label="Character color">{COLORS.map(value => <button type="button" key={value} aria-label={`${value} color`} aria-pressed={color === value} onClick={() => setColor(value)} style={{ background: PALETTES[value].base }}>{color === value && <SvgIcon name="check" size={13} />}</button>)}</div></section><section><div className="w-create-section"><span>02</span><h2>Give it a name</h2></div><label className="w-field"><span>Name</span><input aria-label="Dot name" maxLength={10} value={name} onChange={event => setName(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} required placeholder="PIP" /></label></section><section><div className="w-create-section"><span>03</span><h2>Set its first task</h2></div><label className="w-field"><span>What should it watch?</span><textarea aria-label="First task" rows={3} value={text} maxLength={300} onChange={event => setText(event.target.value)} required placeholder="Watch my ETH portfolio" /></label><div className="w-presets">{TASK_PRESETS.map(preset => <button type="button" key={preset.label} onClick={() => setText(preset.text)}><SvgIcon name={preset.icon} size={14} />{preset.label}</button>)}</div><p className="w-create-skill"><SvgIcon name="zap" size={14} />{SKILL_NAMES[classified.skill]?.title ?? classified.skill} · {classified.cadence}</p>{!availableSkill(classified.skill) && <p className="w-notice"><SvgIcon name="shield-check" size={15} />Trading is unavailable. Choose a monitoring task instead.</p>}</section><div className="w-create-wallet"><SvgIcon name="wallet" size={18} /><span><strong>{wallet?.connected ? 'Public address linked' : 'Link a wallet (optional)'}</strong><small>You can create a Dot without a wallet.</small></span>{!wallet?.connected && <button type="button" className="pxbtn pxbtn-plain" onClick={() => walletModal.open()}>Connect</button>}{wallet?.connected && <SvgIcon name="check" size={17} />}</div>{full && <p className="w-error" role="alert">Your crew is full ({tier?.mates} Dots). <Link to="/app/settings">View workspace settings</Link></p>}{taskLimit && <p className="w-error" role="alert">Task limit reached. <Link to="/app/tasks">Pause a task</Link> to make room.</p>}{create.isError && <p className="w-error" role="alert">{create.error.message}</p>}<div>{preview.data?.text === text.trim() && <TaskPlanCard plan={preview.data} />}{preview.isError && <p className="w-error">{preview.error.message}</p>}</div><div className="w-create-submit"><Link className="pxbtn pxbtn-plain" to="/app">Cancel</Link><button type="submit" className="pxbtn" disabled={!valid || create.isPending || preview.isPending}>{create.isPending ? 'Creating…' : preview.data?.text === text.trim() ? `Create ${name || 'Dot'}` : 'Review task'}<SvgIcon name="arrow-right" size={15} /></button></div></form><aside className="w-create-preview"><div className="w-create-preview-label"><span>YOUR DOT</span><small>Drag to rotate</small></div><MateModel body={body} color={color} paused={create.isPending} className="creator-model" label={`${name || 'New Dot'} model preview. Drag to rotate.`} /><h2>{name || 'Your Dot'}</h2><p>{text || 'Your first task goes here.'}</p><div><SvgIcon name="shield-check" size={17} /><span>{!availableSkill(classified.skill) ? 'Choose a monitoring task.' : 'Saved when you confirm creation.'}<br />Your wallet stays yours.</span></div></aside></div></div>
}
