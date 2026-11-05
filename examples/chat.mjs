import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { createAgentSession } from '../src/index.mjs'

const agent = process.argv[2] || 'bob'
if (!process.env.OPENROUTER_API_KEY) { console.error('Set OPENROUTER_API_KEY in .env (see .env.example).'); process.exit(1) }
const session = createAgentSession({ apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || 'openrouter/free' })
if (!session.agents().some(item => item.id === agent)) { console.error('Choose bob, max, iggy or nova.'); session.close(); process.exit(1) }
const rl = createInterface({ input: stdin, output: stdout })
console.log(`${agent.toUpperCase()} / DotOS agents\n/exit to quit; /clear to reset this chat; /task <instructions> to analyze a task.`)
try {
  for (;;) {
    let message
    try { message = (await rl.question('You > ')).trim() } catch { break }
    if (message === '/exit') break
    if (!message) continue
    if (message === '/clear') { session.clearHistory(agent); continue }
    try {
      const reply = message.startsWith('/task ') ? await session.analyze(session.addTask(agent, message.slice(6)).id) : await session.chat(agent, message)
      console.log(`${agent.toUpperCase()} > ${reply.content}\n`)
    } catch (error) { console.error(`${error.code || 'ERROR'}: ${error.message}`) }
  }
} finally { rl.close(); session.close() }
