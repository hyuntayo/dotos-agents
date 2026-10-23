import { useState } from 'react'

export function useStartupVideo() {
  const [open, setVisible] = useState(() => document.documentElement.dataset.startupStage === 'video')
  const setOpen = (next: boolean, destination?: 'workspace') => {
    setVisible(next)
    if (!next && document.documentElement.dataset.startupStage === 'video') {
      // Only the initial film hands off to loading. Manual replays just close.
      document.dispatchEvent(new Event(destination === 'workspace' ? 'dotos:startup-cancel' : 'dotos:intro-complete'))
    }
  }
  return [open, setOpen] as const
}
