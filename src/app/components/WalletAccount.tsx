import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAccount } from '../api/hooks'
import { Btn } from './bits'
import type { WalletProvider } from '../api/types'

export function WalletAccount() {
  const account = useAccount()
  const signIn = useMutation({ mutationFn: (provider: WalletProvider) => api.signIn(provider), retry: false, onSuccess: () => window.location.assign('/app') })
  const legacy = useMutation({ mutationFn: api.recoverLegacy, onSuccess: () => window.location.assign('/app') })
  const logout = useMutation({ mutationFn: api.signOut, onSuccess: () => window.location.assign('/app') })
  return <section className="w-settings-card"><h2>Sign in & recover</h2><p>Sign a message with your wallet to keep this workspace available on another browser or device.</p>
    {account.data?.authenticated ? <div className="w-settings-row"><span><strong>Wallet account verified</strong><small>{account.data.address}</small></span><Btn tone="plain" disabled={logout.isPending} onClick={() => logout.mutate()}>Sign out</Btn></div> : <div className="row-btns">{(['metamask', 'rabby', 'coinbase'] as const).map(provider => <Btn key={provider} tone="plain" disabled={signIn.isPending} onClick={() => signIn.mutate(provider)}>{signIn.isPending && signIn.variables === provider ? 'Waiting for signature…' : `Sign in with ${provider[0].toUpperCase() + provider.slice(1)}`}</Btn>)}</div>}
    {(signIn.isError || logout.isError || account.isError) && <p className="w-error" role="alert">{signIn.error?.message ?? logout.error?.message ?? account.error?.message}</p>}
    <details><summary>Recover a previous Solana workspace</summary><p>Use the old Phantom wallet, then link an EVM account to the recovered workspace. Old tasks are available as an archive in Settings.</p><Btn tone="plain" disabled={legacy.isPending} onClick={() => legacy.mutate()}>Recover with Phantom</Btn>{legacy.isError && <p className="w-error">{legacy.error.message}</p>}</details>
    <p><small>The same wallet restores its existing workspace. A signature verifies ownership; it does not send a transaction.</small></p>
  </section>
}
