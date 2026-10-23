import { useSyncExternalStore } from 'react'

const query = '(max-aspect-ratio: 1/1)'
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
export function usePortraitVideo() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
