import { api } from './api/client'

export const PUSH_KEY = 'dotos.push-subscription.v1'
export const supportsPush = () => window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const bounded = <T,>(promise: Promise<T>, timeout = 25000): Promise<T> => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error('Could not reach your browser’s notification service. Check the connection and try again.')), timeout)
  promise.then(value => { clearTimeout(timer); resolve(value) }, error => { clearTimeout(timer); reject(error) })
})
export const endpointId = async (endpoint: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)))].map(value => value.toString(16).padStart(2, '0')).join('')
export function rememberPush(id: string | null) { try { if (id) localStorage.setItem(PUSH_KEY, id); else localStorage.removeItem(PUSH_KEY) } catch { /* Browser cache is optional. */ } }
export async function currentPush() {
  if (!supportsPush()) return null
  const registration = await navigator.serviceWorker.getRegistration('/app')
  const subscription = await registration?.pushManager.getSubscription()
  return subscription ? { subscription, id: await endpointId(subscription.endpoint) } : null
}
export async function syncPush() {
  if (!supportsPush()) return
  const current = await currentPush()
  if (!current) { rememberPush(null); return }
  const status = await api.pushStatus()
  rememberPush(status.subscriptions.some(item => item.id === current.id) ? current.id : null)
}
export async function enablePush(publicKey: string) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to enable alerts.')
  await bounded(navigator.serviceWorker.register('/notification-worker.js', { scope: '/app' }), 10000)
  const registration = await bounded(navigator.serviceWorker.ready, 10000)
  const bytes = Uint8Array.from(atob(publicKey.replaceAll('-', '+').replaceAll('_', '/')), value => value.charCodeAt(0))
  const previous = await registration.pushManager.getSubscription()
  const subscription = previous ?? await bounded(registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes }))
  const saved = await api.subscribePush(subscription.toJSON())
  rememberPush(saved.id)
  return saved.id
}
export async function disablePush() {
  const current = await currentPush()
  if (current) { await api.unsubscribePush(current.id); await current.subscription.unsubscribe() }
  rememberPush(null)
}
