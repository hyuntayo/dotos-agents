import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

// Motion's current hook reads this setting at mount; the background also reacts
// when the user changes the system preference while the page remains open.
export function useReducedAnimation() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true)
}
