// Streaming loader: gets bytes in without hitting V8's ~512MB string wall.
// JSONL -> stream line-by-line into records. Monolithic JSON -> buffer (size-guarded) then parse.

export type Loaded =
  | { mode: 'json'; data: unknown; jsonText: string }
  | { mode: 'jsonl'; records: unknown[] }

const JSONL_EXT = /\.(jsonl|ndjson)(\?|#|$)/i
// Monolithic JSON must fit in one JS string to JSON.parse; stay under the ~512MB wall.
const MAX_JSON_BYTES = 256 * 1024 * 1024

const tryParse = (s: string): boolean => {
  try {
    JSON.parse(s)
    return true
  } catch {
    return false
  }
}

const tooLarge = () =>
  new Error(
    `File is too large to view as a single JSON document (over ${
      MAX_JSON_BYTES >> 20
    }MB). ` + `Newline-delimited JSON (JSONL/NDJSON) of any size streams fine.`
  )

export async function load(url: string): Promise<Loaded> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

  // No streaming body (rare) -> fall back to buffered read with the same size guard.
  if (!res.body) {
    const text = await res.text()
    if (JSONL_EXT.test(url) && !tryParse(text))
      return { mode: 'jsonl', records: parseLines(text) }
    return { mode: 'json', data: JSON.parse(text), jsonText: text }
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let bytes = 0
  let mode: 'unknown' | 'json' | 'jsonl' = JSONL_EXT.test(url)
    ? 'jsonl'
    : 'unknown'
  const records: unknown[] = []

  const drainLines = () => {
    let nl: number
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl)
      buffer = buffer.slice(nl + 1)
      if (line.trim()) records.push(JSON.parse(line))
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    bytes += value.length

    if (mode === 'unknown') {
      const nl = buffer.indexOf('\n')
      if (nl !== -1) {
        // JSONL = first line is a complete JSON value AND there's a non-empty second line.
        const first = buffer.slice(0, nl).trim()
        mode =
          first && tryParse(first) && buffer.slice(nl + 1).trim()
            ? 'jsonl'
            : 'json'
      } else if (bytes > MAX_JSON_BYTES) {
        throw tooLarge() // huge single-line doc, no newline in sight
      }
    }

    if (mode === 'jsonl') drainLines()
    else if (bytes > MAX_JSON_BYTES) throw tooLarge()
  }

  if (mode === 'jsonl') {
    if (buffer.trim()) records.push(JSON.parse(buffer)) // trailing line, no final newline
    return { mode: 'jsonl', records }
  }
  // 'json' or 'unknown' (small single-line doc): whole body is in buffer, under the guard.
  return { mode: 'json', data: JSON.parse(buffer), jsonText: buffer }
}

const parseLines = (text: string): unknown[] =>
  text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
