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
      for (let i = 0; i < t.length; i += MAX_CHUNK_CHARS) {
        let seg = t.slice(i, i + MAX_CHUNK_CHARS);
        if (i + MAX_CHUNK_CHARS < t.length) {
          const cut = seg.lastIndexOf(' ');
          if (cut > MAX_CHUNK_CHARS / 2) seg = seg.slice(0, cut);
        }
        if (seg.trim()) out.push({ id: out.length, page, text: seg.trim() });
      }
    }
  }
  return out;
}
