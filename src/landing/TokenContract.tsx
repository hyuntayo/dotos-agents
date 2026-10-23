import { useEffect, useState } from 'react'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CHAIN } from '../../shared/chain'
import './token-contract.css'

type Token = { symbol: 'DOTOS'; chain: 'robinhood'; chainId: number; address: string; explorerUrl: string }

export function TokenContract() {
  const [token, setToken] = useState<Token | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [copyErrorAddress, setCopyErrorAddress] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    let pending = false
    const update = async () => {
      if (document.hidden || pending) return
      pending = true
      try {
        const response = await fetch('/api/project', { cache: 'no-store', credentials: 'omit', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4000)]) })
        if (!response.ok) throw Error('Project information unavailable')
        const result = await response.json() as { token?: Partial<Token> | null }
        if (controller.signal.aborted) return
        if (result.token === null) { setToken(null); return }
        const value = result.token
        if (!value || value.symbol !== 'DOTOS' || value.chain !== 'robinhood' || value.chainId !== CHAIN.id || typeof value.address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value.address)) throw Error('Unverified contract')
        setToken({ symbol: 'DOTOS', chain: 'robinhood', chainId: CHAIN.id, address: value.address, explorerUrl: `${CHAIN.explorer}/address/${value.address}` })
      } catch { if (!controller.signal.aborted) setToken(null) }
      finally { pending = false }
    }
    void update()
    const timer = window.setInterval(() => void update(), 5000)
    const focus = () => { void update() }
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', focus)
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus) }
  }, [])
  if (!token) return null
  const copied = copiedAddress === token.address
  const copyError = copyErrorAddress === token.address
  const copy = async () => {
    try { await navigator.clipboard.writeText(token.address); setCopiedAddress(token.address); setCopyErrorAddress(null) }
    catch { setCopyErrorAddress(token.address) }
  }
  return <div className="token-contract" aria-label="$DOTOS contract address">
    <div className="token-contract-title"><strong>$DOTOS</strong><a href={token.explorerUrl} target="_blank" rel="noopener noreferrer">View on Robinhood Chain<SvgIcon name="arrow-up-right" size={13} /></a></div>
    <div className="token-contract-address"><code>{token.address}</code><button type="button" aria-label="Copy $DOTOS contract address" onClick={() => void copy()}><SvgIcon name={copied ? 'check' : 'copy'} size={16} /><span>{copied ? 'Copied' : 'Copy CA'}</span></button></div>
    <span className="sr-only" role="status">{copied ? 'Contract address copied.' : copyError ? 'Copy is unavailable. Select and copy the address above.' : ''}</span>
  </div>
}
