import { useState } from 'react'
import { useMates } from '../api/hooks'
import { Avatar, PageTitle } from '../components/bits'
import { SkillGrid } from './MatePage'

export function SkillsPage() {
  const { data: mates } = useMates()
  const [picked, setPicked] = useState('')
  const mateId = picked || mates?.[0]?.id || ''
  const mate = mates?.find(item => item.id === mateId)
  return <div className="stack"><PageTitle kicker="Skills" sub="New tasks enable the skill they need. You can also manage skills here.">What your Dots can do</PageTitle><div className="w-skill-picker" aria-label="Choose Dot">{mates?.map(item => <button type="button" key={item.id} aria-pressed={item.id === mateId} onClick={() => setPicked(item.id)}><Avatar mate={item} scale={2} still /><span>{item.name}</span></button>)}</div>{mateId ? <SkillGrid mateId={mateId} mateName={mate?.name} /> : <p className="w-notice">Create a Dot to enable its skills.</p>}</div>
}
