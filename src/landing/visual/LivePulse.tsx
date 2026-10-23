import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { animate, motion, useInView, useMotionValue, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { PublicNetwork } from '../../../shared/public-network'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useQuietMotion } from '../experience/motion-context'
import { SCENE_EASE } from './scene-easing'
import { useFrozenScrollProgress } from './SceneMotion'

async function readPulse(signal: AbortSignal): Promise<PublicNetwork> {
  const response = await fetch('/api/network/public', { credentials: 'omit', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) })
  if (!response.ok) throw Error('Monitoring unavailable')
  const data = await response.json()
  if (!data || !['activeDots', 'responsibilities', 'checks', 'alerts24h', 'observedAt'].every(key => Number.isSafeInteger(data[key]) && data[key] >= 0) || typeof data.runtime?.online !== 'boolean') throw Error('Incomplete monitoring data')
  return data
}
function Counter({ value }: { value?: number }) {
  const host = useRef<HTMLSpanElement>(null), visible = useInView(host, { once: true }), quiet = useQuietMotion()
  const number = useMotionValue(0), text = useTransform(number, n => Math.round(n).toLocaleString('en-US'))
  useEffect(() => { if (value === undefined || !visible) return; const animation = animate(number, value, { duration: quiet ? 0 : 1, ease: SCENE_EASE }); return () => animation.stop() }, [value, visible, quiet, number])
  return <span ref={host}>{value === undefined ? '—' : <motion.span>{text}</motion.span>}</span>
}
export function LivePulse({ suspended }: { suspended: boolean }) {
  const host = useRef<HTMLElement>(null), countersHost = useRef<HTMLDivElement>(null), quiet = useQuietMotion(), entered = useInView(countersHost, { once: true, amount: .3 }), ready = entered || quiet
  const network = useQuery({ queryKey: ['public-network'], queryFn: ({ signal }) => readPulse(signal), enabled: !suspended, staleTime: 5000, refetchInterval: 10000, refetchIntervalInBackground: false, retry: 1 })
  const data = network.data
  const { scrollYProgress } = useScroll({ target: host, offset: ['start .96', 'start .25'] })
  const progress = useFrozenScrollProgress(scrollYProgress)
  return <section ref={host} id="network" className="v-live v-shell" data-motion-scene="counter-baselines" data-entered={ready || undefined}>
    <div className="v-live-heading"><h2>Live activity</h2><span className="v-live-status" data-online={data?.runtime.online && !network.isError || undefined}><SvgIcon name="activity" size={15}/>{network.isError ? data ? 'Last snapshot' : 'Unavailable' : !data ? 'Connecting' : data.runtime.online ? 'Live' : 'Offline'}<button type="button" aria-label="Refresh live data" onClick={() => void network.refetch()} disabled={network.isFetching || suspended}><SvgIcon name="rotate-cw" size={14}/></button></span><motion.span className="v-live-rule" aria-hidden="true" initial={false} animate={{ scaleX: ready ? 1 : 0 }} transition={{ duration: quiet ? 0 : 1.25, ease: SCENE_EASE }}/></div>
    <div ref={countersHost} className="v-live-counts">{[['On duty', data?.activeDots], ['Watches', data?.responsibilities], ['Checks', data?.checks], ['Alerts / 24h', data?.alerts24h]].map(([label, value], index) => <Metric key={label} label={String(label)} value={value as number | undefined} index={index} ready={ready} progress={progress}/>)}</div>
    {data && <div className="v-live-foot"><time dateTime={new Date(data.observedAt).toISOString()}>Updated {new Date(data.observedAt).toLocaleTimeString([])}</time></div>}
  </section>
}

function Metric({ label, value, index, ready, progress }: { label: string; value?: number; index: number; ready: boolean; progress: MotionValue<number> }) {
  const quiet = useQuietMotion()
  const x = useTransform(progress, [0, .8, 1], [index % 2 ? 42 : -42, 0, 0])
  const y = useTransform(progress, [0, .8, 1], [[36, -20, 48, -28][index], 0, 0])
  const tilt = useTransform(progress, [0, .8, 1], [index % 2 ? -9 : 9, 0, 0])
  return <motion.div data-metric={index} style={{ x, y, rotateY: tilt, transformPerspective: 900 }}>
    <div className="v-live-baseline"><motion.strong initial={false} animate={{ y: ready ? '0%' : '115%' }} transition={{ duration: quiet ? 0 : 1.05, delay: quiet ? 0 : .09 * index, ease: SCENE_EASE }}><Counter value={value}/></motion.strong></div>
    <motion.span initial={false} animate={{ y: ready ? 0 : 12, opacity: ready ? 1 : 0 }} transition={{ duration: quiet ? 0 : .75, delay: quiet ? 0 : .15 + .09 * index, ease: SCENE_EASE }}>{label}</motion.span>
  </motion.div>
}
