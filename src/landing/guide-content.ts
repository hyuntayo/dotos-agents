export const GUIDE_STORAGE_KEY = 'dotos.welcome-video.v12'
export const GUIDE_VIDEO = '/guide/dotos-intro-v12.mp4'
export const GUIDE_POSTER = '/guide/dotos-intro-v12.jpg'
export const GUIDE_PORTRAIT_VIDEO = '/guide/dotos-intro-portrait-v12.mp4'
export const GUIDE_PORTRAIT_POSTER = '/guide/dotos-intro-portrait-v12.jpg'
export const GUIDE_FPS = 60
export const GUIDE_VIDEO_SIZE = { width: 1920, height: 1080 } as const
export const GUIDE_PORTRAIT_VIDEO_SIZE = { width: 1080, height: 1920 } as const
export const GUIDE_CHAPTERS = [
  { start: 0, duration: 6, mate: 'bob', label: 'Meet DotOS', title: 'Your wallet.\nNow with an OS.', text: 'Create a Dot. Give it a responsibility.\nLet it take the next shift.' },
  { start: 6, duration: 6, mate: 'iggy', label: 'Choose a Dot', title: 'Pick your\nspecialist.', text: 'BOB: portfolios. MAX: Pons.\nIGGY: wallets. NOVA: creator fees.' },
  { start: 12, duration: 7, mate: 'max', label: 'Memory & Skills', title: 'A little context.\nThe right tools.', text: 'Save public wallets in Memory.\nEnable the monitoring Skills you need.' },
  { start: 19, duration: 8, mate: 'iggy', label: 'Responsibilities', title: 'Give your Dot\na responsibility.', text: 'Review a task. Set its token or public address,\na condition and a check interval.' },
  { start: 27, duration: 6, mate: 'nova', label: 'Activity & alerts', title: 'Less checking.\nClear signals.', text: 'Your Dot keeps checking on the server.\nRead matched rules in Activity and your inbox.' },
  { start: 33, duration: 7, mate: 'bob', label: 'Your system', title: 'Your rules.\nYour pace.', text: 'Pause or resume any responsibility.\nRead-only. Your keys stay in your wallet.' },
] as const
export const GUIDE_DURATION = 40
export function rememberGuide() {
  try { localStorage.setItem(GUIDE_STORAGE_KEY, 'done') } catch { /* Viewing does not require browser storage. */ }
}
