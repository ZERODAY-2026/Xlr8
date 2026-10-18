// lib/embed.js — EmbeddingGemma client (MDL-02) + cosine top-k retrieval (no vector DB).
// Retrieval quality depends on the verbatim task prefixes (research §Pattern 2, pitfall 2):
// every query and every passage MUST go through PREFIX before hitting /api/embed.

// The only socket this file may open (PRV-01 / T-01-03): hard-coded loopback, no env override.
const OLLAMA_BASE = 'http://127.0.0.1:11434';
const EMBED_MODEL = 'embeddinggemma';
const EMBED_TIMEOUT_MS = 60_000;
// Kept in sync with lib/ollama.js — both clients collapse transport failures onto the
// single docs/api.md ERROR contract line, so the CLI never prints a stack trace.
const OLLAMA_UNAVAILABLE_MESSAGE =
  "Ollama unavailable at http://127.0.0.1:11434 — start it with 'ollama serve'";

const PREFIX = {
  query: 'task: search result | query: ',
  document: 'title: none | text: ',
};

function transportError() {
  const err = new Error(OLLAMA_UNAVAILABLE_MESSAGE);
  err.transport = true; // connection refused / DNS / timeout / non-2xx → the one honest line
  return err;
}

async function postEmbed(input) {
  let res;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input }),
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    });
  } catch {
    throw transportError();
  }
  if (!res.ok) throw transportError();
  try {
    return await res.json();
  } catch {
    throw new Error('embedding service returned an unparseable response');
  }
}

// embedText(text, kind) → 768-float array. kind is 'query' (question) or 'document' (passage).
export async function embedText(text, kind) {
  const prefix = PREFIX[kind];
  if (!prefix) throw new Error(`unknown embedding kind: ${kind}`);
  const data = await postEmbed(prefix + text);
  const vec = data && data.embeddings && data.embeddings[0];
  if (!Array.isArray(vec) || vec.length === 0 || typeof vec[0] !== 'number') {
    throw new Error('embedding service returned an unexpected response shape');
  }
  return vec;
}

// embedChunks(chunks) → attaches a 768-float `embedding` to each chunk, in place.
// One batched /api/embed call for all passages of the document (Ollama accepts array input).
export async function embedChunks(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return chunks;
  const data = await postEmbed(chunks.map((c) => PREFIX.document + c.text));
  const vectors = data && data.embeddings;
  if (!Array.isArray(vectors) || vectors.length !== chunks.length) {
    throw new Error('embedding service returned an unexpected response shape');
  }
  for (let i = 0; i < chunks.length; i++) {
    const vec = vectors[i];
    if (!Array.isArray(vec) || vec.length === 0 || typeof vec[0] !== 'number') {
      throw new Error('embedding service returned an unexpected response shape');
    }
    chunks[i].embedding = vec;
  }
  return chunks;
}

// cosineTopK(chunks, qVec, 6) — L2-normalise both sides, dot product, sort desc, take k.
// Selected chunks come back ordered by id (page order) so verify() reports the earliest
// matching chunk's page, per the docs/api.md answer contract.
export function cosineTopK(chunks, qVec, k = 6) {
  const q = l2(qVec);
  const scored = chunks.map((c) => {
    const v = l2(c.embedding);
    let dot = 0;
    const n = Math.min(q.length, v.length);
    for (let i = 0; i < n; i++) dot += q[i] * v[i];
    return { c, dot };
  });
  scored.sort((a, b) => b.dot - a.dot);
  const top = scored.slice(0, k).map((s) => s.c);
  top.sort((a, b) => a.id - b.id);
  return top;
}

function l2(v) {
  if (!Array.isArray(v)) return [];
  let sum = 0;
  for (const x of v) sum += x * x;
  const n = Math.sqrt(sum);
  return n > 0 ? v.map((x) => x / n) : v.map(() => 0);
}
