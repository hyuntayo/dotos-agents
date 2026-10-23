import { RuntimeUsage } from '../components/RuntimeUsage'
import { useState } from 'react'
import { WalletAccount } from '../components/WalletAccount'
import { NotificationSettings } from '../components/NotificationSettings'
import { RestoreWorkspace } from '../components/RestoreWorkspace'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useMode, setMode, MODES, PALETTES } from '@/pixel/theme'
import { useDisconnectWallet, useMates, useNetwork, useResponsibilities, useServerHealth, useTier, useWallet } from '../api/hooks'
import { api } from '../api/client'
import { Btn, CopyText, PageTitle, walletModal } from '../components/bits'
import { toast } from '../toast'

export function SettingsPage() {
  const { data: wallet } = useWallet()
  const { data: tier } = useTier()
  const { data: mates } = useMates()
  const { data: tasks } = useResponsibilities()
  const { data: network } = useNetwork()
  const health = useServerHealth()
  const disconnect = useDisconnectWallet()
  const mode = useMode()
  const [reset, setReset] = useState(false)
  const resetWorkspace = useMutation({ mutationFn: api.resetWorkspace, onSuccess: () => { setReset(false); toast({ kind: 'success', title: 'Workspace reset' }) } })
  const backup = useMutation({ mutationFn: async () => {
    const data = await api.exportWorkspace()
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `dotos-${new Date().toISOString().slice(0, 10)}.json`; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } })
  return <div className="stack">
    <PageTitle kicker="Settings" sub="Your wallet, appearance and saved workspace.">Settings</PageTitle>
    <section className="w-settings-card"><h2>Background monitoring</h2><p>{health.isPending ? 'Checking server status?' : health.isError ? 'Server status is unavailable.' : health.data?.monitoring ? 'Active tasks keep running on the server when the dashboard is closed.' : 'Background checks are disabled on this server.'}</p><div className="w-settings-row"><span><strong>{health.data?.runtime?.running ? 'Scheduler running' : health.isError ? 'Server unavailable' : 'Waiting for server status'}</strong><small>Robinhood Chain: ETH and configured ERC-20 balances, wallet transfers, Pons launches and fees. ETH/USD uses Coinbase.</small></span><Link to="/app/tasks">Configure tasks<SvgIcon name="arrow-up-right" size={14} /></Link></div>{Object.entries(health.data?.runtime?.providers ?? {}).filter(([, provider]) => provider.available === false).map(([name]) => <p className="w-error" key={name}>{name === 'robinhood' ? 'Robinhood Chain RPC' : name === 'prices' ? 'Price source' : 'Pons V2'} is temporarily unavailable. Checks retry automatically.</p>)}</section>
    <section className="w-settings-card"><h2>AI companions</h2><p>Your Dots use OpenRouter for conversations and task analysis.</p><div className="w-settings-row"><span><strong>{health.isPending ? 'Checking AI connection?' : health.isError ? 'Connection unavailable' : health.data?.ai?.configured ? 'OpenRouter configured' : 'OpenRouter · API key missing'}</strong>{health.data && !health.data.ai?.configured && <small>The site owner needs to finish the OpenRouter connection.</small>}</span>{mates?.[0] && <Link to={`/app/m/${mates[0].id}?tab=chat`}>Talk to {mates[0].name}<SvgIcon name="arrow-up-right" size={14} /></Link>}</div></section>
    <section className="w-settings-card"><h2>Workspace storage</h2><p>Your crew, tasks and preferences are saved on the server. Active read-only tasks are checked in the background.</p><div className="w-settings-row"><span><strong>{health.isError ? 'Server unavailable' : health.data ? 'Server connected' : 'Connecting…'}</strong><small>{health.isError ? health.error.message : 'Changes are saved automatically.'}</small></span><Btn tone="plain" disabled={backup.isPending || health.isError} onClick={() => backup.mutate()}>{backup.isPending ? 'Exporting…' : 'Export workspace'}</Btn></div><RestoreWorkspace />{api.migrationWarning() && <p className="w-error" role="alert">{api.migrationWarning()}</p>}</section>
    <RuntimeUsage /><WalletAccount /><NotificationSettings /><section className="w-settings-card"><h2>Public wallet address</h2><p>Link an address from your wallet extension. You can create Dots without a wallet.</p><div className="w-settings-row"><span><strong>{wallet?.connected ? 'Public address linked' : 'No address linked'}</strong>{wallet?.address ? <CopyText text={wallet.address} display={wallet.address} /> : <small>Your workspace uses this browser’s saved session.</small>}</span>{wallet?.connected ? <Btn tone="plain" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>{disconnect.isPending ? 'Unlinking…' : 'Unlink address'}</Btn> : <Btn onClick={() => walletModal.open()}>Link wallet</Btn>}</div></section>
    <div className="w-settings-grid"><section className="w-settings-card"><h2>Appearance</h2><p>Choose a look that feels comfortable.</p><div className="w-appearance">{MODES.map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}><SvgIcon name={value === 'night' ? 'moon' : value === 'day' ? 'sun' : 'blocks'} size={16} />{PALETTES[value].name}</button>)}</div></section><section className="w-settings-card"><h2>Your workspace</h2><p>Free workspace capacity</p><div className="w-settings-row"><span>Dots<small>{mates?.length ?? 0} of {tier?.mates ?? 0} used</small></span><Link to="/app/new">Add a Dot<SvgIcon name="arrow-up-right" size={14} /></Link></div><div className="w-settings-row"><span>Enabled tasks<small>{tasks?.filter(task => task.active).length ?? 0} of {tier?.responsibilities ?? 0} used</small></span><Link to="/app/tasks">Manage tasks<SvgIcon name="arrow-up-right" size={14} /></Link></div></section></div>
    <section className="w-settings-card"><h2>Workspace totals</h2><table className="kv"><tbody>{network && [['Awake Dots', network.active], ['Enabled tasks', network.responsibilities], ['Checks completed', network.tasks], ['Enabled skills', network.skills]].map(([key, value]) => <tr key={key}><th>{key}</th><td>{Number(value).toLocaleString('en-US')}</td></tr>)}</tbody></table></section>
    <section className="w-settings-card"><h2>Access & privacy</h2><p>Read how browser sessions, wallet sign-in and AI conversations use your data.</p><Link to="/privacy">View access & privacy<SvgIcon name="arrow-up-right" size={14} /></Link></section>
    <section className="w-settings-card"><h2>Reset workspace</h2><p>Restore the original four characters with no tasks. Your appearance and linked public address are kept.</p><div className="w-settings-row">{reset ? <div className="w-inline-confirm"><span>This deletes this workspace’s crew, tasks and history.</span><button type="button" className="pxbtn pxbtn-plain" disabled={resetWorkspace.isPending} onClick={() => setReset(false)}>Cancel</button><button type="button" className="w-danger-button" disabled={resetWorkspace.isPending} onClick={() => resetWorkspace.mutate()}>{resetWorkspace.isPending ? 'Resetting…' : 'Reset workspace data'}</button></div> : <button type="button" className="w-danger-button" onClick={() => setReset(true)}>Reset workspace…</button>}</div></section>
  </div>
}
