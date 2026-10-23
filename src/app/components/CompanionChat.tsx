import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import type { MateView } from '../api/types'
import { api } from '../api/client'
import { useMessages, useSendMessage, useServerHealth } from '../api/hooks'
import { Avatar, Btn } from './bits'
import './companion-chat.css'

export function CompanionChat({ mate }: { mate: MateView }) {
  const history = useMessages(mate.id)
  const health = useServerHealth()
  const send = useSendMessage(mate.id)
  const [draft, setDraft] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const log = useRef<HTMLDivElement>(null)
  const clear = useMutation({ mutationFn: () => api.clearMessages(mate.id), onSuccess: () => { setConfirmClear(false); send.reset() } })
  const configured = health.data?.ai?.configured === true
  const busy = send.isPending || clear.isPending
  const canSend = configured && !mate.paused && !busy && !!draft.trim()
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight }, [history.data?.length, send.isPending])
  const submit = () => { if (canSend) send.mutate(draft.trim(), { onSuccess: () => setDraft('') }) }
  const prompts = ['Help me with my saved tasks', 'Explain the risks I should watch for', 'What information do you need from me?']

  return <section className="w-companion-chat" aria-label={`Chat with ${mate.name}`}>
    <header className="w-chat-header"><div><Avatar mate={mate} still /><span><strong>Talk to {mate.name}</strong><small>{configured ? 'Powered by OpenRouter' : 'OpenRouter · connection pending'}</small></span></div>{!!history.data?.length && <Btn tone="plain" disabled={busy} onClick={() => setConfirmClear(true)}>Clear conversation</Btn>}</header>
    {!health.isLoading && !configured && <p className="w-notice"><SvgIcon name="plug" size={17} />OpenRouter needs an API key before your Dots can reply. <Link to="/app/settings">Connection settings</Link></p>}
    {mate.paused && <p className="w-notice">Resume {mate.name} to continue the conversation.</p>}
    {confirmClear && <div className="w-inline-confirm"><span>Clear this conversation?</span><Btn tone="plain" onClick={() => setConfirmClear(false)}>Keep it</Btn><Btn disabled={busy} onClick={() => clear.mutate()}>Clear history</Btn></div>}
    <div className="w-chat-log" ref={log} role="log" aria-live="polite" aria-label={`${mate.name} conversation`}>
      {history.isLoading ? <p className="w-chat-empty">Loading your conversation…</p> : !history.data?.length ? <div className="w-chat-empty"><SvgIcon name="robot-face" size={32} /><h3>A conversation with {mate.name}.</h3><p>Ask a question or work through a task. {mate.name} remembers your saved assets, rules and previous messages.</p><div className="w-chat-prompts">{prompts.map(prompt => <button type="button" key={prompt} disabled={busy} onClick={() => setDraft(prompt)}>{prompt}</button>)}</div></div> : history.data.map(message => <article key={message.id} className={`w-chat-message is-${message.role}`}><span className="w-chat-author">{message.role === 'user' ? 'You' : mate.name}{message.taskId && <small> · Task analysis</small>}</span><p>{message.content}</p></article>)}
      {send.isPending && <div className="w-chat-thinking" role="status"><i /><i /><i /><span>{mate.name} is thinking…</span></div>}
    </div>
    {(send.isError || history.isError || clear.isError) && <p className="w-error" role="alert">{send.error?.message ?? history.error?.message ?? clear.error?.message}</p>}
    <form className="w-chat-composer" onSubmit={event => { event.preventDefault(); submit() }}>
      <label className="sr-only" htmlFor={`chat-${mate.id}`}>Message to {mate.name}</label>
      <textarea id={`chat-${mate.id}`} placeholder={`Ask ${mate.name} anything about your tasks…`} maxLength={2000} rows={3} value={draft} disabled={busy || mate.paused} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit() } }} />
      <div><small>Enter to send · Shift + Enter for a new line</small><button className="pxbtn" type="submit" disabled={!canSend}>{send.isPending ? 'Thinking…' : 'Send message'}<SvgIcon name="arrow-up-right" size={15} /></button></div>
    </form>
    <p className="w-chat-footnote">AI replies use your saved context. Live market data and blockchain actions are not connected.</p>
  </section>
}
