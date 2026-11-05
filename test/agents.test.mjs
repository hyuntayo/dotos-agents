import test from 'node:test'
import assert from 'node:assert/strict'
import { createAgentSession, createOpenRouter, companionPrompt } from '../src/index.mjs'
const response = text => Response.json({ choices: [{ message: { content: text } }], model: 'test/model' })
const provider = fn => createOpenRouter({ apiKey: 'fixture-not-a-real-key', fetchImpl: fn })

test('provider disables reasoning and preserves visible text with one bounded call', async () => {
  let calls = 0
  const ai = provider(async (_url, options) => { calls++; const body = JSON.parse(options.body); assert.deepEqual(body.reasoning, { enabled: false, exclude: true }); assert.equal(body.max_tokens, 1400); return response('Observed context only') })
  assert.equal((await ai.respond([{ role: 'user', content: 'Hello' }])).content, 'Observed context only'); assert.equal(calls, 1); ai.close()
})
test('missing credentials, rate limits and reasoning-only replies are explicit errors', async () => {
  await assert.rejects(createOpenRouter().respond([]), { code: 'AI_NOT_CONFIGURED' })
  for (const [reply, code] of [[Response.json({}, { status: 429 }), 'AI_RATE_LIMITED'], [Response.json({ choices: [{ message: { content: null, reasoning: 'not an answer' } }] }), 'AI_INVALID_RESPONSE']]) {
    const ai = provider(async () => reply); await assert.rejects(ai.respond([]), { code }); ai.close()
  }
})
test('oversized provider bodies are rejected', async () => {
  const ai = provider(async () => response('x'.repeat(1100000)))
  await assert.rejects(ai.respond([]), { code: 'AI_INVALID_RESPONSE' }); ai.close()
})
test('memory, conversation history and tasks stay scoped to each agent and session', async () => {
  const prompts = []; const session = createAgentSession({ provider: { respond: async messages => { prompts.push(messages); return { content: 'Hello', model: 'test/model' } } } })
  session.setMemory('bob', { constraints: ['Unique BOB context'] })
  const task = session.addTask('bob', 'Explain ETH monitoring')
  await session.analyze(task.id); await session.chat('bob', 'What data do I need?'); await session.chat('max', 'Hello')
  assert.match(prompts[0][0].content, /Unique BOB context/); assert.match(prompts[0][0].content, /no live blockchain/)
  assert.equal(prompts[1].length, 4); assert.doesNotMatch(prompts[2][0].content, /Unique BOB context/)
  assert.equal(session.tasks()[0].lastResult.content, 'Hello'); assert.equal(session.history('bob').length, 4)
  const external = session.history('bob'); external[0].content = 'tampered'; assert.notEqual(session.history('bob')[0].content, 'tampered')
  const other = createAgentSession(); assert.deepEqual(other.history('bob'), []); other.close(); session.close()
})
test('failed calls consume attempts but do not fabricate conversation entries; UTC day resets quota', async () => {
  let time = Date.UTC(2026, 0, 1)
  const session = createAgentSession({ dailyLimit: 1, now: () => time, provider: { respond: async () => { throw Error('upstream failed') } } })
  await assert.rejects(session.chat('bob', 'Hello')); assert.deepEqual(session.history('bob'), [])
  await assert.rejects(session.chat('max', 'Hello'), { code: 'AI_DAILY_LIMIT' })
  time += 86400000; await assert.rejects(session.chat('bob', 'Hello'), /upstream failed/); assert.equal(session.usage().attempts, 1); session.close()
})
test('clearing or editing context rejects an in-flight reply and prevents concurrent calls', async () => {
  for (const mutate of [s => s.clearHistory('bob'), s => s.setMemory('bob', { tokens: ['NEW'] }), s => s.close()]) {
    let done
    const session = createAgentSession({ provider: { respond: () => new Promise(resolve => { done = resolve }) } })
    const pending = session.chat('bob', 'Hello')
    await assert.rejects(session.chat('bob', 'Again'), { code: 'AI_BUSY' })
    mutate(session); done({ content: 'Old context' }); await assert.rejects(pending, { code: 'AI_CANCELLED' }); session.close()
  }
})
test('memory updates validate atomically and input limits hold', async () => {
  const s = createAgentSession()
  const before = s.agents()
  assert.throws(() => s.setMemory('bob', { tokens: ['NEW'], unknown: 'invalid' }))
  assert.deepEqual(s.agents(), before)
  await assert.rejects(s.chat('unknown', 'Hello'), { code: 'NOT_FOUND' })
  await assert.rejects(s.chat('bob', 'x'.repeat(6001)))
  for (let i = 0; i < 40; i++) s.addTask('bob', 'Task ' + i)
  assert.throws(() => s.addTask('bob', 'Too many')); s.close()
})
test('production prompt bounds observations and excludes raw snapshots', () => {
  const mate = { id: 'bob', name: 'BOB', role: 'Portfolio', memory: {}, permissions: {} }
  const state = { wallet: { connected: false }, installed: {}, responsibilities: [{ mateId: 'bob', active: true, text: 'Check', monitor: { status: 'error', lastCheckAt: 1000, result: 'x'.repeat(5000), snapshot: { secretMarker: 'not-in-prompt' } } }] }
  const prompt = companionPrompt(state, mate, [], 'Explain')[0].content
  assert.match(prompt, /1970-01-01T00:00:01.000Z/); assert.doesNotMatch(prompt, /not-in-prompt/); assert.ok(prompt.length < 5000)
})
