import { Link } from 'react-router'
import { useAnalyzeTask, useServerHealth } from '../api/hooks'
import type { MateView, ResponsibilityItem } from '../api/types'
import { Btn } from './bits'
import './companion-chat.css'

export function TaskAnalysis({ task, mate }: { task: ResponsibilityItem; mate?: MateView }) {
  const analyze = useAnalyzeTask()
  const health = useServerHealth()
  const configured = health.data?.ai?.configured === true
  return <section className="w-ai-result" aria-label="AI task analysis"><h4>Work through this task</h4><p>Your Dot can analyze the instructions using your saved assets and rules.</p><Btn disabled={!configured || !task.active || mate?.paused || (mate && !mate.skills.includes(task.skill)) || analyze.isPending} onClick={() => analyze.mutate(task.id)}>{analyze.isPending ? `${mate?.name ?? 'Your Dot'} is thinking…` : `Analyze with ${mate?.name ?? 'your Dot'}`}</Btn>{!configured && <p><small>OpenRouter connection pending. <Link to="/app/settings">View settings</Link></small></p>}{analyze.isError && <p className="w-error" role="alert">{analyze.error.message}</p>}{task.lastResult && <div><h4>Latest AI analysis</h4><p>{task.lastResult.content}</p>{mate && <p><Link to={`/app/m/${mate.id}?tab=chat`}>Continue with {mate.name}</Link></p>}</div>}<p><small>Background monitoring uses read-only network data. This analysis does not send transactions.</small></p></section>
}
