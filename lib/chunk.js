// lib/chunk.js — within-page paragraph chunking: a chunk never spans a page, so
// its page number is its source page by construction (pitfall 4). Caps text at 2000 chars.
const MAX_CHUNK_CHARS = 2000;

export function chunk(pages) {
  const out = [];
  for (const { page, text } of pages) {
    if (typeof text !== 'string') continue;
    for (const part of text.split(/\r?\n\s*\r?\n/)) {
      const t = part.trim();
      if (!t) continue;
      out.push({ id: out.length, page, text: t.slice(0, MAX_CHUNK_CHARS) });
    }
  }
  return out;
}
