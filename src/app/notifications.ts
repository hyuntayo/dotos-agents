import { toast } from './toast'
import type { ActivityItem } from './api/types'
import { PUSH_KEY } from './push'

export const NOTIFICATION_KEY = 'dotmates.browser-notifications.v1'
export function deliverAlert(item: ActivityItem) {
  if (document.visibilityState === 'visible') toast({ kind: 'event', title: item.text, body: item.detail, mateId: item.mateId, to: '/app/activity' })
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && !localStorage.getItem(PUSH_KEY) && localStorage.getItem(NOTIFICATION_KEY) === 'on') {
      const key = `dotmates.alert-delivered.${item.id}`
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, String(Date.now()))
      const notification = new Notification(item.text, { body: item.detail, tag: item.id })
      notification.onclick = () => { window.focus(); window.location.assign('/app/activity'); notification.close() }
      const keys = Object.keys(localStorage).filter(key => key.startsWith('dotmates.alert-delivered.'))
      for (const key of keys) if (Number(localStorage.getItem(key)) < Date.now() - 7 * 86400000) localStorage.removeItem(key)
    }
  } catch { /* Persistent inbox delivery does not depend on browser permission or storage. */ }
}
