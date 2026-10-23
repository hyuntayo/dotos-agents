import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Btn } from './bits'
export function RuntimeUsage() {
  const state = useQuery({ queryKey: ['runtime-usage'], queryFn: api.runtimeUsage, refetchInterval: 30000 })
  const archive = useMutation({ mutationFn: async () => {
    const value = await api.exportLegacy()
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'dotos-solana-archive.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } })
  const d = state.data
  return <section className="w-settings-card"><h2>Network & usage</h2><p>Robinhood Chain · Read-only monitoring</p>{d && <table className="kv"><tbody>{[['Access', 'Free · 6 Dots / 40 tasks'], ['AI requests today', `${d.usage[d.day]?.aiRequests ?? 0} in this workspace · ${d.aiSharedDailyLimit}/day shared across the site`], ['Successful checks', d.checks], ['Alerts', d.alerts]].map(([key, value]) => <tr key={key}><th>{key}</th><td>{value}</td></tr>)}</tbody></table>}{d?.legacyArchived && <div className="w-settings-row"><span><strong>Previous Solana workspace preserved</strong><small>Its tasks, memory and history are archived. New tasks run on Robinhood Chain.</small></span><Btn tone="plain" disabled={archive.isPending} onClick={() => archive.mutate()}>Export old workspace</Btn></div>}{(state.isError || archive.isError) && <p className="w-error">{state.error?.message ?? archive.error?.message}</p>}</section>
}
