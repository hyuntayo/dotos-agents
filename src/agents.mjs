import { randomUUID } from 'node:crypto'
import { createOpenRouter, companionPrompt, companionContextFingerprint } from './openrouter.mjs'
import { ApiError } from './validation.mjs'

export const CREW = Object.freeze([
  Object.freeze({ id: 'bob', name: 'BOB', role: 'Portfolio & prices' }),
  Object.freeze({ id: 'max', name: 'MAX', role: 'Pons launches' }),
  Object.freeze({ id: 'iggy', name: 'IGGY', role: 'Wallet activity' }),
  Object.freeze({ id: 'nova', name: 'NOVA', role: 'Creator fees' }),
])
function text(value, max = 6000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, `Expected non-empty text up to ${max} characters.`)
  return value.trim()
}
function items(value) {
  if (!Array.isArray(value) || value.length > 25) throw new ApiError(400, 'Expected up to 25 memory items.')
  return value.map(item => text(item, 300))
}

// Standalone distribution wrapper. Production prompt and provider logic live
// in openrouter.mjs; the hosted web server and its database are not included.
export function createAgentSession({ provider, apiKey = '', model = 'openrouter/free', dailyLimit = 50, now = Date.now } = {}) {
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000) throw new ApiError(400, 'Invalid daily limit.')
  const ai = provider ?? createOpenRouter({ apiKey, model })
  const state = { wallet: { connected: false }, installed: {}, responsibilities: [], conversations: {}, conversationVersions: {}, aiEpoch: 0 }
  const mates = CREW.map(mate => ({ ...mate, memory: { wallets: [], tokens: ['ETH'], protocols: [], constraints: ['Read-only'], risk: 'Moderate' }, permissions: { transfers: false, swaps: false } }))
  let closed = false, day = '', attempts = 0
  const busy = new Set()
  const find = id => { if (closed) throw new ApiError(503, 'Session is closed.', 'SESSION_CLOSED'); const mate = mates.find(m => m.id === id); if (!mate) throw new ApiError(404, 'Unknown agent.', 'NOT_FOUND'); return mate }
  async function run(id, message, task) {
    const mate = find(id); message = text(message)
    if (busy.has(id)) throw new ApiError(409, 'This agent is already replying.', 'AI_BUSY')
    const today = new Date(now()).toISOString().slice(0, 10)
    if (today !== day) { day = today; attempts = 0 }
    if (attempts >= dailyLimit) throw new ApiError(429, 'Daily attempt limit reached.', 'AI_DAILY_LIMIT')
    const fingerprint = companionContextFingerprint(state, mate)
    const prompt = companionPrompt(state, mate, state.conversations[id] ?? [], message)
    attempts++; busy.add(id)
    try {
      const result = await ai.respond(prompt)
      if (closed || companionContextFingerprint(state, mate) !== fingerprint) throw new ApiError(409, 'Context changed while the agent was replying.', 'AI_CANCELLED')
      if (typeof result?.content !== 'string' || !result.content.trim() || result.content.length > 20000) throw new ApiError(502, 'Provider returned no usable text.', 'AI_INVALID_RESPONSE')
      const reply = { role: 'assistant', content: result.content.trim(), model: result.model, at: now() }
      state.conversations[id] = [...(state.conversations[id] ?? []), { role: 'user', content: message, at: now() }, reply].slice(-24)
      if (task) task.lastResult = structuredClone(reply)
      return structuredClone(reply)
    } finally { busy.delete(id) }
  }
  return {
    agents: () => structuredClone(mates),
    usage: () => ({ day, attempts, limit: dailyLimit }),
    history(id) { find(id); return structuredClone(state.conversations[id] ?? []) },
    clearHistory(id) { find(id); state.conversations[id] = []; state.conversationVersions[id] = (state.conversationVersions[id] ?? 0) + 1 },
    setMemory(id, input) {
      const mate = find(id)
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, 'Expected memory object.')
      const next = structuredClone(mate.memory)
      for (const [key, value] of Object.entries(input)) {
        if (!['wallets', 'tokens', 'protocols', 'constraints', 'risk'].includes(key)) throw new ApiError(400, 'Unsupported memory field.')
        next[key] = key === 'risk' ? text(value, 100) : items(value)
      }
      mate.memory = next
      return structuredClone(next)
    },
    addTask(id, instructions) {
      find(id)
      if (state.responsibilities.length >= 40) throw new ApiError(409, 'Task limit reached.')
      const task = { id: randomUUID(), mateId: id, text: text(instructions, 300), active: true, skill: 'Saved task analysis' }
      state.responsibilities.push(task); return structuredClone(task)
    },
    tasks: () => structuredClone(state.responsibilities),
    chat: (id, message) => run(id, message),
    analyze(taskId) {
      const task = state.responsibilities.find(task => task.id === taskId)
      if (!task) throw new ApiError(404, 'Unknown task.', 'NOT_FOUND')
      return run(task.mateId, `Analyze this saved responsibility. Explain the required data and possible limitations. Do not claim to have executed it: ${task.text}`, task)
    },
    close() { closed = true; ai.close?.() },
  }
}
