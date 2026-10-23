import { Suspense, useEffect, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import '@/pixel/pixel.css'
import './app.css'
import './workspace.css'
import './os-workspace.css'
import './brand-workspace.css'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { DotOSMark, DotOSWordmark } from '@/components/brand/DotOSBrand'
import { shortAddr } from '@/lib/hooks'
import { usePageMetadata } from '@/lib/usePageMetadata'
import { paletteStyle, usePageChrome } from '@/pixel/chrome'
import { useMode } from '@/pixel/theme'
import { Splash } from '@/pages/Splash'
import { useActivity, useMates, useResponsibilities, useRuntimeSync, useServerHealth, useWallet } from './api/hooks'
import { useReadAlerts } from './inbox'
import { taskStatus } from './presentation'
import { AppDialog } from './components/AppDialog'
import { Avatar, walletModal } from './components/bits'
import { TaskComposer } from './components/TaskComposer'
import { Toasts } from './components/Toasts'
import { WalletModal } from './components/WalletModal'
import { DashboardGuide } from './components/DashboardGuide'
import { useQuery } from '@tanstack/react-query'
import { api } from './api/client'
import { toast } from './toast'

const NAV = [
  { to: '/app', label: 'Overview', icon: 'blocks', end: true },
  { to: '/app/tasks', label: 'Responsibilities', icon: 'repeat-2', end: false },
  { to: '/app/activity', label: 'Activity', icon: 'activity', end: false },
  { to: '/app/skills', label: 'Skills', icon: 'zap', end: false },
  { to: '/docs', label: 'Docs', icon: 'book-open', end: false },
]
function Logo() { return <Link to="/" className="workspace-logo" aria-label="DotOS home"><DotOSWordmark /></Link> }
function Navigation({ unread, close }: { unread: number; close?: () => void }) {
  const { data: mates } = useMates(), { data: tasks } = useResponsibilities()
  const health = useServerHealth()
  return <div className="workspace-navigation"><div className="os-space-label"><span>PERSONAL SPACE</span><i>01</i></div><nav aria-label="Workspace">{NAV.map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={close} className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}><SvgIcon name={item.icon} size={18} /><span>{item.label}</span>{item.to === '/app/activity' && unread > 0 && <small className="workspace-nav-count">{unread}</small>}</NavLink>)}</nav><div className="workspace-crew-heading"><span>Your Dots</span><Link to="/app/new" onClick={close} aria-label="Add Dot" title="Add Dot"><SvgIcon name="plus" size={15} /></Link></div><nav className="workspace-crew" aria-label="Your Dots">{mates?.map(mate => <NavLink key={mate.id} to={`/app/m/${mate.id}`} onClick={close} className={({ isActive }) => `workspace-mate-link ${isActive ? 'is-active' : ''}`}><Avatar mate={mate} scale={2} still /><span><strong>{mate.name}</strong><small>{mate.paused ? 'Sleeping' : tasks?.some(task => task.mateId === mate.id && taskStatus(task, mate).enabled) ? 'On duty' : 'Ready when you are'}</small></span><i className={mate.paused ? 'is-paused' : ''} /></NavLink>)}</nav><div className="workspace-nav-bottom"><div className="os-runtime-note"><span><DotOSMark size={17} />DOTOS RUNTIME</span><strong><i />{health.data?.runtime?.running ? 'Watching in the background' : health.isError ? 'Connection interrupted' : 'Connecting to your system'}</strong><p>Your Dots keep their shift.</p></div><NavLink to="/app/settings" onClick={close} className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}><SvgIcon name="settings-2" size={17} /><span>System settings</span></NavLink></div></div>
}
function CommandPalette({ open, close }: { open: boolean; close: () => void }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate(), { data: mates } = useMates(), { data: tasks } = useResponsibilities()
  const commands = [...NAV.map(item => ({ label: item.label, detail: 'Open page', to: item.to, icon: item.icon })), { label: 'Create a Dot', detail: 'New personal agent', to: '/app/new', icon: 'plus' }, { label: 'System settings', detail: 'Wallet, appearance & access', to: '/app/settings', icon: 'settings-2' }, ...(mates ?? []).map(item => ({ label: item.name, detail: item.role, to: `/app/m/${item.id}`, icon: 'bot' })), ...(tasks ?? []).map(item => ({ label: item.text, detail: 'Responsibility', to: `/app/tasks?q=${encodeURIComponent(item.text)}`, icon: 'repeat-2' }))]
  const visible = commands.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(search.toLowerCase())).slice(0,10)
  return <AppDialog open={open} onClose={close} title="Find in DotOS" className="os-command-dialog"><div className="os-command-search"><SvgIcon name="scan-eye" size={19} /><input type="search" aria-label="Search pages, Dots and responsibilities" placeholder="Pages, Dots, responsibilities…" value={search} onChange={event => setSearch(event.target.value)} autoFocus /></div><div className="os-command-results">{visible.length ? visible.map(item => <button type="button" key={item.to + item.label} onClick={() => { navigate(item.to); close(); setSearch('') }}><SvgIcon name={item.icon} size={18} /><span><strong>{item.label}</strong><small>{item.detail}</small></span><SvgIcon name="arrow-up-right" size={14} /></button>) : <p>No matches. Try a Dot’s name or a task.</p>}</div><div className="os-command-hint"><span>YOUR SYSTEM, A FEW KEYS AWAY.</span><kbd>ESC</kbd></div></AppDialog>
}
export function AppShell() {
  useRuntimeSync()
  const health = useServerHealth(), preferences = useQuery({ queryKey: ['preferences'], queryFn: api.preferences })
  const mode = useMode(); usePageChrome(mode)
  const { pathname } = useLocation(); usePageMetadata(pathname, false)
  const navigate = useNavigate()
  const [tourStep, setTourStep] = useState<number | null>(() => { try { return pathname === '/app' && localStorage.getItem('dotmates.dashboard-tour.v2') !== 'done' ? 0 : null } catch { return null } })
  const closeTour = () => { try { localStorage.setItem('dotmates.dashboard-tour.v2','done') } catch { /* Optional cache. */ } setTourStep(null); void api.updatePreferences({ tourDone: true }).catch(error => toast({ kind: 'info', title: 'Tour preference not saved', body: error.message })) }
  useEffect(() => { if (preferences.data?.tourDone) { try { localStorage.setItem('dotmates.dashboard-tour.v2','done') } catch { /* Optional cache. */ } const frame = requestAnimationFrame(() => setTourStep(null)); return () => cancelAnimationFrame(frame) } }, [preferences.data?.tourDone])
  const startTour = () => { if (pathname !== '/app') navigate('/app'); setTourStep(0) }
  const { data: wallet } = useWallet(), { data: activity } = useActivity(undefined,1000)
  const seen = useReadAlerts(), unread = activity?.filter(item => item.kind === 'event' && !seen.has(item.id)).length ?? 0
  const [menu,setMenu] = useState(false), [command,setCommand] = useState(false)
  useEffect(() => { const handle = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommand(value => !value) } }; window.addEventListener('keydown',handle); return () => window.removeEventListener('keydown',handle) }, [])
  const section = NAV.find(item => item.end ? pathname === item.to : pathname.startsWith(item.to))?.label ?? (pathname.includes('/m/') ? 'Your Dot' : pathname.endsWith('/new') ? 'New Dot' : 'System settings')
  useEffect(() => { window.scrollTo({ top: 0 }); document.title = `${section} — DotOS` }, [pathname,section])
  return <MotionConfig reducedMotion="user"><div className="app workspace os-workspace" data-mode={mode} style={{ ...paletteStyle(mode), backgroundImage: 'none' }}><aside className="workspace-sidebar"><Logo /><Navigation unread={unread} /></aside><div className="workspace-content"><header className="workspace-top"><div className="workspace-top-title"><button type="button" className="w-icon-button workspace-menu-button" aria-label="Open navigation" onClick={() => setMenu(true)}><SvgIcon name="menu" size={20} /></button><span className="workspace-breadcrumb">DotOS<SvgIcon name="chevron-right" size={13} /></span><strong>{section}</strong></div><div className="workspace-top-actions"><button type="button" className="os-command-launch" aria-label="Search DotOS" onClick={() => setCommand(true)}><SvgIcon name="scan-eye" size={14} /><span>Find anything…</span><kbd>Ctrl K</kbd></button><button type="button" className="workspace-tour-launch" data-tour-launch aria-label="Take a tour" onClick={startTour}><SvgIcon name="book-open" size={16} /><span>Quick start</span></button><Link className="w-icon-button workspace-alert-link" to="/app/activity" aria-label={`Alerts${unread ? `, ${unread} unread` : ''}`}><SvgIcon name="bell" size={18} />{unread > 0 && <span className="workspace-alert-count" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}</Link>{wallet?.connected && wallet.address ? <Link className="workspace-wallet" to="/app/settings"><SvgIcon name="wallet" size={15} /><span>{shortAddr(wallet.address)}</span></Link> : <button type="button" className="workspace-wallet" onClick={() => walletModal.open()}><SvgIcon name="wallet" size={15} /><span>Connect wallet</span></button>}</div></header><main className="app-main workspace-main">{health.isError && <p className="w-error" role="alert">Server unavailable. Changes cannot be saved. <button type="button" className="pxbtn pxbtn-plain" onClick={() => health.refetch()}>Retry connection</button></p>}<motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}><Suspense fallback={<Splash inline />}><Outlet /></Suspense></motion.div></main><footer className="os-workspace-footer"><span><i />{health.data?.runtime?.running ? 'Runtime online' : 'Workspace connected'}</span><span>ROBINHOOD CHAIN MAINNET</span><Link to="/privacy"><SvgIcon name="shield-check" size={12} />Read-only access</Link></footer><nav className="workspace-mobile-nav" aria-label="Mobile workspace">{NAV.slice(0,3).map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'is-active' : ''}><SvgIcon name={item.icon} size={19} /><span>{item.label === 'Responsibilities' ? 'Tasks' : item.label}</span></NavLink>)}<button type="button" onClick={() => setMenu(true)}><SvgIcon name="menu" size={19} /><span>Menu</span></button></nav></div><AppDialog open={menu} onClose={() => setMenu(false)} title="Your system" className="workspace-nav-dialog"><Logo /><Navigation unread={unread} close={() => setMenu(false)} /></AppDialog><CommandPalette open={command} close={() => setCommand(false)} /><TaskComposer /><Toasts /><WalletModal /><DashboardGuide step={tourStep} onStep={setTourStep} onClose={closeTour} /></div></MotionConfig>
}
