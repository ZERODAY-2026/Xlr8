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
      // CR-01 fix: real PDFs (line breaks stripped at parse) arrive as one giant
      // paragraph — segment at word boundaries instead of dropping everything
      // past the cap (the old slice(0, 2000) silently lost 40% of the doc).
      let start = 0;
      while (start < t.length) {
        let end = Math.min(start + MAX_CHUNK_CHARS, t.length);
        if (end < t.length) {
          const cut = t.lastIndexOf(' ', end);
          if (cut > start + MAX_CHUNK_CHARS / 2) end = cut;
        }
        const seg = t.slice(start, end).trim();
        if (seg) out.push({ id: out.length, page, text: seg });
        start = end;
      }
    }
  }
  return out;
}
