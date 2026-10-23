import { CHAIN } from '../../../shared/chain'

type Total = { recipient: string; currency: string; symbol?: string; credited?: string; claimed?: string; creditedRaw: string; claimedRaw: string }
type Entry = { key: string; event: string; sig: string; blockNumber: number; token?: string; recipient?: string; currency?: string; amount?: string; amountRaw?: string; symbol?: string; origin?: string }
type History = { version: number; fromBlock: number; cursor: number; eventCount: number; totals: Total[]; recent: Entry[] }
const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`
const amount = (value: string) => value.length <= 12 ? value : `≈${new Intl.NumberFormat('en', { maximumSignificantDigits: 6, notation: Number(value) >= 1e6 || Number(value) > 0 && Number(value) < 1e-6 ? 'scientific' : 'standard' }).format(Number(value))}`
const label = (event: string) => ({ Credited: 'Credited', CreditedToken: 'Credited', Claimed: 'Claimed', ClaimedToken: 'Claimed', TokenLaunched: 'Launched', PoolGraduated: 'Graduated' })[event] ?? event

export function PonsHistory({ snapshot, fees, catchingUp }: { snapshot: unknown; fees: boolean; catchingUp?: boolean }) {
  const history = (snapshot as { history?: History } | undefined)?.history
  if (history?.version !== 1 || !Array.isArray(history.recent) || !Array.isArray(history.totals)) return null
  return <div className="w-pons-history stack-sm">
    <h4>{fees ? 'Escrow history' : 'Launch history'}</h4>
    <p><small>{history.cursor < history.fromBlock ? `Watching from block ${history.fromBlock}` : `Blocks ${history.fromBlock}–${history.cursor}`} · {history.eventCount} events{catchingUp ? ' · catching up' : ''}</small></p>
    {fees && <p><small>Per recipient and asset, across launches. Credits may include other deposits. Totals cover this tracking period.</small></p>}
    {fees && history.totals.length > 0 && <details open><summary>Credited / claimed</summary><div className="data-table-wrap"><table className="data-table">
      <thead><tr><th scope="col">Recipient</th><th scope="col">Asset</th><th scope="col">Credited</th><th scope="col">Claimed</th></tr></thead>
      <tbody>{history.totals.map(row => <tr key={`${row.recipient}:${row.currency}`}>
        <td><a href={`${CHAIN.explorer}/address/${row.recipient}`} target="_blank" rel="noreferrer" title={row.recipient}>{short(row.recipient)}</a></td>
        <td>{row.currency === '0x0000000000000000000000000000000000000000' ? 'ETH' : <a href={`${CHAIN.explorer}/token/${row.currency}`} target="_blank" rel="noreferrer" title={row.currency}>{row.symbol ?? short(row.currency)}</a>}</td>
        <td title={row.credited ?? row.creditedRaw}>{row.credited !== undefined ? amount(row.credited) : `${row.creditedRaw} raw`}</td><td title={row.claimed ?? row.claimedRaw}>{row.claimed !== undefined ? amount(row.claimed) : `${row.claimedRaw} raw`}</td>
      </tr>)}</tbody>
    </table></div></details>}
    {history.recent.length ? <div className="data-table-wrap"><table className="data-table">
      <caption className="sr-only">Latest Pons events</caption>
      <thead><tr><th scope="col">Event</th><th scope="col">{fees ? 'Amount' : 'Token'}</th><th scope="col">Transaction</th></tr></thead>
      <tbody>{history.recent.slice(-8).reverse().map(row => <tr key={row.key}>
        <td>{label(row.event)}<small className="w-task-meta">Block {row.blockNumber}{row.origin === 'Other depositor' ? ' · other deposit' : ''}</small></td>
        <td title={row.amount ?? row.amountRaw}>{fees ? row.amount ? `${amount(row.amount)} ${row.symbol}` : `${row.amountRaw} raw` : <a href={`${CHAIN.explorer}/token/${row.token}`} target="_blank" rel="noreferrer" title={row.token}>{short(row.token ?? '')}</a>}</td>
        <td><a href={`${CHAIN.explorer}/tx/${row.sig}`} target="_blank" rel="noreferrer" aria-label={`View ${label(row.event).toLowerCase()} transaction at block ${row.blockNumber}`}>{short(row.sig)}</a></td>
      </tr>)}</tbody>
    </table></div> : <p><small>No events recorded in this tracking period yet.</small></p>}
  </div>
}
