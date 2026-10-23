import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn } from './bits'
import { api } from '../api/client'
import { currentPush, disablePush, enablePush, rememberPush, supportsPush } from '../push'
import { NOTIFICATION_KEY } from '../notifications'

export function NotificationSettings() {
  const qc = useQueryClient()
  const [permission, setPermission] = useState(typeof Notification === 'undefined' ? 'unavailable' : Notification.permission)
  const available = supportsPush()
  const status = useQuery({ queryKey: ['push-settings'], queryFn: async () => {
    const [status, current] = await Promise.all([api.pushStatus(), currentPush()])
    const device = status.subscriptions.find(item => item.id === current?.id)
    rememberPush(device?.id ?? null)
    return { ...status, device }
  } })
  const toggle = useMutation({ mutationFn: async () => {
    if (status.data?.device) await disablePush()
    else if (status.data?.publicKey) await enablePush(status.data.publicKey)
    try { localStorage.removeItem(NOTIFICATION_KEY) } catch { /* Retire the old open-tab notification mode. */ }
    setPermission(Notification.permission)
  }, onSettled: () => { void qc.invalidateQueries({ queryKey: ['push-settings'] }); if (typeof Notification !== 'undefined') setPermission(Notification.permission) } })
  return <section className="w-settings-card"><h2>Notifications</h2><p>Alerts are always saved in your inbox.</p><div className="w-settings-row"><span><strong>Background notifications</strong><small>{!available ? 'Use a browser that supports Web Push. On iPhone, add this site to your Home Screen.' : permission === 'denied' ? 'Allow notifications in your browser settings.' : status.isError ? 'Could not load notification settings. Try again.' : status.data?.device ? 'Enabled on this browser, including when the tab is closed.' : status.data?.configured ? 'Get alerts when this tab is closed.' : status.isLoading ? 'Checking notification service…' : 'Notification service is unavailable.'}</small>{status.data?.device?.error && <small>{status.data.device.error}</small>}</span><Btn tone="plain" disabled={!available || !status.data?.configured || permission === 'denied' || toggle.isPending} onClick={() => toggle.mutate()}>{toggle.isPending ? 'Saving…' : status.data?.device ? 'Disable notifications' : 'Enable notifications'}</Btn></div>{toggle.isError && <p className="w-error" role="alert">{toggle.error.message}</p>}</section>
}
