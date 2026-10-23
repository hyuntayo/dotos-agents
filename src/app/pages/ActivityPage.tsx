import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { ago } from '@/lib/time'
import { useNow } from '@/lib/hooks'
import { useActivity, useMates } from '../api/hooks'
import { Avatar, Btn, CopyText, PageTitle, Skeleton } from '../components/bits'
import { markAlertsRead, useReadAlerts } from '../inbox'

export function ActivityPage() {
  const { data: mates } = useMates()
  const { data: items, isLoading } = useActivity(undefined, 1000)
  const [params] = useSearchParams()
  const [view, setView] = useState<'alerts' | 'unread' | 'activity'>(() => params.get('view') === 'unread' ? 'unread' : 'alerts')
  const [owner, setOwner] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(() => params.get('alert'))
  const revealed = useRef<string | null>(null)
  const seen = useReadAlerts()
  const now = useNow(30_000)
  const alerts = items?.filter(item => item.kind === 'event') ?? []
  const unread = alerts.filter(item => !seen.has(item.id))
  const filtered = items?.filter(item => (view === 'activity' || item.kind === 'event') && (view !== 'unread' || !seen.has(item.id) || item.id === selected) && (owner === 'all' || item.mateId === owner) && `${item.text} ${item.detail ?? ''}`.toLowerCase().includes(search.toLowerCase())) ?? []
  useEffect(() => {
    if (!selected || !items?.some(item => item.id === selected)) return
    if (items.find(item => item.id === selected)?.kind === 'event') markAlertsRead([selected])
    if (revealed.current === selected) return
    revealed.current = selected
    const frame = requestAnimationFrame(() => document.getElementById(`alert-${selected}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [selected, items])
  return <div className="stack"><PageTitle kicker="Alerts" sub="Important changes from your Dots, all in one place." right={<Btn tone="plain" onClick={() => markAlertsRead(filtered.filter(item => item.kind === 'event').map(item => item.id))}><SvgIcon name="check-check" size={15} />Mark as read</Btn>}>Your inbox</PageTitle><div className="w-filter-tabs" aria-label="Inbox views">{([{ id: 'alerts', label: 'All alerts', count: alerts.length }, { id: 'unread', label: 'Unread', count: unread.length }, { id: 'activity', label: 'All activity', count: null }] as const).map(tab => <button type="button" key={tab.id} aria-pressed={view === tab.id} onClick={() => { setView(tab.id); setSelected(null) }}>{tab.label}{tab.count !== null && <small>{tab.count}</small>}</button>)}</div><div className="w-task-filterbar"><label className="w-search"><SvgIcon name="scan-eye" size={16} /><input type="search" aria-label="Search alerts" placeholder="Search alerts…" value={search} onChange={event => setSearch(event.target.value)} /></label><select className="w-filter-select" aria-label="Filter alerts by Dot" value={owner} onChange={event => setOwner(event.target.value)}><option value="all">All Dots</option>{mates?.map(mate => <option key={mate.id} value={mate.id}>{mate.name}</option>)}</select></div>{isLoading ? <Skeleton className="h-[260px]" /> : !filtered.length ? <div className="w-empty"><SvgIcon name="check-check" size={28} /><h3>{search || owner !== 'all' ? 'No matching alerts.' : view === 'unread' ? 'You’re all caught up.' : 'Nothing here yet.'}</h3><p>{view === 'unread' && !search ? 'Your Dots will alert you when a monitoring rule matches.' : 'Choose All activity to see your saved workspace changes.'}</p>{view === 'unread' && <Btn tone="plain" onClick={() => setView('alerts')}>View all alerts</Btn>}</div> : <ul className="w-alert-list">{filtered.map(item => {
    const mate = mates?.find(candidate => candidate.id === item.mateId)
    const isUnread = item.kind === 'event' && !seen.has(item.id)
    const expanded = selected === item.id
    return <li key={item.id} id={`alert-${item.id}`} className={`${isUnread ? 'is-unread' : ''} ${expanded ? 'is-expanded' : ''}`}><button type="button" className="w-alert-open" aria-expanded={expanded} aria-controls={`alert-detail-${item.id}`} onClick={() => setSelected(expanded ? null : item.id)}>{mate && <Avatar mate={mate} scale={3} still />}<span className="w-alert-content"><span className="w-alert-meta"><strong>{mate?.name}</strong><span>{item.kind === 'event' ? 'Alert' : item.kind === 'check' ? 'Check' : item.kind === 'approval' ? 'Request' : item.kind === 'action' ? 'Action' : 'Update'}</span><time dateTime={new Date(item.at).toISOString()}>{ago(item.at, now)}</time></span><strong>{item.text}</strong></span>{isUnread && <i className="w-unread-dot" />}<SvgIcon name="chevron-down" size={16} /></button>{expanded && <div className="w-alert-detail" id={`alert-detail-${item.id}`}><p>{item.detail ?? 'Your Dot detected a change that matched its task.'}</p>{item.sig && <div><span>Confirmed transaction</span><CopyText text={item.sig} display="Copy transaction signature" /></div>}<div className="w-alert-detail-actions"><Link className="pxbtn pxbtn-plain" to={`/app/m/${item.mateId}`}>Open {mate?.name ?? 'Dot'}<SvgIcon name="arrow-up-right" size={14} /></Link><small>{item.kind === 'event' ? 'Marked as read' : 'Workspace activity'}</small></div></div>}</li>
  })}</ul>}</div>
}
