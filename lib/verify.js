// lib/verify.js — the GRD-01 hard gate: normalise both sides, then exact substring.
// A quote that fails here is dropped and reported unverifiable — never fuzzy-matched,
// never displayed. Pure and deterministic: no I/O, domain outcomes returned as data.

// Normalisation covers ligatures/full-width (NFKC), dash variants, soft hyphens,
// hyphenated line-break joins, whitespace runs and case.
const norm = (s) =>
  s
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-') // all dash variants → hyphen
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
  for (const c of chunks) {
    if (norm(c.text).includes(q)) return { verifiable: true, page: c.page };
  }
  return { verifiable: false, reason: 'quote not found in source' };
}
