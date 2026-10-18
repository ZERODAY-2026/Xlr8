# Phase 1: Contract + Vertical Slice - Pattern Map

**Mapped:** 2026-10-18
**Files analyzed:** 16 (15 new + 1 verify-only)
**Analogs found:** 16 / 16 (all via tracked *planning-doc* analogs — **no application source code exists in this repo**)

## Honest analog disclaimer (read first)

`git ls-files` (run 2026-10-18) shows the entire tracked tree: `.gitignore`, `AGENTS.md`, `BRIEF.md`, `LICENSE`, `README.md`, `tasks/plan.md`, `tasks/todo.md`, `.planning/**`. **Zero `.js`/`.mjs` application files are tracked.** The repo is greenfield for code (confirmed by CONTEXT.md "Reusable Assets: None in code" and RESEARCH.md:117).

Therefore every "analog" below is a **tracked planning document containing concrete, probe-verified code excerpts** (RESEARCH.md Patterns 1–5, Code Examples), or a **tracked convention doc** (`.planning/codebase/CONVENTIONS.md`, `TESTING.md`, `01-UI-SPEC.md`). The planner should treat RESEARCH.md excerpts as copy-ready source for `lib/` files. Where only a shape exists (CLI, server, UI), the planner writes from the spec, not from existing code.

**Tracked-source gate:** all paths named in this file were verified via `git ls-files` — all tracked. `.opencode/**` (which `CONVENTIONS.md:71-74,111-113` and `TESTING.md:41-44` reference as an ESM/test/comment idiom) is **gitignored** and deliberately NOT named as an analog here; those conventions are quoted through the tracked `.planning/codebase/*` docs instead.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` (+ lockfile) | config | n/a | `01-RESEARCH.md` L81-86 (pinned install) + `.planning/codebase/CONVENTIONS.md` L69-74 (ESM) | spec-only |
| `docs/api.md` | config/contract | n/a | `tasks/plan.md` L61-63; `CONVENTIONS.md` L38-41 | spec-only |
| `lib/parse.js` | library | file-I/O + transform | `01-RESEARCH.md` Pattern 1 (L158-177) | **exact** (probe-verified code) |
| `lib/chunk.js` | library | transform | `01-RESEARCH.md` Pattern 3 (L189-198) | **exact** (rule + shape) |
| `lib/embed.js` | library | request-response + file-I/O | `01-RESEARCH.md` Patterns 2+3 (L179-198) | **exact** (probe-verified) |
| `lib/verify.js` | library | transform (pure) | `01-RESEARCH.md` Pattern 4 (L200-213) | **exact** (code) |
| `lib/ollama.js` | library/service | request-response | `01-RESEARCH.md` Pattern 5 (L215-217) | role-match (shape) |
| `cli.js` | controller (process entry) | request-response | `01-RESEARCH.md` Code Example L249-258 | role-match (pseudocode) |
| `server.js` | controller (Express) | request-response | `01-RESEARCH.md` upload route L260-270 | role-match (snippet) |
| `public/index.html` | component | request-response | `01-UI-SPEC.md` (copy + states contract) | spec-only |
| `public/app.js` | component | request-response (fetch) | `01-UI-SPEC.md` E1–E10 state table (L105-168) | spec-only |
| `public/styles.css` (or `<style>` block — planner's call) | config | n/a | `01-UI-SPEC.md` L33-79 (spacing/type/color tokens) | spec-only |
| `fixtures/rental.txt`, `fixtures/employment.txt` | data/fixture | file-I/O | `01-CONTEXT.md` D-01..D-03 | spec-only |
| `fixtures/SOURCES.md` | docs | n/a | `01-CONTEXT.md` D-03 | spec-only |
| `lib/verify.test.js` (+ optional `lib/chunk.test.js`) | test | transform (pure) | `.planning/codebase/TESTING.md` L66-78 proposed shape | role-match (proposed shape) |
| `.gitignore` | config | n/a | already exists; already ignores `chunks.json`, `data/`, `uploads/` — **verify only, likely no edit** | exact (reuse) |

## Pattern Assignments

### `lib/parse.js` (library, file-I/O + transform)

**Analog:** `01-RESEARCH.md` Pattern 1, lines 158-177 — probe-verified live on this machine (pdfjs-dist 6.4.299, Node v24.19.0).

**Imports + core pattern (verbatim from research):**
```javascript
// Source: live probe 2026-10-18 (temp dir), pdfjs-dist@6.4.299 + Node v24.19.0
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function parsePdf(buf) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true, isEvalSupported: false }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    pages.push({ page: p, text: tc.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim() });
  }
  return pages; // [{page, text}] — the ING-03 page-aware contract
}
```
**Constraints to copy with it** (RESEARCH.md L177, pitfall #1/#8): always the **legacy** build (modern build crashes on Node 24); no `.destroy()` call (v6 has none — probe error "doc.destroy is not a function"); `isEvalSupported: false` (hostile-PDF hardening, RESEARCH.md L304); TXT path = read UTF-8 → `[{page: 1, text}]`. No temp files written (probe-confirmed — satisfies temp-hygiene rule).

---

### `lib/chunk.js` (library, transform)

**Analog:** `01-RESEARCH.md` Pattern 3, lines 189-198.

**Core rule (copy verbatim):**
```javascript
// Chunking rule that eliminates the page-mapping pitfall entirely: split each page's
// text into paragraph chunks *within* the page — a chunk's page is its source page by
// construction; chunks never span pages. Cap chunk text ~2000 chars.
// chunk record: { id, page, text }
```
Input `[{page, text}]` from parse → output chunk records; main export verb-named `chunk` (CONVENTIONS.md L24-26: "mirror the file name in the main export").

---

### `lib/embed.js` (library, request-response + file-I/O)

**Analog:** `01-RESEARCH.md` Patterns 2 + 3, lines 179-198 — task prefixes are a **hard requirement**, not a tuning option.

**Imports + prefix pattern (verbatim, L183-187):**
```javascript
// Source: https://huggingface.co/blog/embeddinggemma (verbatim prefix strings)
const PREFIX = { query: 'task: search result | query: ', document: 'title: none | text: ' };
// embed document: PREFIX.document + chunk.text   |   embed question: PREFIX.query + question
// POST http://127.0.0.1:11434/api/embed body {model:'embeddinggemma', input:'...'}
// → { embeddings: [[/* 768 floats */]] }  — 768 dims confirmed live
```

**chunks.json storage shape (L191-197) — must land in `docs/api.md` first:**
```json
{
  "docId": "<sha256 of file>",
  "filename": "rental.txt",
  "chunks": [ { "id": 0, "page": 1, "text": "…verbatim chunk text…", "embedding": [0.0123, "…768 floats…"] } ]
}
```
**Cosine top-k:** "embed question with query prefix → dot product against L2-normalised stored vectors → sort desc → take 6. ~20 lines, no dependency" (L198). Storage path: `./data/chunks.json` (CONTEXT discretion, gitignored).

---

### `lib/verify.js` (library, transform — THE GRD-01 hard gate)

**Analog:** `01-RESEARCH.md` Pattern 4, lines 200-213 + risk row `tasks/plan.md:133`.

**Core pattern (verbatim):**
```javascript
// Normalisation (from the risk register in tasks/plan.md:133 — hyphenation/ligatures)
const norm = (s) => s.normalize('NFKC')          // ligatures ﬁ→fi, full-width forms
  .replace(/[\u2010-\u2015\u2212]/g, '-')        // all dash variants → hyphen
  .replace(/\u00ad/g, '')                         // soft hyphens
  .replace(/-\s+/g, '')                           // hyphenated line breaks: "no-\ntice" → "notice"
  .replace(/\s+/g, ' ')
  .trim().toLowerCase();
// gate: topChunks.some(c => norm(c.text).includes(norm(quote))) → keep, attach c.page
//        else → { unverifiable: true, reason: 'quote not found in source' } — never display
```

**Error-handling pattern (deterministic data shape, not throw):** domain outcome returned as data — CONVENTIONS.md L123-127: "drop is expressed as tier `not_in_document` / unverifiable reporting, not a throw". Only genuine I/O/parse failures throw (TESTING.md L165-168).

---

### `lib/ollama.js` (library/service, request-response)

**Analog:** `01-RESEARCH.md` Pattern 5, lines 215-217 — the **single choke point for the only allowed socket** (RESEARCH.md L53).

**Core pattern:**
```javascript
// POST /api/chat with format: "json", stream: false,
// options: { num_predict: ~300, temperature: 0 },
// base URL http://127.0.0.1:11434  ← hard-coded loopback, no env override
// Retry once, then fall back gemma3n:e2b → gemma3:4b
// [VERIFIED: live probe returned valid JSON {"quote":"…","plain":"…"} in 11.2 s]
```
**Error handling (L217 + pitfall #5):** "`format:"json"` guarantees *parseable* JSON, not a *schema* — always validate fields in code and treat missing/garbage fields as a retryable failure." Wrap `JSON.parse` in try/catch; missing `quote`/`plain` → retryable failure (RESEARCH.md L308). Use built-in `fetch` — no HTTP client dependency (RESEARCH.md L72, L231). Keep top-k 6 chunks in the prompt (CPU speed).

---

### `cli.js` (controller — process entry, request-response)

**Analog:** `01-RESEARCH.md` Code Example, lines 249-258 (Checkpoint 1 shape — pseudocode, no existing code).

```javascript
// node cli.js ask fixtures/rental.txt "what is the notice period?"
// 1. parse → chunk → embed → chunks.json (skip if docId matches existing file)
// 2. qEmb = embed(PREFIX.query + question)
// 3. top = cosineTopK(chunks, qEmb, 6)
// 4. resp = await chat(gemma3n:e2b, format:'json', system, user with quoted chunks)
// 5. obj = JSON.parse(resp) ; ok = verify(obj.quote, top)
// 6. ok ? print answer + quote + `p. ${page}` : print "UNVERIFIABLE: quote not found in source"
```
**Conventions:** ESM `import`, relative paths only (CONVENTIONS.md L76-77); log to stdout via `console.*` (CONVENTIONS.md L100-105 — no logging library); "UNVERIFIABLE" report is mandated honest output (CONVENTIONS.md L104-105).

---

### `server.js` (controller, request-response)

**Analog:** `01-RESEARCH.md` Code Example, lines 260-270 (multer official usage + CONTEXT discretion).

```javascript
// Source: multer official usage (expressjs.com/en/resources/middleware/multer) + CONTEXT discretion
import multer from 'multer';
const upload = multer({
  storage: multer.diskStorage({ destination: 'data/', filename: (_r, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname)) }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per CONTEXT discretion; page cap (~300) checked post-parse
  fileFilter: (_r, file, cb) => cb(null, /\.(pdf|txt)$/i.test(file.originalname)),
});
app.post('/api/upload', upload.single('file'), asyncHandler(handleUpload));
```
**Routes (fixed contract — CONVENTIONS.md L38-41):** `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` — documented in `docs/api.md` first, change there first. Static `express.static('public/')`. Page cap ~300 checked post-parse with the UI-SPEC error copy (01-UI-SPEC.md L93). Security: PDF hostile input → `isEvalSupported: false`; extension allow-list; bind/serve localhost only (RESEARCH.md L302-308). Express 5.3.0 + multer 2.4.0 pinned exact (RESEARCH.md L81-86; A1 smoke test at install).

**Error-handling pattern:** no existing repo wrapper — planner should use Express 5 async error propagation (`express` catches rejected async handlers in v5) + return UI-SPEC verbatim error copy; deterministic `{ error: … }` JSON bodies, no stack leaks.

---

### `public/index.html` + `public/app.js` + `public/styles.css` (component, request-response)

**Analog:** `01-UI-SPEC.md` (tracked, approved 2026-10-18) — **there is no HTML/JS/CSS code to copy; the spec is the analog.** Copy verbatim:

- **Design system (L21-31):** hand-written HTML/CSS/vanilla JS, no framework, inline SVG icons `currentColor`, `system-ui` font stack — **no CDN/font/icon fetches ever** (PRV-01).
- **Tokens (L33-79):** 4px-multiple spacing scale; type roles 16/13/20/28px, weights 400+600 only; colors `#FAF8F4` parchment, accent `#295499` reserved for exactly CTA/active-nav/focus-ring; page chips chrome `#F1EDE5`/`#5A6272`, never accent.
- **Copywriting Contract (L85-97):** every string verbatim — CTA "Upload agreement", loading "Extracting pages → chunking → embedding locally…", success header "{filename} — {N} chunks" (pluralise), the three error rows, no-chunks message.
- **State table (L105-168):** E1–E10 — upload flow: `fetch('/api/upload', {method:'POST', body: formData})` → render header + chunk rows with `p. {page}` chips; error banner above drop zone preserving previous list; remove-document confirm dialog verbatim.
- **Scope lock (D-04):** upload shell + chunk list ONLY — no Q&A UI this phase.

---

### `lib/verify.test.js` (test, transform — pure)

**Analog:** `.planning/codebase/TESTING.md` lines 66-78 (proposed shape in a tracked doc; the underlying repo tooling example is gitignored, so cite TESTING.md, not that path).

```js
// lib/verify.test.js (proposed shape — matches node:test + node:assert/strict style)
import { test } from "node:test";
import assert from "node:assert/strict";
import { verify } from "./verify.js";

test("drops a quote that is not verbatim in the chunk", () => {
  const out = verify({ quote: "invented wording", ... }, chunk);
  assert.equal(out.verifiable, false);
  assert.equal(out.tier, "not_in_document");
});
```
**Required minimum cases (RESEARCH.md pitfall #3):** (a) verbatim → pass, (b) paraphrase → reject, (c) invented → reject. Run: `node --test lib/`. No network, no mocks (TESTING.md L97-112); wire `"test": "node --test"` when `package.json` lands (TESTING.md L30-31). Timing: run as soon as `verify.js` exists (RESEARCH.md L13) — not at the end.

---

### `docs/api.md`, `package.json`, `fixtures/*` (config/data)

- **`docs/api.md`** — Task 0 contract, written **before** any `lib/` code (CONVENTIONS.md L141-142). Contents fixed by `tasks/plan.md:61-63`: `chunks.json` shape (RESEARCH.md L191-197), answer schema — Phase 1 fields `{answer|plain, quote, page}` with the **full** `tier`/`kind`/`escalate`/`confidence_basis` field names reserved now so Phase 2 extends not reshapes (RESEARCH.md L213), routes (CONVENTIONS.md L38-41).
- **`package.json`** — `"type": "module"` (RESEARCH.md L86 — pdfjs v6 is ESM-only), pinned exact: `express@5.3.0 multer@2.4.0 pdfjs-dist@6.4.299` (L81-84), scripts `"start"`/`"test"`. Gate first install behind human ack — express + pdfjs-dist flagged SUS `too-new` (L99, Approved-with-note).
- **`fixtures/rental.txt` + `fixtures/employment.txt`** — D-01/D-02: Indian-style rental (deposit, notice period, maintenance) and employment (probation, termination), plain English. D-03 banner as **first line, verbatim:** `SYNTHETIC SAMPLE — fictitious parties, created for this demo, released under CC0 1.0`. At least one `.txt` (zero parse risk); consider one small `.pdf` to demo the pdfjs path (RESEARCH.md Open Question 2 — `.txt` pair is the safe floor).
- **`fixtures/SOURCES.md`** — self-authored, CC0 1.0, gate G4 evidence path (D-03).

---

## Shared Patterns

### 1. Localhost-only networking (PRV-01) — applies to: `lib/embed.js`, `lib/ollama.js`, `server.js`, `public/*`
**Source:** `01-RESEARCH.md` L42, L222; `CONVENTIONS.md` L60-61
```javascript
const OLLAMA_BASE = 'http://127.0.0.1:11434'; // hard-coded loopback — the ONLY allowed socket
```
No CDN assets, no external fonts/icons (UI-SPEC L26-29), no runtime fetches besides Ollama. Proof at Checkpoint 1: `Get-NetTCPConnection -State Established | ? { $_.RemoteAddress -notmatch '^(127\.|::1|0\.0\.0\.0)' }` → empty (RESEARCH.md L296).

### 2. ESM + relative imports, no build step — applies to: all `.js`
**Source:** `01-RESEARCH.md` L86; `CONVENTIONS.md` L54-56, L69-77
```javascript
import { verify } from './verify.js';   // relative paths only, no aliases
// package.json: "type": "module" — pdfjs-dist v6 is ESM-only; Node 24 runs ESM natively
```

### 3. Deterministic data shapes over exceptions — applies to: `lib/verify.js`, `lib/ollama.js`, `cli.js`
**Source:** `CONVENTIONS.md` L123-127, L83-96
Domain outcomes (verified/dropped/silent/refused) are **returned as data**, never thrown. Only genuine I/O/parse failures throw. Logging = `console.*` only (CONVENTIONS.md L100-101).

### 4. Normalise-before-match + never render unverified quotes — applies to: `lib/verify.js`, `cli.js`, `server.js`
**Source:** `CONVENTIONS.md` L83-93; RESEARCH.md Pattern 4
"The prompt asks for quotes; `lib/verify.js` *enforces* them. Never render a quote the verifier has not approved" (RESEARCH.md L221). Fuzzy/near-match results are logged honestly as unverifiable, never fuzzy-displayed (L240).

### 5. Contract-first ordering — applies to: every file
**Source:** `01-RESEARCH.md` L13 build order; `CONVENTIONS.md` L141-142
`docs/api.md` → `lib/parse.js` → `lib/chunk.js`/`lib/embed.js` → `lib/verify.js` (+ verifier test immediately) → `lib/ollama.js` → `cli.js` → Express upload shell → `public/` → fixtures.

### 6. Temp/OneDrive hygiene — applies to: `server.js`, `lib/embed.js`, tests
**Source:** `CONTEXT.md` discretion; RESEARCH.md L223, L244
All runtime artifacts under gitignored `./data/` (`chunks.json`, uploads); never `os.tmpdir()`; `.gitignore` already covers `data/`, `chunks.json`, `uploads/` (verified 2026-10-18).

## No Analog Found

No file lacks *any* analog (every one maps to a tracked doc with concrete content), but the planner must know these are **spec-driven, not code-driven** — no existing code exemplifies them:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `server.js` | controller | request-response | No Express app exists anywhere in the repo; only a route snippet (RESEARCH L260-270) |
| `cli.js` | controller | request-response | No entry point exists; only 8-line pseudocode flow (RESEARCH L249-258) |
| `public/index.html` / `app.js` / `styles.css` | component | request-response | Zero frontend code exists; 01-UI-SPEC.md is the sole contract |
| `fixtures/*.txt` | data | file-I/O | No fixture documents exist (deferred CUAD samples are out of scope) |

**Fallback for these:** RESEARCH.md Code Examples + 01-UI-SPEC.md, in that order.

## Metadata

**Analog search scope:** whole tracked tree (`git ls-files`, 21 files), `.planning/phases/01-contract-vertical-slice/`, `.planning/codebase/` (CONVENTIONS, TESTING, ARCHITECTURE, STACK), `tasks/plan.md`, `tasks/todo.md`.
**Files scanned:** 21 tracked + 4 phase docs + 6 codebase docs.
**Tracked-source gate:** every path in this document verified against `git ls-files` on 2026-10-18; gitignored `.opencode/**` mirrors deliberately excluded.
**Pattern extraction date:** 2026-10-18 (same-day checkpoint — RESEARCH.md valid until 2026-10-18).
