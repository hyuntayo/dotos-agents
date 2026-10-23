import type { TaskPlan } from '../api/types'
export function TaskPlanCard({ plan }: { plan: TaskPlan }) {
  const entries = [['Network', plan.network], ['Skill', `${plan.skill} · v${plan.version}`], ['Source', plan.source], ['Wallets', plan.monitorConfig.wallets?.join(', ') || 'Add addresses in task settings'], ['Tokens', plan.monitorConfig.tokens?.join(', ') || 'Not configured'], ['Condition', plan.condition], ['Interval', `${plan.monitorConfig.intervalSeconds} seconds`], ['Repeat', plan.repeat], ['Action', plan.action], ['Access', plan.approval], ['Cost', plan.budget]]
  return <section className="w-settings-card task-plan" aria-label="Review task"><h3>Review before activating</h3><table className="kv"><tbody>{entries.map(([label, value]) => <tr key={label}><th>{label}</th><td style={{ overflowWrap: 'anywhere' }}>{value}</td></tr>)}</tbody></table>{!plan.available && <p className="w-error">{plan.reason}</p>}</section>
}
