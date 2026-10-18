# Phase 1: Contract + Vertical Slice - Research

**Researched:** 2026-10-18
**Domain:** Node 24 offline document pipeline — pdfjs-dist page-aware extraction, Ollama local inference/embeddings, deterministic citation verification
**Confidence:** HIGH (every load-bearing claim verified by live probe on this machine or official docs this session)

## Summary

The repo is greenfield for code but rich in contracts: `git init` + commits exist, `LICENSE`/`README.md`/`.gitignore` are done, `.gitignore` already excludes `chunks.json`, `data/`, `uploads/`, `node_modules/`, `.opencode/`, `reference/` [VERIFIED: .gitignore read 2026-10-18]. There is **no** `package.json`, `lib/`, `server`, `cli.js`, `docs/`, `scripts/` or `fixtures/` yet — everything in this phase is built, not reused [VERIFIED: directory listing this session]. The runtime stack is pre-installed and was probed live: Node v24.19.0, Ollama 0.40.6 with `gemma3n:e2b` (7.8 GB), `embeddinggemma` (621 MB, outputs **768-dim** vectors — confirmed by a live `/api/embed` call), and `gemma3:4b` fallback [VERIFIED: live probes 2026-10-18].

The two highest-risk technical unknowns were both resolved by direct experiment in a temp probe directory. First, **pdfjs-dist v6 (6.4.299) works in Node 24 only via the legacy build** — a generated 2-page PDF was extracted page-by-page through `pdfjs-dist/legacy/build/pdf.mjs` (both pages returned correct text), while `pdfjs-dist/build/pdf.mjs` printed "Please use the `legacy` build in Node.js environments." and then crashed [VERIFIED: probe 2026-10-18, output quoted in §Code Examples]. Second, **Ollama JSON mode on `gemma3n:e2b` works and is fast enough for a demo**: a 29-token structured reply generated in ~11 s wall clock with ~58 tok/s eval on this CPU box [VERIFIED: live `/api/chat` probe 2026-10-18]. One non-obvious quality requirement surfaced: **EmbeddingGemma requires task prefixes** (`task: search result | query: ` for queries, `title: none | text: ` for passages) or retrieval quality degrades [CITED: huggingface.co/blog/embeddinggemma; ai.google.dev/gemma/docs/embeddinggemma]. These prefixes must go into `lib/embed.js` (document side) and the query path from day one — retrofitting them later invalidates any tuning done without them.

**Primary recommendation:** build in this order — `docs/api.md` contract → `lib/parse.js` (legacy pdfjs, ESM) → `lib/chunk.js`/`lib/embed.js` (prefix-aware, `chunks.json`) → `lib/verify.js` (normalize-then-substring gate) → `lib/ollama.js` → `cli.js` → Express + multer upload shell → fixtures — with the fabricated-quote rejection test run as soon as `verify.js` exists, not at the end.

## User Constraints (from CONTEXT.md)

*(copied verbatim from `.planning/phases/01-contract-vertical-slice/01-CONTEXT.md`, status: Ready for planning)*

### Locked Decisions (## Decisions)
- **D-01:** Phase 1 demos with 2 self-authored synthetic documents — a rental agreement and an employment contract — not CUAD samples. — **Reversibility:** reversible — swapping or adding fixtures later is local authoring work with no consumer lock-in beyond tests.
- **D-02:** Fixtures read Indian-style (landlord/tenant with security deposit, notice period, maintenance charges; employment letter with probation and termination clauses), written in plain English to stay inside the stated document scope.
- **D-03:** Each fixture opens with an in-document banner line ("SYNTHETIC SAMPLE — fictitious parties, created for this demo, released under CC0 1.0") and `fixtures/SOURCES.md` records sources and licence. Party names are clearly sample names. This is the gate G4 evidence path.
- **D-04:** Strict roadmap split — Phase 1 browser = upload shell + chunk list with page numbers; Q&A happens at the CLI. P3 builds Phase 2's full Q&A UI once its UI-SPEC exists, avoiding rework. — **Reversibility:** costly — pulling Q&A UI forward before the Phase 2 UI contract exists means duplicated and reshaped work.
- **D-05:** Checkpoint 1 is **one clean commit before 13:30 IST**, and **Stage 1 evaluation begins at 13:30 IST** (organizer update via user, 2026-10-18) — the commit must land before evaluation starts. Supersedes the earlier 13:00 reading and the original 12:30 demo-gate reading in ROADMAP.md; planning targets 13:30 IST.

### the agent's Discretion
- Proof ritual at Checkpoint 1: casual connection spot-check during a full run (e.g. `Get-NetTCPConnection`); the formal `scripts/privacy-evidence.ps1` + `evidence/privacy-report.md` stays Phase 2 per roadmap.
- Upload limits at the shell: reject files over 20 MB or PDFs over ~300 pages with a clear message, never a crash (graceful-failure depth is Phase 3; exact limits up to planner).
- Storage location: uploaded files and `chunks.json` live under `./data/`, gitignored — keeps temp hygiene and OneDrive-synced leakage paths contained to one declared directory.

### Deferred Ideas (OUT OF SCOPE)
- CUAD real-world sample document(s) — deferred to Phase 3 for robustness/test-material breadth (fetch + attribution needed; synthetic fixtures cover Phases 1–2)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ING-01 | Upload PDF/TXT through browser UI | multer diskStorage → `./data/`, 20 MB limit via `limits.fileSize`; UI per 01-UI-SPEC |
| ING-02 | Ask a question in plain English | `cli.js ask <doc> "<question>"`; `/api/ask` lands Phase 1 as contract, UI in Phase 2 |
| ING-03 | Page-aware extraction | pdfjs legacy build per-page `getTextContent()` → `[{page, text}]`; TXT path = single page 1 |
| GRD-01 | Verbatim quote verified before display (hard gate) | `lib/verify.js` normalize-then-substring; probe-verified normalization list (NFKC, dashes, whitespace) |
| PRV-01 | No socket other than `127.0.0.1:11434` | no external CDN/deps in `public/`; Ollama base URL `http://127.0.0.1:11434`; `Get-NetTCPConnection` spot-check |
| MDL-01 | `gemma3n:e2b` via local Ollama | `/api/chat` `format:"json"` verified live (11 s, ~58 tok/s eval); fallback `gemma3:4b` |
| MDL-02 | `embeddinggemma` retrieval embeddings | `/api/embed` `{model, input}` → `{embeddings:[[768]]}` verified live; task prefixes required |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PDF/TXT parsing, page awareness | Library (`lib/parse.js`) | — | pure function over bytes; no server involvement |
| Chunking + embedding + retrieval | Library (`lib/chunk.js`, `lib/embed.js`) | — | one-document-at-a-time, `chunks.json` on disk |
| Citation verification | Library (`lib/verify.js`) | — | code-level hard gate, callable from CLI, API and tests identically |
| LLM calls | Library (`lib/ollama.js`) | external `127.0.0.1:11434` | single choke point for the only allowed socket |
| HTTP surface | API (Express) | — | `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id`, static `public/` |
| Upload shell + chunk list UI | Browser (vanilla JS) | — | per D-04; no Q&A UI this phase |
| CLI entry | Process (`cli.js`) | — | Checkpoint 1 gate runs without the server |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `express` | 5.3.0 [VERIFIED: npm registry] | HTTP server, static `public/`, JSON bodies | planned in tasks/plan.md:14; official Express project |
| `multer` | 2.4.0 [VERIFIED: npm registry] | `multipart/form-data` upload → diskStorage | listed as official middleware on expressjs.com [CITED: expressjs.com/en/resources/middleware/multer]; only dependency needed for file upload |
| `pdfjs-dist` | 6.4.299 [VERIFIED: npm registry] | page-aware PDF text | mandated by constraints; **must import from `pdfjs-dist/legacy/build/pdf.mjs`** (verified probe) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` (built-in) | Node 24 | unit tests for verifier/chunker | verifier rejection test as soon as `verify.js` exists |
| `fetch` (built-in) | Node 24 | Ollama HTTP client in `lib/ollama.js` | no HTTP client dependency needed |
| `crypto`/`path`/`fs` (built-in) | Node 24 | doc IDs (hash of file), paths | never hand-roll |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `multer` | `busboy` directly | multer is the Express-blessed wrapper; busboy adds code for zero gain |
| `pdfjs-dist` legacy build | `pdf-parse` or spawning `pdftotext` | forbidden — constraint mandates pdfjs-dist; also poppler not guaranteed on Windows |
| Express 5 | Express 4 | 5 is current on npm; multer sits on Express's own middleware page — either works, pin exact version |

**Installation** (pin exact versions in `package.json` — DOC-01 requires pinned deps):
```bash
npm install express@5.3.0 multer@2.4.0 pdfjs-dist@6.4.299
```

**Module system:** set `"type": "module"` in `package.json`. pdfjs-dist v6 is ESM-only (`.mjs` entry points — verified from the installed package layout: `build/pdf.mjs`, `legacy/build/pdf.mjs` [VERIFIED: probe install 2026-10-18]); Node 24 runs ESM natively with no build step, so ESM is the zero-friction choice. All `lib/`, `server` and `cli.js` files use `import`.

## Package Legitimacy Audit

> Gate run via `gsd-tools query package-legitimacy check --ecosystem npm express multer pdfjs-dist` (2026-10-18).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `express` | npm | long-established (v5.3.0 published 2026-10-09) | 86.9 M/wk | github.com/expressjs/express | SUS (`too-new` recency signal only) | Approved with note — see below |
| `multer` | npm | long-established (2.4.0 published 2026-09-14) | 12.9 M/wk | github.com/expressjs/multer | OK | Approved |
| `pdfjs-dist` | npm | long-established (6.4.299 published 2026-10-03) | 20.0 M/wk | github.com/mozilla/pdf.js | SUS (`too-new` recency signal only) | Approved with note — see below |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `express`, `pdfjs-dist` — both flagged **only** by the recency heuristic (recent patch release), on canonical packages from the official `expressjs` and `mozilla` orgs with 20–87 M weekly downloads. `pdfjs-dist` was additionally proven safe by running it in the probe this session. Per protocol the planner should gate the first install behind a quick human ack, but no substitution is warranted. Both were also registry-verified (`npm view`): `express` 5.3.0, `multer` 2.4.0, `pdfjs-dist` 6.4.299 [VERIFIED: npm registry]. No package carries a `postinstall` script [VERIFIED: npm registry — `scripts.postinstall` null for all three].

## Existing Repo State

| Path | Status | Action in Phase 1 |
|------|--------|-------------------|
| `.git/` | exists, 10+ commits | reuse; D-05 requires one clean checkpoint commit |
| `LICENSE` (MIT), `README.md`, `.gitignore` | done | reuse; `.gitignore` already covers `chunks.json`, `data/`, `uploads/`, `evidence/*.tmp` |
| `tasks/plan.md`, `tasks/todo.md` | done | reuse as role checklist (P1/P2/P3) |
| `.planning/*` | done | reuse; do not edit |
| `reference/` | gitignored, local only | ignore |
| `package.json`, lockfile | **missing** | create — pinned exact deps; run `npm install` to generate committed lockfile |
| `docs/` | **missing** | create `docs/api.md` (Task 0 contract: chunks.json shape, answer schema, routes) |
| `lib/parse.js`, `lib/chunk.js`, `lib/embed.js`, `lib/ollama.js`, `lib/verify.js` | **missing** | build (tasks/plan.md:66-70) |
| `cli.js`, server entry, `public/` | **missing** | build |
| `fixtures/` | **missing** | 2 synthetic docs + `fixtures/SOURCES.md` (D-01..D-03) |
| `scripts/` | **missing (empty)** | Phase 1 needs only the optional `Get-NetTCPConnection` spot-check inline; `privacy-evidence.ps1` is Phase 2 |

**Reusable assets in code: none — this is a greenfield build.** The only "existing patterns" are the documented conventions in AGENTS.md/CONVENTIONS.md (single-word lowercase modules in `lib/`, deterministic data shapes over exceptions, normalise-before-match, refusal paths) and the component map in ARCHITECTURE.md — follow them verbatim.

## Architecture Patterns

### System flow (Phase 1 slice)

```
Browser (public/) ──POST /api/upload (multipart, 20 MB cap)──► Express
CLI: node cli.js ask <doc> "<q>" ────────────────┐             │
                                                 ▼             ▼
                              lib/parse.js  pdfjs LEGACY build → [{page,text}]   (TXT → [{page:1,text}])
                                     │
                              lib/chunk.js  per-page paragraphs → chunks {id, page, text}
                                     │
                              lib/embed.js  POST /api/embed (doc prefix) → chunks.json (768-dim vectors)
                                     │
        question ──► embed (query prefix) ──► cosine top-k 6 ──► lib/ollama.js POST /api/chat format:"json"
                                                                     │
                              lib/verify.js  normalize(quote) ∈ normalize(chunk.text)? ── keep | DROP(unverifiable)
                                                                     │
                                                CLI stdout: {answer, quote, page} | unverifiable report
```

Decision point (hard gate): a quote that fails the substring check is **dropped and reported**, never displayed — this is the GRD-01 contract and exists from the first slice.

### Recommended Project Structure
```
lib/
├── parse.js      # PDF (legacy pdfjs) / TXT → [{page, text}]
├── chunk.js      # per-page paragraphs → chunk records
├── embed.js      # /api/embed client + task prefixes + cosine top-k
├── ollama.js     # /api/chat client: format:"json", retries, model fallback
└── verify.js     # normalise + verbatim substring gate
cli.js            # ask <file> "<question>" — Checkpoint 1 entry
server.js         # Express app: /api/upload, /api/ask, /api/doc/:id, static public/
public/           # index.html + app.js (upload shell + chunk list only, per D-04)
docs/api.md       # Task 0 contract
fixtures/         # rental.txt (or .pdf), employment.txt + SOURCES.md (D-03)
data/             # gitignored runtime: uploads + chunks.json (discretion: storage location)
```

### Pattern 1: pdfjs-dist legacy build, per-page extraction (VERIFIED)
**What:** import the legacy ESM build; iterate `numPages`; `page.getTextContent()` per page; join item `str`s.
**When:** every PDF parse, always the legacy build — the modern build crashes on Node 24 (probe output below).
**Example (probe-verified, adapted from the session probe):**
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
Notes: no worker config needed in Node (fake worker is automatic); no `destroy()` call — v6's `getDocument` result has no `.destroy()` (probe: "doc.destroy is not a function"), let the process exit or call `doc.cleanup()`. TXT path: read as UTF-8, return `[{page: 1, text}]`.

### Pattern 2: EmbeddingGemma task prefixes (retrieval quality — do not skip)
**What:** prefix every passage with `title: none | text: ` before `/api/embed`, and every question with `task: search result | query: `.
**When:** always; prefixes are part of the model's training contract [CITED: huggingface.co/blog/embeddinggemma; ai.google.dev/gemma/docs/embeddinggemma/inference-embeddinggemma-with-sentence-transformers].
```javascript
// Source: https://huggingface.co/blog/embeddinggemma (verbatim prefix strings)
const PREFIX = { query: 'task: search result | query: ', document: 'title: none | text: ' };
// embed document: PREFIX.document + chunk.text   |   embed question: PREFIX.query + question
```
Response shape (probe-verified): `POST http://127.0.0.1:11434/api/embed` body `{model:'embeddinggemma', input:'...'}` → `{ embeddings: [[/* 768 floats */]] }` — 768 dims confirmed live.

### Pattern 3: chunks.json + cosine top-k 6 (no vector DB)
**Shape (contract to write in docs/api.md first):**
```json
{
  "docId": "<sha256 of file>",
  "filename": "rental.txt",
  "chunks": [ { "id": 0, "page": 1, "text": "…verbatim chunk text…", "embedding": [0.0123, "…768 floats…"] } ]
}
```
Retrieval: embed question with query prefix → dot product against L2-normalised stored vectors → sort desc → take 6. ~20 lines, no dependency. Chunking rule that eliminates the page-mapping pitfall entirely: **split each page's text into paragraph chunks *within* the page** — a chunk's page is its source page by construction; chunks never span pages. Cap chunk text ~2000 chars (embeddinggemma context is generous — 8 K native; Ollama default 2 K is plenty at this size).

### Pattern 4: deterministic quote verifier (GRD-01 hard gate)
**What:** normalise both the model's `quote` and the stored chunk text, then exact substring test.
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
Phase 1 only needs keep/drop + page; the full tier schema (`stated`/`interpretation`/`not_in_document`, `kind`, `escalate`) is Phase 2 per roadmap — but write the answer object's shape in `docs/api.md` now so Phase 2 extends, not reshapes.

### Pattern 5: Ollama client with JSON mode + fallback
**What:** `POST /api/chat` with `format: "json"`, `stream: false`, `options: { num_predict: ~300, temperature: 0 }`, base URL `http://127.0.0.1:11434`. Retry once, then fall back `gemma3n:e2b` → `gemma3:4b` [VERIFIED shape: live probe returned valid JSON `{"quote":"…","plain":"…"}` in 11.2 s, eval_count 29, ~58 tok/s eval].
**Limit to know:** `format:"json"` guarantees *parseable* JSON, not a *schema* — always validate fields in code and treat missing/garbage fields as a retryable failure. Keep top-k 6 chunks inside the prompt to stay fast on CPU.

### Anti-Patterns to Avoid
- **Modern pdfjs build in Node:** crashes (`hashOriginal.toHex is not a function`) after warning — always `pdfjs-dist/legacy/build/pdf.mjs` [VERIFIED: probe].
- **Trusting the prompt for grounding:** the prompt asks for quotes; `lib/verify.js` *enforces* them. Never render a quote the verifier has not approved (this is also the Phase 3 prompt-injection defence — injection can at worst produce a dropped quote).
- **Any non-loopback URL or CDN asset:** fonts/icons are system/inline only per 01-UI-SPEC; Ollama base URL hard-coded to `127.0.0.1:11434`; no analytics, no `npm` runtime fetches.
- **Writing to `os.tmpdir()` / system temp:** uploads and `chunks.json` go under `./data/` only (discretion + project temp-hygiene rule). pdfjs text extraction writes no temp files (probe: none appeared).
- **A vector DB, an ORM, a build step, TypeScript:** explicitly out of scope (REQUIREMENTS.md Out of Scope).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multipart upload parsing | manual boundary parsing | `multer` 2.4.0 | stream limits, disk storage, path-traversal safety |
| PDF text extraction | regex over raw PDF bytes | `pdfjs-dist` legacy build | content streams, encodings, cross-reference repair |
| HTTP client to Ollama | `http.request` boilerplate | built-in `fetch` | zero-dep, adequate for localhost |
| Vector store | anything | JSON + 20-line cosine | one document at a time; DB is a dependency, not a feature |
| Unicode normalisation table | hand-rolled ligature map | `String.prototype.normalize('NFKC')` | covers ligatures/full-width; plus the dash/soft-hyphen regexes above |

## Common Pitfalls

1. **Modern pdfjs build silently broken on Node** — crash at first page. *Avoid:* legacy import path from day one (probe-verified). *Warning sign:* the "Please use the `legacy` build" warning line.
2. **EmbeddingGemma without task prefixes** — retrieval works but ranks worse; tuning done without prefixes is wasted. *Avoid:* prefixes in `lib/embed.js` and query path (Pattern 2).
3. **Fabricated-quote near-misses** — model paraphrases; strict match drops a good answer, loose match admits a lie. *Avoid:* normalise (NFKC, dashes, soft hyphens, hyphenation, whitespace) then exact substring; on failure report "unverifiable" honestly — do NOT fuzzy-display. *Test first thing:* verifier unit test with (a) verbatim quote → pass, (b) paraphrase → reject, (c) invented quote → reject.
4. **Chunks spanning pages** — a chunk built from concatenated document text cannot cite a page. *Avoid:* chunk within a page (Pattern 3); page number rides on every chunk by construction.
5. **JSON mode treated as schema** — missing `quote` field crashes naive code. *Avoid:* validate the parsed object; retry/fallback model on invalid shape.
6. **Prompt injection via document text** — legal docs may contain "ignore previous instructions". *Avoid (by construction):* retrieved chunks enter only as delimited quoted context in the user message; the system prompt forbids using anything else; the verifier makes an injected fabricated quote unrenderable (ROB-02 is Phase 3, but the gate exists from Phase 1).
7. **Temp/OneDrive leakage** — this repo lives inside a OneDrive-synced folder. *Avoid:* all runtime artifacts under gitignored `./data/`; never `os.tmpdir()`; the probe confirmed pdfjs writes no temp files for text extraction.
8. **`doc.destroy()` missing in pdfjs v6** — probe error "doc.destroy is not a function". *Avoid:* don't call it; `doc.cleanup()` if needed.

## Code Examples

### CLI ask flow (Checkpoint 1 shape)
```javascript
// node cli.js ask fixtures/rental.txt "what is the notice period?"
// 1. parse → chunk → embed → chunks.json (skip if docId matches existing file)
// 2. qEmb = embed(PREFIX.query + question)
// 3. top = cosineTopK(chunks, qEmb, 6)
// 4. resp = await chat(gemma3n:e2b, format:'json', system, user with quoted chunks)
// 5. obj = JSON.parse(resp) ; ok = verify(obj.quote, top)
// 6. ok ? print answer + quote + `p. ${page}` : print "UNVERIFIABLE: quote not found in source"
```

### Upload route (multer, size-capped, data/ only)
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

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | v24.19.0 | — |
| npm | deps | ✓ | 11.17.0 | — |
| git | commits, D-05 | ✓ | 2.51.0.windows.1 | — |
| Ollama server | MDL-01/02 | ✓ (probe answered) | 0.40.6 | — |
| `gemma3n:e2b` (7.8 GB) | answers | ✓ (`ollama list`) | dae166dc6a5e | `gemma3:4b` (3.3 GB, local) |
| `embeddinggemma` (621 MB) | retrieval | ✓ (live embed probe, 768-dim) | 85462619ee72 | — |
| PowerShell | connection spot-check | ✓ (win32 host) | — | — |

**Missing dependencies with no fallback:** none — every runtime dependency is pre-installed and probe-verified.

## Checkpoint 1 Verification (success-criteria evidence commands)

*(Config sets `workflow.nyquist_validation: false`, so no formal Nyquist section; these are the concrete proof commands for the four success criteria.)*

| Criterion | Proof command / action | Expected |
|-----------|------------------------|----------|
| SC1 browser upload + chunk list | start `node server.js`, upload `fixtures/rental.txt` in browser | header "rental.txt — N chunks"; rows show `p. {page}` chips |
| SC2 CLI verified citation | `node cli.js ask fixtures/rental.txt "what is the notice period?"` | plain answer + verbatim quote + page |
| SC2 rejection | `node cli.js ask fixtures/rental.txt "<question>" --inject-fake-quote` *(or the node:test verifier unit: paraphrase + invented quote)* | `UNVERIFIABLE` report, no quote displayed |
| SC3 local models offline | disconnect Wi-Fi (or rely on monitor), rerun CLI ask | answer still produced; `ollama ps` shows gemma3n/e2b loaded |
| SC4 localhost-only | during a full run: `Get-NetTCPConnection -State Established \| ? { $_.RemoteAddress -notmatch '^(127\.|::1|0\.0\.0\.0)' }` | empty result |

## Security Domain

*(security_enforcement: true, ASVS level 1 in `.planning/config.json`.)*

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | multer `limits.fileSize` 20 MB; extension allow-list `.pdf/.txt`; page cap ~300 post-parse; PDF parsed with `isEvalSupported: false` |
| V4 Access Control | no | single-user local demo, localhost binding only |
| V6 Cryptography | no | no crypto surface (doc IDs via `crypto.randomUUID`/sha256 are identifiers, not controls) |

Threat notes for this stack: uploaded PDFs are hostile input — pdfjs with `isEvalSupported:false` disables JS-eval paths; never `eval` model output beyond `JSON.parse` inside try/catch; prompt injection is contained by the code-level verifier (pitfall 6); the app binds/queries only loopback, satisfying PRV-01 by construction.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | multer 2.4.0 works cleanly with Express 5.3.0 (official Express middleware page lists multer; Express-5 compat not explicitly documented) | Standard Stack | low — fallback to Express 4.21 pinned; smoke test at install catches it in minutes |
| A2 | `gemma3n:e2b` reliably produces the `{quote, plain}` JSON shape at temperature 0 on multi-chunk prompts (single short probe verified) | Pattern 5 | medium — retries + `gemma3:4b` fallback already in design; larger prompts may need `num_ctx` bump |
| A3 | 768-dim vectors × ~200 chunks × 8 bytes ≈ 1.3 MB `chunks.json` — negligible load cost per ask (re-embed question only) | Pattern 3 | low — one-document scale |
| A4 | Legacy pdfjs needs no `standardFontDataUrl`/`cmapUrl` for text-based fixtures (clean probe run); scanned/image PDFs will yield zero text → the UI-SPEC no-chunks message covers it | Pattern 1 | low — fixtures are text-based by construction (D-02) |

## Open Questions

1. **`format: "json"` vs schema `format` object** — Ollama supports JSON-schema `format` for some models; untested on gemma3n here. *Recommendation:* stay with `format:"json"` + in-code validation this phase (probe-proven); revisit only if retries are frequent.
2. **Fixtures as .txt or self-generated .pdf** — D-01/D-02 don't fix the format. *Recommendation:* at least one `.txt` (zero-parse-risk) and consider one small `.pdf` so the pdfjs path is demoed; generating a valid PDF without deps is fiddly (the probe used a hand-built one), so a `.txt` pair is the safe Phase 1 floor and a PDF can be exported from any editor.

## Sources

### Primary (HIGH confidence)
- Live probes, 2026-10-18 (this machine): pdfjs-dist 6.4.299 legacy-vs-modern extraction test on Node v24.19.0; Ollama `/api/embed` (768-dim) and `/api/chat` JSON-mode on `gemma3n:e2b` (11.2 s, 29 tok eval); `ollama list`; `npm view` versions and postinstall absence
- `.planning/phases/01-contract-vertical-slice/01-CONTEXT.md`, `01-UI-SPEC.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `tasks/plan.md`, `tasks/todo.md`, `AGENTS.md`, `.gitignore` — all read in full this session

### Secondary (MEDIUM confidence)
- [CITED: huggingface.co/blog/embeddinggemma] — EmbeddingGemma task prefixes (`task: search result | query: `, `title: none | text: `)
- [CITED: ai.google.dev/gemma/docs/embeddinggemma/inference-embeddinggemma-with-sentence-transformers] — task-prompt guidance
- [CITED: expressjs.com/en/resources/middleware/multer] — multer as official Express middleware

### Tertiary (LOW confidence)
- Express 5 ↔ multer 2.x interaction specifics (A1) — standard community usage, not explicitly documented; smoke-test at install

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all three deps registry-verified and pdfjs/Ollama behavior probe-tested on the actual machine
- Architecture: HIGH — pipeline shape fixed by ARCHITECTURE.md + tasks/plan.md contracts; probe removed the pdfjs uncertainty
- Pitfalls: HIGH for pdfjs-legacy, prefixes, verifier; MEDIUM for Express-5/multer edge (A1)

**Research date:** 2026-10-18
**Valid until:** 2026-10-18 checkpoint (hackathon-day stack; same-day deadline makes staleness a non-issue)
