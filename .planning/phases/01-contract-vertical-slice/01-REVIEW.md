---
phase: 01-contract-vertical-slice
reviewed: 2026-10-18T11:16:21Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - cli.js
  - cli.test.js
  - data/chunks.json
  - docs/api.md
  - fixtures/SOURCES.md
  - fixtures/employment.txt
  - fixtures/rental.txt
  - lib/chunk.js
  - lib/chunk.test.js
  - lib/embed.js
  - lib/ollama.js
  - lib/ollama.test.js
  - lib/parse.js
  - lib/parse.test.js
  - lib/pipeline.js
  - lib/verify.js
  - lib/verify.test.js
  - package-lock.json
  - package.json
  - public.test.js
  - public/app.js
  - public/index.html
  - public/styles.css
  - server.js
findings:
  critical: 2
  warning: 3
  info: 10
  total: 15
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-18T11:16:21Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Adversarial standard-depth review of the three plan scopes (parse/chunk/verify core, Ollama/embed/CLI ask path, Express server + browser UI). Passing tests (21/21) were treated as non-evidence; two findings were **empirically proven by running the pipeline** against the ingested PDF in `data/`.

What holds up: egress is genuinely loopback-only (`OLLAMA_BASE` hard-coded in both `lib/ollama.js:5` and `lib/embed.js:6`, no other `fetch`/URL in source, `public/` uses relative URLs); the UI renders every dynamic value via `textContent` — **no XSS sink anywhere** (`innerHTML`/`dangerouslySetInnerHTML` absent repo-wide); multer storage names are `crypto.randomUUID()` + validated extension (no path traversal); `verify()` rejects empty quotes before substring matching; prompt injection is gated by system-prompt framing plus the verbatim `verify()` gate.

What does not: **the chunker silently discards 40% of a real PDF's text** (proven, CR-01), and **the localhost API has no Host/Origin validation**, leaving a DNS-rebinding path to document content (CR-02). Two contract deviations (WR-01, WR-02) contradict the explicitly binding `docs/api.md`. `data/chunks.json` in the review scope turned out to be gitignored, untracked runtime state (absent from `git diff diff_base HEAD`) — see IN-04.

## Narrative Findings (AI reviewer)

All findings below (CR-/WR-/IN- IDs) are narrative findings from direct code review. No structural findings block was provided for this review.

### Critical Issues

### CR-01: Chunker silently discards all text past 2000 chars per paragraph — 40% of the demo PDF's content never enters retrieval or the quote gate

**File:** `lib/chunk.js:12` (with root cause in `lib/parse.js:26`)
**Severity:** BLOCKER

**Issue:** `chunk()` pushes only `t.slice(0, MAX_CHUNK_CHARS)` for each paragraph part — the remainder is dropped, not windowed into continuation chunks. For PDFs this is guaranteed content loss because `lib/parse.js:26` joins every text item with `' '` and collapses `\s+` to a single space, destroying all line/paragraph breaks: each page becomes **one** "paragraph" (`dbl-newlines = 0` on every page), which is then truncated at 2000 chars. Any `.txt` file that is hard-wrapped without blank lines loses everything past 2000 chars the same way.

Empirically proven by running the current `parseFile → chunk` chain over the ingested `data/4c3b6865-….pdf` (docId matches `data/chunks.json`):

```
page 1 chars 3296 dbl-newlines 0   → chunk 0 len 2000  (1296 chars lost)
page 2 chars 4430 dbl-newlines 0   → chunk 1 len 2000  (2430 chars lost)
page 3 chars 1574 dbl-newlines 0   → chunk 2 len 1574  (kept)
total chars 9300 kept 5574 lost 3726 (40%)
```

Consequences against the project's core rubric: retrieval never sees the lost text, `verify()` can never approve a quote from it, and the tool will assert "the document is silent" (rubric 2/3 safety-cap criteria) on content the document actually states. The chunk-list UI also renders truncated text as if it were the whole chunk. The fixtures never exercise this path (longest fixture paragraph is 331 chars), which is why 21/21 tests pass despite the loss. `docs/api.md:40-41` says chunks are "capped at 2000 chars" but nowhere sanctions dropping the remainder — contract-first rule means the contract wording and code should be fixed together.

**Fix:**
```js
// lib/chunk.js — window long paragraphs instead of discarding the tail
for (const part of text.split(/\r?\n\s*\r?\n/)) {
  const t = part.trim();
  if (!t) continue;
  for (let i = 0; i < t.length; i += MAX_CHUNK_CHARS) {
    out.push({ id: out.length, page, text: t.slice(i, i + MAX_CHUNK_CHARS) });
  }
}
```
And in `lib/parse.js:26`, preserve line structure so the chunker can split PDF pages at paragraph boundaries instead of mid-word windows:
```js
text: tc.items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join('').replace(/[ \t]+/g, ' ').trim()
```
Add a test with a >2000-char paragraph asserting no text is lost (sum of chunk texts covers the input).

### CR-02: Localhost API has no Host/Origin validation — any web page can mutate the stored document, and DNS rebinding exposes document content

**File:** `server.js:26-47` (middleware stack) and `server.js:119-122` (listen)
**Severity:** BLOCKER

**Issue:** The server relies solely on binding `127.0.0.1` (register entry T-01-07, `01-SECURITY.md:41`) but never validates the `Host` header or `Origin` of requests. Two concrete attacks while the app is running:

1. **Cross-site state mutation (no rebinding needed):** a malicious page can auto-submit an HTML form (`POST multipart` is a navigation — no CORS preflight) to `http://127.0.0.1:3000/api/upload`, silently replacing the victim's stored legal document with attacker-chosen content and writing attacker files under `./data/` (20 MB each). The victim's UI/CLI then answers questions against the wrong document, and there is no rate limit (itself deferred) to stop repetition.
2. **DNS rebinding → content disclosure:** because no `Host` check exists, an attacker-controlled domain can re-resolve to `127.0.0.1` and become same-origin with the API — CORS no longer applies — then call `POST /api/ask` with `application/json` and read `answer`/`quote` responses, extracting the victim's document content piecemeal. `GET /api/doc/:id` alone is protected only by `docId` (sha256) being unguessable; `/api/ask` needs no id.

`01-SECURITY.md` shows `threats_open: 0` with no accepted risks, so this is a missed threat, not a documented acceptance. This is a security vulnerability in a tool whose rubric criterion 4 (privacy) carries a 40/100 safety cap.

**Fix:** add a guard as the first middleware in `server.js`:
```js
app.use((req, res, next) => {
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(127\.0\.0\.1|localhost):3000$/.test(origin)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
});
```
Also add T-01-08 (DNS rebinding / cross-origin mutation) to the threat register.

### Warnings

### WR-01: `/api/ask` error body deviates from the binding contract

**File:** `server.js:97`
**Severity:** WARNING

**Issue:** Returns `{ error: 'no document' }`, but `docs/api.md:98` (marked "binding cross-phase contract… Change this file first") specifies `**400** { "error": "no document ingested" }`. Any consumer written against the contract (Phase 2 UI, verifier scripts, judge curl checks) will mismatch.

**Fix:** `return res.status(400).json({ error: 'no document ingested' });` — or change `docs/api.md:98` first if the shorter string is intended (contract-first either way).

### WR-02: `verify()` runs against the retrieved top-k only — wrong page citations and false "not found in source" verdicts

**File:** `lib/pipeline.js:101`
**Severity:** WARNING

**Issue:** `verify(reply.quote, top)` checks only the 6 retrieved chunks, while `docs/api.md:59-62` defines `quote` as "must occur verbatim … in a stored chunk" and `page` as "the page of the **earliest chunk** whose text contains the verified quote". Two failures follow:
- If identical text occurs in an earlier chunk that was not retrieved (common in agreements: repeated boilerplate/headers), the answer cites a later page than the contract requires.
- If a quote matches a stored chunk outside the top-k but none inside it, the user gets `quote not found in source` — a statement that is false against the stored document.

**Fix:**
```js
const checked = verify(reply.quote, doc.chunks); // full store, id-ascending per contract §1
```
(`top` remains what the model is shown; the gate should judge against the whole store.)

### WR-03: `ingest()` cache-hit path ignores `displayName` — stale filename served for identical bytes under a new name

**File:** `lib/pipeline.js:47-57`
**Severity:** WARNING

**Issue:** On a `docId` cache hit the stored object is returned unchanged, so `displayName` is dropped — contradicting the function's own comment (`lib/pipeline.js:40-41`: "displayName overrides the stored filename") and `docs/api.md:36` ("original file name as supplied by the uploader"). Concrete sequence: upload `rental.txt` (bytes X), then upload the same bytes renamed `rental-final.pdf` → `POST /api/upload` responds with `rental-final.pdf`, but `GET /api/doc/:id` (what `public/app.js:111-118` renders) returns the stale `rental.txt`.

**Fix:**
```js
if (/* existing cache-hit shape checks */) {
  if (displayName && stored.filename !== displayName) {
    stored.filename = displayName;
    await fs.writeFile(STORE_PATH, JSON.stringify(stored));
  }
  return stored;
}
```

### Info

### IN-01: `lib/embed.js`, `lib/pipeline.js`, and `server.js` have no tests

**File:** `package.json:8`
**Severity:** Info
**Issue:** `npm test` runs `lib/*.test.js cli.test.js public.test.js` — but `embed.js`, `pipeline.js`, and `server.js` ship with zero test files. The ingest cache logic, cosine top-k ordering, and every HTTP error mapping are untested; 21/21 passing overstates coverage (e.g., CR-01's truncation path is untested).
**Fix:** add `lib/embed.test.js` (stubbed `fetch`: prefixing, 768-dim validation, top-k ordering) and a `server.test.js` (supertest-style: 400s, error-body contract strings — which would have caught WR-01).

### IN-02: Dead "RED shim" import fallbacks mask module-load failures

**File:** `lib/verify.test.js:8`, `lib/parse.test.js:9`, `lib/chunk.test.js:8`
**Severity:** Info
**Issue:** `import('./x.js').catch(() => ({ verify: () => undefined }))` was a pre-implementation scaffold; the modules now exist, so the catch is dead code. If a real import error ever occurs (typo, syntax error), tests fail with confusing `deepEqual(undefined, …)` mismatches instead of the actual load error.
**Fix:** replace with a direct `import { verify } from './verify.js'`.

### IN-03: CLI prints model/document-derived text raw — multi-line quotes break the line contract; control chars pass to the terminal

**File:** `cli.js:23-25`
**Severity:** Info
**Issue:** `QUOTE:` content comes from the verified quote, which for `.txt` chunks may contain single newlines (chunk splitting only breaks on blank lines) — the output then contains unprefixed lines, deviating from the `docs/api.md:113-118` "lines starting exactly with `ANSWER:/QUOTE:/PAGE:`" table. Document-embedded ANSI/C0 control characters also reach stdout unescaped (terminal escape injection vector from hostile document text).
**Fix:** flatten whitespace and strip control characters on output: `const clean = (s) => s.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ');` before printing.

### IN-04: `data/chunks.json` is stale, gitignored runtime state (scope-list anomaly) with mojibake

**File:** `data/chunks.json`
**Severity:** Info
**Issue:** Not tracked by git (`git ls-files data/` empty; absent from `git diff 3f44bc6..HEAD`; `.gitignore` covers `data/`) — it appears in the workflow's file list in error. Content notes from skim: it holds leftover demo state for a **non-fixture** PDF (`leave-license-agreement-maharashtra.pdf`, an AgreementDesk.in specimen — local only, so no G4/commit issue); chunk `text` values contain `U+FFFD` mojibake from PDF font encoding; two texts are length 2002, i.e. generated by an older chunker than the current 2000 cap.
**Fix:** flag the scope-list discrepancy to the orchestrator; delete `data/chunks.json` (plus the leftover `data/*.pdf`/`data/*.txt` uploads) before the fresh-clone run-through so demo state is reproducible, and expect (not ignore) `U+FFFD`-bearing text as evidence of extraction-quality work in Phase 2.

### IN-05: Doc-fetch failure after a successful upload renders the misleading "scanned images" message

**File:** `public/app.js:109-121` (fallback) with `public/app.js:142-147` (E10 render)
**Severity:** Info
**Issue:** If `POST /api/upload` succeeds but `GET /api/doc/{id}` fails, the code falls back to `chunks: []` and renders the E10 no-chunks message — "The file may be scanned images — try a text-based PDF" — which is false: chunks exist and were counted in the upload response (`body.chunks`).
**Fix:** on `docRes` failure, keep the header from `body` (`{filename, chunks: body.chunks}`) or show an error banner; only show E10 when the server itself reported `chunks: 0`.

### IN-06: Unmatched routes/methods return Express default HTML 404, not `{ error }` JSON

**File:** `server.js:106-117` (static + error middleware; no JSON 404 fallthrough)
**Severity:** Info
**Issue:** `docs/api.md:106-107` states "Error bodies are deterministic `{ "error": … }` JSON; no stack traces". Requests such as `GET /api/upload` or `GET /api/nope` bypass all handlers and get Express's default HTML 404 body — a contract deviation a judge probing routes would see.
**Fix:** after the static middleware, add `app.use((req, res) => res.status(404).json({ error: 'not found' }));` before the error middleware (keep the static fallthrough so `/` still serves).

### IN-07: `.txt` input assumed UTF-8 — UTF-16/ANSI files (common on Windows) garble silently

**File:** `lib/parse.js:10`
**Severity:** Info
**Issue:** `fs.readFile(filePath, 'utf8')` on a UTF-16LE or Windows-1252 `.txt` yields NUL-interleaved or `U+FFFD` text that flows into chunks, embeddings, citations and the UI with no error. UTF-16 input in particular poisons retrieval (garbage embeddings) so answers degrade to "document is silent" with no diagnostic.
**Fix:** detect a UTF-16 BOM (`FF FE`/`FE FF`) and decode accordingly; replace or reject lone-surrogate/`U+FFFD`-heavy output with a clear `unsupported encoding` error.

### IN-08: Store validation checks only `chunks[0].embedding`; `askStored` validates no chunk shape

**File:** `lib/pipeline.js:48-55`, `lib/pipeline.js:90-92`
**Severity:** Info
**Issue:** The cache probe validates only the first chunk's 768-dim embedding; a partially corrupted `chunks.json` passes the cache check. `askStored` checks only `doc.chunks` is a non-empty array — entries with missing/non-string `text` or `page` then flow into `buildUser` (`undefined` interpolated) and `verify()` (`norm(undefined)` throws `TypeError`), surfacing as a generic 503 `Processing failed on the local model` rather than a store-corruption diagnosis.
**Fix:** validate a sample of chunk entries (`typeof text === 'string'`, `Number.isInteger(page)`); on failure treat the store as unusable (`no document` / re-ingest) instead of throwing mid-answer.

### IN-09: Unhandled throw on the success path leaves the UI permanently stuck in `busy` state

**File:** `public/app.js:116`
**Severity:** Info
**Issue:** If a `200` response parses to a non-object (`body = null` via the `res.json().catch(() => null)` at `public/app.js:94`), `body.docId` at line 116 throws **outside** any try/catch: `upload()` rejects, `endLoading()` never runs, and `busy` stays `true` — CTA disabled, spinner forever, requiring a page reload. Precondition (non-JSON 200) is not produced by today's server, so this is defense-in-depth, not a live bug.
**Fix:** guard the success path: `if (!body || typeof body.docId !== 'string') { showBanner(ERR_MODEL); endLoading(); return; }` (or wrap lines 109-122 in try/catch calling `endLoading()`).

### IN-10: "Remove document" clears only client state; server retains the stored file and chunks

**File:** `public/app.js:170-182`
**Severity:** Info
**Issue:** The confirm handler resets local UI state only. `./data/chunks.json` and the uploaded file persist, so the document remains readable via `GET /api/doc/:id` and `POST /api/ask` after "removal". The dialog copy is scoped honestly ("deleted from this session", `public/index.html:65`) and `docs/api.md` defines no DELETE route — so this is contract-consistent — but judges probing privacy hygiene will find the data still on disk after a destructive-looking action.
**Fix:** Phase 2: add `DELETE /api/doc/:id` to the contract (remove `chunks.json` + stored upload) and call it from `confirmRemove`; until then consider a clarifying note in the dialog.

---

## Deferred Findings

Per the orchestrator's scope delegation — logged, not blocking:

1. **PDF input validation hardening (Phase 2).** Page cap is checked only post-parse (`server.js:59-63`), so a hostile/large PDF is fully parsed before rejection; zip-bomb/structure limits beyond `isEvalSupported: false` are absent by plan. Observation while testing: pdfjs emits `Ensure that the standardFontDataUrl API parameter is provided` (`lib/parse.js:16-20`) — benign for egress (no URL is configured, so no font fetch occurs), but worth passing the local `node_modules/pdfjs-dist/standard_fonts/` path to silence it before the judge run.
2. **Upload temp-file lifecycle (Phase 2).** `POST /api/upload` deletes the stored bytes on parse failure and page-cap rejection (`server.js:56,61`) but **not** when `ingest()` fails afterwards (`server.js:65-70`, e.g. Ollama down mid-embed) — orphan UUID files accumulate under `./data/`, as do all previously superseded uploads on successful re-upload.
3. **Rate limiting (Phase 3).** Absent by design; interacts with CR-02 (unauthenticated cross-origin writes) — the Host/Origin fix should land first.

---

_Reviewed: 2026-10-18T11:16:21Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
