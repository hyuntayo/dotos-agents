import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { toast } from '../toast'

type Setup = { version: number; mates: unknown[]; responsibilities: unknown[]; installed: unknown }
const pick = (value: unknown, fields: string[]) => {
  if (!value || typeof value !== 'object') throw new Error('Invalid workspace configuration.')
  return Object.fromEntries(fields.map(field => [field, (value as Record<string, unknown>)[field]]))
}
export function RestoreWorkspace() {
  const input = useRef<HTMLInputElement>(null)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [error, setError] = useState('')
  const restore = useMutation({ mutationFn: () => api.restoreWorkspace(setup), onSuccess: result => { setSetup(null); toast({ kind: 'success', title: 'Workspace restored', body: `${result.dots} Dots · ${result.tasks} tasks` }) } })
  const choose = async (file?: File) => {
    setError(''); setSetup(null); restore.reset()
    if (!file) return
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a JSON export smaller than 10 MB.')
      const value = JSON.parse(await file.text()).workspace
      if (value?.version !== 5 || !Array.isArray(value.mates) || !Array.isArray(value.responsibilities)) throw new Error('Choose a DotOS workspace export.')
      setSetup({ version: value.version,
        mates: value.mates.map((mate: unknown) => pick(mate, ['id', 'name', 'role', 'body', 'color', 'paused', 'memory', 'permissions'])),
        responsibilities: value.responsibilities.map((task: unknown) => pick(task, ['id', 'mateId', 'text', 'active', 'monitorConfig'])),
        installed: value.installed,
      })
    } catch (error) { setError(error instanceof SyntaxError ? 'This file is not valid JSON.' : (error as Error).message) }
  }
  return <><input ref={input} type="file" accept=".json,application/json" aria-label="Workspace backup file" hidden onChange={event => { void choose(event.target.files?.[0]); event.target.value = '' }} /><div className="w-settings-row"><span><strong>Restore from export</strong><small>Replace the crew and tasks with a saved setup.</small></span><button type="button" className="pxbtn pxbtn-plain" disabled={restore.isPending} onClick={() => input.current?.click()}>Choose backup</button></div>{setup && <div className="w-inline-confirm"><span>Restore {setup.mates.length} Dots and {setup.responsibilities.length} tasks? Current history and conversations will be cleared. Checks start fresh.</span><button type="button" className="pxbtn pxbtn-plain" disabled={restore.isPending} onClick={() => setSetup(null)}>Cancel</button><button type="button" className="pxbtn" disabled={restore.isPending} onClick={() => restore.mutate()}>{restore.isPending ? 'Restoring…' : 'Restore setup'}</button></div>}{(error || restore.isError) && <p className="w-error" role="alert">{error || restore.error?.message}</p>}</>
}
