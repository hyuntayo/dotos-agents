/* Notification delivery only: no request interception or offline app cache. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {}
    try { payload = event.data?.json() ?? {} } catch { /* Empty push also opens the inbox. */ }
    await self.registration.showNotification('DotOS alert', {
      body: 'A monitoring rule matched. Open your inbox.',
      tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 64) : 'dotos-alert',
      icon: '/brand/dotos-pfp.png', data: { url: '/app/activity' },
    })
  })())
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const workspace = windows.find(client => new URL(client.url).origin === self.location.origin && /^\/app(?:\/|$)/.test(new URL(client.url).pathname))
    if (workspace) { await workspace.navigate('/app/activity'); await workspace.focus() }
    else await self.clients.openWindow('/app/activity')
  })())
})
