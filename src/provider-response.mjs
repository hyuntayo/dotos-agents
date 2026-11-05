// Bound streamed responses, including bodies that arrive after the headers.
export class InvalidProviderResponse extends Error {
  constructor() { super('Provider returned invalid or oversized JSON.') }
}
export function discardResponse(response) { void response.body?.cancel().catch(() => {}) }
export async function readProviderJson(response, maxBytes, signal) {
  if (!response.body || Number(response.headers.get('content-length')) > maxBytes) {
    discardResponse(response)
    throw new InvalidProviderResponse()
  }
  const reader = response.body.getReader(), chunks = []
  const cancel = () => { void reader.cancel().catch(() => {}) }
  let size = 0
  signal?.addEventListener('abort', cancel, { once: true })
  try {
    signal?.throwIfAborted()
    for (;;) {
      const { value, done } = await reader.read()
      signal?.throwIfAborted()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) throw new InvalidProviderResponse()
      chunks.push(Buffer.from(value))
    }
    try { return JSON.parse(Buffer.concat(chunks, size).toString('utf8')) }
    catch { throw new InvalidProviderResponse() }
  } finally { signal?.removeEventListener('abort', cancel); cancel() }
}
