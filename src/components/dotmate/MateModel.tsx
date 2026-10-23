import { mateRenderProps } from './render-images'
import { lazy, Suspense } from 'react'
import { MATES } from './sprites'
import type { ModelViewerProps } from './ModelViewer'
const Viewer = lazy(() => import('./ModelViewer').then(module => ({ default: module.LiveModel })))
export function MateModel({ suspended = false, keepAlive = false, ...props }: ModelViewerProps & { keepAlive?: boolean }) {
  const body = props.mate ? MATES[props.mate].body : props.body ?? 'blob'
  const color = props.mate ? MATES[props.mate].color : props.color ?? 'violet'
  const fallback = <div className={`model-viewer ${props.className ?? ''}`}><img className="model-fallback" {...mateRenderProps(body,color,props.interactive?'(max-width: 760px) 90vw, 560px':'180px')} alt="" /></div>
  // An opaque full-screen intro does not need a second WebGL scene behind it.
  // Keep the existing character render until the landing becomes visible again.
  if (suspended && !keepAlive) return fallback
  return <Suspense fallback={fallback}><Viewer {...props} suspended={suspended} /></Suspense>
}
