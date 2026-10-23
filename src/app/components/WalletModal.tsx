import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { Icon } from '@/components/icons/Icon'
import { MateSprite } from '@/pixel/sprites/Sprite'
import type { WalletProvider } from '../api/types'
import { useConnectWallet } from '../api/hooks'
import { Stamp, useWalletModal, walletModal } from './bits'

export const WALLETS: { id: WalletProvider; name: string; note: string }[] = [
  { id: 'metamask', name: 'MetaMask', note: 'EVM wallet' },
  { id: 'rabby', name: 'Rabby', note: 'EVM wallet' },
  { id: 'coinbase', name: 'Coinbase Wallet', note: 'EVM wallet' },
]

export function WalletModal() {
  const open = useWalletModal()
  const connect = useConnectWallet()
  const [publicAddress, setPublicAddress] = useState('')
  const link = useMutation({ mutationFn: () => api.linkPublicAddress(publicAddress), onSuccess: () => walletModal.close() })
  const [chosen, setChosen] = useState<WalletProvider | null>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>('button')?.focus())
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]') ?? [])
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setChosen(null)
      connect.reset()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && walletModal.close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (connect.isSuccess) {
      const t = window.setTimeout(() => walletModal.close(), 1300)
      return () => window.clearTimeout(t)
    }
  }, [connect.isSuccess])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="modal-scrim" onClick={() => walletModal.close()} />
          <motion.div ref={dialog} role="dialog" aria-modal aria-label="Connect a wallet" className="modal" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }}>
            <button type="button" onClick={() => walletModal.close()} className="modal-x" aria-label="Close">
              <Icon name="close" size={12} />
            </button>
            <div className="modal-head">
              <MateSprite mate="bob" scale={3} expr={connect.isSuccess ? 'happy' : connect.isPending ? 'working' : 'idle'} />
              <div>
                <div className="tiny">Step zero</div>
                <h2>Link your wallet</h2>
              </div>
            </div>
            <p>Choose your installed wallet extension to save its public address. Linking an address is optional.</p>
            <div className="wallets">
              {WALLETS.map((w) => {
                const active = chosen === w.id
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={connect.isPending || connect.isSuccess}
                    onClick={() => {
                      setChosen(w.id)
                      connect.mutate(w.id)
                    }}
                    className={cn('wallet', active && 'on', connect.isPending && !active && 'dim')}
                  >
                    <span className="wallet-logo">
                      <SvgIcon name="wallet" size={26} />
                    </span>
                    <b>{w.name}</b>
                    <span className="tiny">{active && connect.isPending ? 'connectingвЂ¦' : active && connect.isSuccess ? 'connected' : w.note}</span>
                  </button>
                )
              })}
            </div>
            <form className="stack-sm" onSubmit={event => { event.preventDefault(); link.mutate() }}><label className="w-field"><span>Or watch a public EVM address</span><input aria-label="Public EVM address" placeholder="0x..." value={publicAddress} onChange={event => setPublicAddress(event.target.value)} required pattern="0x[0-9a-fA-F]{40}" /></label><button className="pxbtn pxbtn-plain" disabled={link.isPending}>Watch address</button>{link.isError && <p className="w-error" role="alert">{link.error.message}</p>}</form>
            {connect.isSuccess && <Stamp kind="approved" className="modal-stamp" />}
            {connect.isError && <p className="w-error" role="alert">{connect.error.message}</p>}
            <p className="tiny modal-foot">Your session stays in this browser. No transaction is requested.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
