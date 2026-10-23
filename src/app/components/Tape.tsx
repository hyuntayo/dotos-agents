import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { shortAddr, useNow } from '@/lib/hooks'
import { ago, clock } from '@/lib/time'
import { SvgIcon } from '@/components/icons/SvgIcon'
import type { ActivityItem, MateView } from '../api/types'
import { Avatar, CopyText, Empty, KIND, Skeleton } from './bits'

function EventRow({ item: a, mate: m, showMate, now }: { item: ActivityItem; mate?: MateView; showMate: boolean; now: number }) {
  const [open, setOpen] = useState(false)
  const kind = KIND[a.kind]
  const hasDetail = !!(a.detail || a.sig)
  return <>
    <motion.tr className={cn('event-row', a.kind === 'approval' && 'is-ask', open && 'row-expanded')} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      <td className="table-number event-time"><time dateTime={new Date(a.at).toISOString()} title={ago(a.at, now)}>{clock(a.at)}</time></td>
      {showMate && <td>{m ? <Link to={`/app/m/${m.id}`} className="table-avatar"><Avatar mate={m} scale={1} still /><span>{m.name}</span></Link> : '—'}</td>}
      <td className="event-summary">{a.text}</td>
      <td className="event-type"><span className="event-type-label" style={{ color: kind.color }}>{kind.label}</span></td>
      <td className="event-disclosure">{hasDetail && <button type="button" aria-label={`Details: ${a.text}`} aria-expanded={open} aria-controls={`event-${a.id}`} onClick={() => setOpen(!open)}><SvgIcon name="chevron-down" size={14} /></button>}</td>
    </motion.tr>
    {open && <tr className="event-detail-row" id={`event-${a.id}`}><td colSpan={showMate ? 5 : 4}><motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}><span>{a.detail}</span>{a.sig && <CopyText text={a.sig} display={`tx ${shortAddr(a.sig, 5)}`} />}</motion.div></td></tr>}
  </>
}

export function Tape({ items, mates, showMate = true, loading = false, className, max }: { items: ActivityItem[] | undefined; mates?: MateView[]; showMate?: boolean; loading?: boolean; className?: string; max?: number }) {
  const now = useNow(5000)
  const byId = new Map(mates?.map(m => [m.id, m]))
  const list = max ? items?.slice(0, max) : items
  return <div className={cn('log data-log', className)}>
    {loading && !items && <div className="log-skel">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>}
    {!loading && !list?.length && <Empty icon="bulletlist" title="No activity" text="" />}
    {!!list?.length && <div className="data-table-wrap"><table className="data-table event-table"><thead><tr><th className="event-time">Time</th>{showMate && <th>Mate</th>}<th>Event</th><th className="event-type">Type</th><th><span className="sr-only">Details</span></th></tr></thead><tbody><AnimatePresence initial={false}>{list.map(a => <EventRow key={a.id} item={a} mate={byId.get(a.mateId)} showMate={showMate} now={now} />)}</AnimatePresence></tbody></table></div>}
  </div>
}
