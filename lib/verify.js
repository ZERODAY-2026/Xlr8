// lib/verify.js — the GRD-01 hard gate: normalise both sides, then exact substring.
// A quote that fails here is dropped and reported unverifiable — never fuzzy-matched,
// never displayed. Pure and deterministic: no I/O, domain outcomes returned as data.

// Normalisation covers ligatures/full-width (NFKC), dash variants, typographic quotes,
// soft hyphens, hyphenated line-break joins, whitespace runs and case.
const norm = (s) =>
  s
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-') // all dash variants → hyphen
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'") // curly single quotes → straight
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"') // curly double quotes → straight
    .replace(/\u00ad/g, '') // soft hyphens
    .replace(/-\s+/g, '') // hyphenated line breaks: "no-\ntice" → "notice"
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export function verify(quote, chunks) {
  // Load-bearing order: an empty normalised quote is a substring of everything,
  // so the rejection must run before any substring test.
  if (typeof quote !== 'string' || quote.trim() === '') {
    return { verifiable: false, reason: 'empty quote' };
  }
  const q = norm(quote);
  if (q === '') return { verifiable: false, reason: 'empty quote' };

  const sorted = [...chunks].sort((a, b) => a.id - b.id);

  // Direct hit: the quote lives inside one stored chunk.
  for (const c of sorted) {
    if (norm(c.text).includes(q)) return { verifiable: true, page: c.page };
  }

  // Segment-boundary hit: lib/chunk.js splits >2000-char paragraphs into consecutive
  // same-page segments, so consecutive ids on the same page are contiguous document
  // text — a quote crossing a segment cut is still verbatim, just split across chunks.
  let run = [];
  for (const c of sorted) {
    const prev = run[run.length - 1];
    if (prev && c.id === prev.id + 1 && c.page === prev.page) run.push(c);
    else run = [c];
    if (run.length < 2) continue;
    const joined = run.map((r) => norm(r.text)).join(' ');
    if (joined.includes(q)) return { verifiable: true, page: run[0].page };
  }

  return { verifiable: false, reason: 'quote not found in source' };
}
