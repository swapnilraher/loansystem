"use client"

/**
 * Reading a newline-delimited JSON response, and reading a failed one.
 *
 * Both halves exist because of the same bug. The campaign dispatcher used to be
 * a plain `await response.json()`, so when the platform killed the function at
 * its 60-second limit and returned its own plain-text page, the browser threw
 * `Unexpected token 'A', "An error o"... is not valid JSON` — the admin was
 * shown a parser error instead of "the send timed out".
 *
 * A `Response` is not a promise of JSON. It is bytes, which may be JSON, may be
 * a proxy's HTML, and may stop halfway. These two helpers are what the campaign
 * screen uses instead of assuming otherwise.
 */

/**
 * Yields each complete JSON line as it arrives.
 *
 * A partial line at the end of a chunk is held until its newline turns up, and
 * a line that will not parse is skipped rather than thrown — a truncated final
 * line means the connection died, which the caller detects by not having seen
 * the stream's own end-of-run event.
 */
export async function* readNdjson(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const parse = (raw: string): Record<string, unknown> | null => {
    const text = raw.trim()
    if (!text) return null
    try {
      const value = JSON.parse(text)
      return value && typeof value === "object" ? (value as Record<string, unknown>) : null
    } catch {
      return null
    }
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let newline = buffer.indexOf("\n")
      while (newline !== -1) {
        const event = parse(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
        if (event) yield event
        newline = buffer.indexOf("\n")
      }

      if (signal?.aborted) break
    }

    const tail = parse(buffer)
    if (tail) yield tail
  } finally {
    // Cancel rather than release: if the caller stopped early, the server
    // should learn about it and stop sending too.
    await reader.cancel().catch(() => undefined)
  }
}

/**
 * A sentence worth showing for a response that is not the success we wanted.
 *
 * Handles the three things that actually come back: our own
 * `{ success: false, error }`, a platform or proxy error page, and an empty
 * body. None of them are allowed to throw.
 */
export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => "")
  if (!text.trim()) return `${fallback} (HTTP ${response.status})`

  try {
    const parsed = JSON.parse(text) as { error?: unknown; message?: unknown }
    const message = parsed?.error ?? parsed?.message
    if (typeof message === "string" && message.trim()) return message
  } catch {
    // Not JSON at all — an HTML or plain-text error page, which is the case
    // that used to surface as a parser error.
  }

  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180)

  if (response.status === 504 || /timeout/i.test(plain)) {
    return "The server ran out of time on this batch. Nothing was lost — send again to continue from where it stopped."
  }

  return plain ? `${fallback} (HTTP ${response.status}: ${plain})` : `${fallback} (HTTP ${response.status})`
}
