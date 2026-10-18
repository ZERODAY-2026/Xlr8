// lib/ollama.js — the single choke point for the only socket this application may open
// (PRV-01 / T-01-03): JSON-mode /api/chat with one retry, then the gemma3:4b fallback
// (T-01-05). format:"json" guarantees parseable JSON, NOT a schema (research pitfall 5),
// so every reply is field-validated before it leaves this module.
const OLLAMA_BASE = 'http://127.0.0.1:11434'; // hard-coded loopback — deliberately NO env override
const PRIMARY_MODEL = 'gemma3n:e2b';
const FALLBACK_MODEL = 'gemma3:4b';
const CHAT_TIMEOUT_MS = 120_000;

// The docs/api.md Ollama-down contract line, verbatim (cli.js prints it after "ERROR: ").
export const OLLAMA_UNAVAILABLE_MESSAGE =
  "Ollama unavailable at http://127.0.0.1:11434 — start it with 'ollama serve'";
const UNUSABLE_REPLY_MESSAGE =
  'model returned unusable JSON after retry and fallback — no quote to verify, nothing displayed';

// A reply is usable only as a non-empty {quote, plain} string pair.
function usable(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.quote === 'string' &&
    obj.quote.trim() !== '' &&
    typeof obj.plain === 'string' &&
    obj.plain.trim() !== ''
  );
}

async function attempt(model, system, user) {
  let res;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        format: 'json',
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        options: { num_predict: 300, temperature: 0 },
      }),
      signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
    });
  } catch {
    const err = new Error(OLLAMA_UNAVAILABLE_MESSAGE);
    err.transport = true;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(OLLAMA_UNAVAILABLE_MESSAGE);
    err.transport = true;
    throw err;
  }

  // Invalid shape → retryable failure (schema exhaustion path).
  const retryable = () => new Error(UNUSABLE_REPLY_MESSAGE);

  let data;
  try {
    data = await res.json();
  } catch {
    throw retryable();
  }
  let content = data && data.message && data.message.content;
  if (content === undefined || content === null) throw retryable();
  let obj = content;
  if (typeof content === 'string') {
    try {
      obj = JSON.parse(content);
    } catch {
      throw retryable();
    }
  }
  if (!usable(obj)) throw retryable();
  return obj;
}

// chat({ model?, system, user }) → validated { quote, plain } object.
// Sequence per plan: try model, retry once with the same model, then fall back to
// gemma3:4b once. Transport failures (refused/DNS/timeout/non-2xx) run the same
// sequence and end on the one honest ERROR line; schema exhaustion ends on the
// unusable-reply error. Either way the CLI exits 1 with a single ERROR line, never
// a stack trace.
export async function chat({ model = PRIMARY_MODEL, system, user }) {
  const sequence = [model, model];
  if (model !== FALLBACK_MODEL) sequence.push(FALLBACK_MODEL);

  let last;
  for (const m of sequence) {
    try {
      return await attempt(m, system, user);
    } catch (err) {
      last = err;
    }
  }
  throw last ?? new Error(UNUSABLE_REPLY_MESSAGE);
}
