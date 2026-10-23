import { useSyncExternalStore } from 'react'
export function useWideScene() {
  return useSyncExternalStore(listener => { const media = matchMedia('(min-width: 901px) and (min-height: 650px)'); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener) }, () => matchMedia('(min-width: 901px) and (min-height: 650px)').matches, () => false)
}
