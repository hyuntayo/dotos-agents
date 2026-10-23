import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, redirect } from 'react-router'
import { Splash } from './pages/Splash'
import { NotFound } from './pages/NotFound'

const DocsPage = lazy(() => import('./pages/DocsPage').then(m => ({ default: m.DocsPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const Landing = lazy(() => import('./landing/DotOSLanding').then((m) => ({ default: m.Landing })))
const AppShell = lazy(() => import('./app/DotOSShell').then((m) => ({ default: m.AppShell })))
const MatesPage = lazy(() => import('./app/pages/DotsPage').then((m) => ({ default: m.MatesPage })))
const TasksPage = lazy(() => import('./app/pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const SettingsPage = lazy(() => import('./app/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const MatePage = lazy(() => import('./app/pages/MatePage').then((m) => ({ default: m.MatePage })))
const ActivityPage = lazy(() => import('./app/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })))
const SkillsPage = lazy(() => import('./app/pages/SkillsPage').then((m) => ({ default: m.SkillsPage })))
const NewMatePage = lazy(() => import('./app/pages/NewMatePage').then((m) => ({ default: m.NewMatePage })))
const screen = (node: ReactNode, fallback: ReactNode = <Splash />) => <Suspense fallback={fallback}>{node}</Suspense>

export const router = createBrowserRouter([
  { path: '/', element: screen(<Landing />, <div className="dotos-landing-pending" style={{ minHeight: '100dvh', background: '#090b0f' }}><span className="sr-only" role="status">Opening DotOS</span></div>) },
  { path: '/docs', element: screen(<DocsPage />) },
  { path: '/privacy', element: screen(<PrivacyPage />) },
  { path: '/play', loader: () => redirect('/') },
  { path: '/app/guide', loader: () => redirect('/') },
  {
    path: '/app',
    element: screen(<AppShell />),
    children: [
      { index: true, element: <MatesPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'm/:id', element: <MatePage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'approvals', loader: () => redirect('/app') },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'network', loader: () => redirect('/app/settings?section=network') },
      { path: 'new', element: <NewMatePage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
