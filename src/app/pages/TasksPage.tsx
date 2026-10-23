import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { isWatchSetup } from '@/content/task-entry'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { useMates, useResponsibilities } from '../api/hooks'
import { ResponsibilityTable } from '../components/ResponsibilityTable'
import { Btn, PageTitle } from '../components/bits'
import { taskStatus } from '../presentation'
import { openTaskComposer } from '../taskComposer'

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const { data: mates } = useMates()
  const { data: tasks } = useResponsibilities()
  const [filter, setFilter] = useState<'all' | 'watching' | 'paused'>('all')
  const [owner, setOwner] = useState('all')
  const [search, setSearch] = useState(params.get('q') ?? '')
  useEffect(() => { setSearch(params.get('q') ?? '') }, [params])
  useEffect(() => {
    if (params.get('setup') !== '1' || !mates?.length) return
    const mateId = params.get('mate'), preset = params.get('preset')
    openTaskComposer(mates.some(mate => mate.id === mateId) ? mateId! : undefined, isWatchSetup(preset) ? preset : undefined)
    const next = new URLSearchParams(params)
    for (const key of ['setup', 'mate', 'preset']) next.delete(key)
    setParams(next, { replace: true })
  }, [params, setParams, mates])
  const counts = { all: tasks?.length ?? 0, watching: tasks?.filter(task => taskStatus(task, mates?.find(mate => mate.id === task.mateId)).enabled).length ?? 0, paused: tasks?.filter(task => taskStatus(task, mates?.find(mate => mate.id === task.mateId)).label.includes('paused')).length ?? 0 }
  return <div className="stack"><PageTitle kicker="Tasks" sub="Save instructions, assign a Dot, and manage your task preferences." right={<Btn onClick={() => openTaskComposer(owner === 'all' ? undefined : owner)}><SvgIcon name="plus" size={16} />Add task</Btn>}>Your tasks</PageTitle><div className="w-filter-tabs" aria-label="Task status">{(['all', 'watching', 'paused'] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All tasks' : value === 'watching' ? 'Enabled' : 'Paused'}<small>{counts[value]}</small></button>)}</div><div className="w-task-filterbar"><label className="w-search"><SvgIcon name="scan-eye" size={16} /><input type="search" aria-label="Search tasks" placeholder="Search tasks…" value={search} onChange={event => setSearch(event.target.value)} /></label><select className="w-filter-select" aria-label="Filter by Dot" value={owner} onChange={event => setOwner(event.target.value)}><option value="all">All Dots</option>{mates?.map(mate => <option key={mate.id} value={mate.id}>{mate.name}</option>)}</select></div><ResponsibilityTable mates={mates} filter={filter} owner={owner} search={search} /></div>
}
