import { useEffect } from 'react'

export function usePageMetadata(path: string, index = true) {
  useEffect(() => {
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const previous = canonical?.href
    if (canonical) canonical.href = `https://dotos.si${path}`
    const robots = document.createElement('meta')
    robots.name = 'robots'; robots.content = index ? 'index,follow' : 'noindex,nofollow'
    document.head.appendChild(robots)
    return () => { robots.remove(); if (canonical && previous) canonical.href = previous }
  }, [path, index])
}
