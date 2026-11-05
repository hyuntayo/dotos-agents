# DotOS Agents

The AI companion layer extracted from [DotOS](https://dotos.si). **No frontend.** Chat with BOB, MAX, IGGY and NOVA, give them scoped memory, and analyze saved responsibilities through OpenRouter.

The OpenRouter adapter and context/prompt functions are taken from the application. A small standalone session wrapper makes them runnable without the website, database or production infrastructure. This repository is not the complete hosted backend.

## Quick start

Requires **Node.js 24+**. There are no external runtime dependencies.

```sh
git clone https://github.com/hyuntayo/dotos-agents.git
cd dotos-agents
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env`. Put **your own** OpenRouter key in `.env`, then:

```sh
npm start
npm start -- max
```

Choose `bob`, `max`, `iggy` or `nova`. In the terminal chat, `/task <instructions>` analyzes a responsibility, `/clear` clears that agent's chat, and `/exit` closes the session. `.env` is ignored by Git. Never commit credentials.

`OPENROUTER_MODEL` defaults to `openrouter/free`. Availability and provider quotas can change. Selecting a paid model may incur charges in your own OpenRouter account; the library does not enforce a monetary budget.

## Use as a module

```js
import { createAgentSession } from './src/index.mjs'

const session = createAgentSession({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL || 'openrouter/free',
  dailyLimit: 50,
})

try {
  session.setMemory('bob', {
    tokens: ['ETH'],
    constraints: ['Explain missing data. Do not invent a price.'],
  })
  const task = session.addTask('bob', 'Explain what is needed to watch ETH above a threshold')
  console.log((await session.analyze(task.id)).content)
  console.log((await session.chat('bob', 'What are the limitations?')).content)
} finally {
  session.close()
}
```

## Agents

| Agent | Context specialty |
| --- | --- |
| BOB | Portfolio and prices |
| MAX | Pons launches |
| IGGY | Wallet activity |
| NOVA | Creator fees |

These are conversational roles, **not blockchain execution tools**. They cannot fetch live prices, execute transactions, trade, sign, move funds or run scheduled monitoring. Task analysis explains supplied instructions; it does not activate a monitor. Cached observation summaries can be passed to the exported `companionPrompt` function by an integrating backend.

## API

- `agents()` returns copies of the four agent profiles.
- `setMemory(id, fields)` updates wallets, tokens, protocols, constraints or risk text. Memory is user-provided context, not system authority.
- `chat(id, message)` sends a message with the agent's saved context and recent conversation.
- `addTask(id, instructions)` saves a task in this session; `analyze(taskId)` requests analysis and stores a successful result.
- `history(id)`, `clearHistory(id)` and `tasks()` inspect or clear session data.
- `usage()` returns the session's current UTC-day attempt counter.
- `close()` cancels the provider and prevents late replies from being saved.
- `createOpenRouter(options)`, `companionPrompt(...)` and `companionContextFingerprint(...)` expose the extracted lower-level building blocks.

## Boundaries and safeguards

History, memory, tasks and quotas are **in memory** and reset on process restart. Different sessions are isolated. The default 50 attempts/day limit applies per session instance; it is not a persistent, cross-process quota or the hosted service's global allowance. Failed attempts count. There are no automatic retries.

The adapter limits provider responses to 1 MiB, requests at most 1,400 output tokens and applies a 45-second timeout. Optional reasoning is disabled so it does not consume the visible response budget. Empty, invalid, oversized, unauthorized and rate-limited replies surface as errors. Context edits, chat clearing and shutdown invalidate stale in-flight answers. One request per agent can be active at a time.

The prompt includes up to 12 recent messages and bounded cached monitoring summaries. The wrapper retains 24 messages per agent and up to 40 tasks. It does not persist failures as successful conversations. AI output may still be inaccurate; prompt instructions are not a security sandbox.

If exposing this module as a service, implement your own authentication, authorization, durable storage, global quotas and request validation. Keep the OpenRouter key server-side. Wallets and task context supplied to the model are sent to OpenRouter and its selected provider. No production keys, user data, deployment scripts, frontend or branded assets are included.

## Tests

```sh
npm run check
npm test
```

Tests inject a local provider stub. They do not need credentials, contact OpenRouter or spend credits. GitHub Actions runs them on each push and pull request.

## Source layout

```text
src/openrouter.mjs        Extracted provider adapter, prompt and context fingerprint
src/provider-response.mjs Bounded response reader
src/validation.mjs        Shared error shape (dependency-free extraction)
src/agents.mjs            Standalone session wrapper
src/index.mjs             Public module exports
examples/chat.mjs         Terminal chat and task analysis
test/agents.test.mjs      Offline regression tests
```

## License

MIT. Fork, modify and use the code with the copyright and license notice retained. DotOS is an independent project, not affiliated with Robinhood, Pons or OpenRouter. The repository previously contained frontend sources; those were removed from the current branch, while Git history is retained.
