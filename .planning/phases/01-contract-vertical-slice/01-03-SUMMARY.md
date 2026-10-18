---
phase: 01-contract-vertical-slice
plan: 03
subsystem: ui
tags: [express5, multer, vanilla-js, ui-spec, upload-shell, chunk-list, loopback, tdd, node-test]

# Dependency graph
requires:
  - phase: 01 (plans 01-01 / 01-02)
  - provides: "docs/api.md contract, lib/parse.js, lib/pipeline.js ingest/askStored, fixtures, 17-test green suite"
provides:
  - "server.js — Express 5 API over the proven pipeline: POST /api/upload (20 MB/.pdf/.txt/UUID storage, 300-page cap with file deletion), GET /api/doc/:id (embeddings stripped, 404), POST /api/ask (400 no-document, verified answer / unverifiable shapes, 503 model copy), static public/, bound 127.0.0.1:3000"
  - "public/ upload shell + page-cited chunk list exactly per the approved 01-UI-SPEC (D-04 scope lock — no Q&A UI)"
  - "public.test.js — 4-test node:test suite pinning CTA/empty-state/privacy copy, aria labels, /api flow, loopback-only assets, D-04 scope lock and UI-SPEC tokens (21/21 green suite)"
  - "Phase-1 success criterion 1 (browser upload → chunk list with page numbers) and the Checkpoint-1 vertical slice complete end-to-end: browser OR CLI"
affects: [phase-02-verification-ui, phase-03-robustness, phase-04-submission]

# Actuals (#2632) — same estimateTokens scale: chars/4 over the realized diff
actuals:
  tokens: 7085
  tasks: 2
  commits: 3
plan_head_before: c8087d7157fbe9cb5a5e8c409353f11f0ef7e616
plan_head_after: 39b9d6cdfc3a607e0104a63a94c9d3e3528ff901

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One pipeline two entries: the server calls pipeline.ingest / askStored — the /api/ask verify() gate is the identical code path as the CLI (GRD-01)"
    - "Multer hardening by construction: crypto.randomUUID() storage names (client name never a path), 20 MB limits.fileSize, .pdf/.txt fileFilter, 300-page post-parse cap that deletes the stored file"
    - "Error bodies are deterministic { error: string } JSON with the verbatim UI-SPEC copy; multer codes and body-parser syntax errors map to 400 rows, model failures to the single 503/500 copy — never a stack on the wire"
    - "E1–E10 vanilla-JS state machine: state (header/list) mutates only on upload success, so a failed replacement preserves the previous document beside the banner by construction"
    - "Accent #295499 used exactly for CTA, active state and focus ring; page chips chrome-only; system font stack; inline SVG only — zero external assets (PRV-01 by construction)"

key-files:
  created:
    - server.js
    - public/index.html
    - public/app.js
    - public/styles.css
    - public.test.js
    - .planning/phases/01-contract-vertical-slice/01-03-tdd-red-evidence.json
  modified:
    - lib/pipeline.js (ingest optional displayName — original-filename contract)
    - package.json (test script includes public.test.js)

key-decisions:
  - "lib/pipeline.js ingest() gained an optional displayName param so chunks.json stores the uploader's original filename per docs/api.md (it previously stored the UUID storage path basename); CLI callers unchanged"
  - "The three UI-SPEC error rows are mirrored verbatim in public/app.js with the model-failure row used as the fetch-unreachable fallback; the server remains the contract owner of the copy"
  - "Malformed JSON on /api/ask returns 400 { error: 'invalid JSON body' } instead of the 500 model copy — a client error must not claim a model failure"
  - "The >300-page cap is checked by parsing first (lib/parse.js) then ingesting — double parse for fresh PDFs, but the sha256 cache still skips re-embedding on repeat uploads"

patterns-established:
  - "Server routes own verbatim error copy in JSON; the browser banner renders the server's message verbatim (client fallback copy only for transport-level failure)"
  - "TDD for the UI shell: public.test.js statically pins the Copywriting Contract strings, D-04 scope lock and loopback-only assets; interactive states stay with the end-of-phase human-check"

requirements-completed: [ING-01, ING-02, ING-03, PRV-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "server.js: docs/api.md routes over the proven pipeline, bound 127.0.0.1:3000 only"
    requirement: ING-01
    verification:
      - kind: integration
        ref: "Task 1 sampler: multipart upload of fixtures/rental.txt → {docId, filename: rental.txt, chunks: 12}; GET /api/doc/:id → pages present, no embedding key → 'upload+doc OK'"
        status: pass
      - kind: other
        ref: "grep server.js: '127.0.0.1' literal present, no 0.0.0.0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Upload hardening: 20 MB cap, .pdf/.txt allow-list, >300-page post-parse rejection with stored-file deletion, verbatim error copy, server survives every bad input"
    requirement: ING-01
    verification:
      - kind: integration
        ref: "live checks: oversize 21 MB → 400 size row; .json upload → 400 type row; generated 301-page PDF → 400 pages row and no orphan file left under ./data/"
        status: pass
    human_judgment: false
  - id: D3
    description: "POST /api/ask over askStored with the identical GRD-01 gate as the CLI: 400 no-document, verified {answer, quote, page}, unverifiable shape"
    requirement: ING-02
    verification:
      - kind: integration
        ref: "live checks: chunks.json removed → 400 {error: 'no document'}; with document → 200 {answer, quote verbatim, page: 1} through the server"
        status: pass
    human_judgment: false
  - id: D4
    description: "Browser upload shell + page-cited chunk list per 01-UI-SPEC: verbatim copy, aria labels, 44px targets, chrome chips, wrap-not-clamp text, loopback-only assets, D-04 scope lock"
    requirement: ING-03
    verification:
      - kind: unit
        ref: "public.test.js (4 tests) in npm test → 21 pass / 0 fail"
        status: pass
      - kind: other
        ref: "shell OK sampler (GET / contains 'Upload agreement', 'No document yet', privacy line) + external-URL scanner ('no external URLs') + task2-acceptance.mjs 24/24 PASS"
        status: pass
    human_judgment: false
  - id: D5
    description: "Interactive E1–E10 browser states (spinner, progress bar, banner, remove-confirm dialog, replacement preserving old list) and the offline full-flow backstop"
    verification: []
    human_judgment: true
    rationale: "Requires a human in a real browser: visual state transitions, dialog interaction and the disconnect-Wi-Fi offline run are assigned by the plan to the end-of-phase human-check batch (D-05 review)"
  - id: D6
    description: "PRV-01 browser-path proof: loopback-bound server, zero non-loopback references in public/ (system fonts, inline SVG, hand-written CSS only)"
    requirement: PRV-01
    verification:
      - kind: other
        ref: "external-URL scanner over public/ → 'no external URLs', exit 0; server.js bind literal 127.0.0.1"
        status: pass
    human_judgment: false

# Metrics
duration: 27min
completed: 2026-10-18
status: complete
---

# Phase 1 Plan 03: Contract + Vertical Slice Summary

**Express API over the proven ask pipeline plus the UI-SPEC upload shell: a browser upload of fixtures/rental.txt returns "rental.txt — 12 chunks" with p.-chipped verbatim rows, every rejection returns the verbatim error copy without crashing, and the whole surface binds 127.0.0.1 with zero external assets — Phase-1 success criterion 1 met.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-10-18T10:03:16Z
- **Completed:** 2026-10-18T10:29:49Z
- **Tasks:** 2
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- The Checkpoint-1 vertical slice is complete end-to-end: `POST /api/upload` ingests a file through the sha256-cached pipeline, `GET /api/doc/:id` returns the embedding-stripped chunk records, and the browser renders the verbatim `{filename} — {N} chunks` header with `p. {page}` chips on every card.
- Upload hardening proven live: 21 MB file → 400 with the verbatim size row; `.json` upload → 400 type row; a generated 301-page PDF → 400 pages row with the stored file deleted (no orphan bytes under `./data/`); the server process survived every bad input.
- `/api/ask` over the wire: no document → 400 `{error: 'no document'}`; with a document → `200 {answer, quote (verbatim), page: 1}` through the same `verify()` gate as the CLI.
- The browser shell is the approved 01-UI-SPEC contract verbatim — CTA, empty state, privacy reassurance, loading copy, three error rows, success header, remove-confirm dialog, no-chunks message — with accent `#295499` reserved to CTA/active/focus ring, chrome page chips, system font stack, inline SVG icons and zero external references (the D-04 scope lock is test-pinned: no `/api/ask` anywhere in `public/`).
- TDD held for the UI task: RED suite committed first with classifier-verified `RED_EVIDENCE_OK`, then the shell implemented to 21/21 green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Express API surface over the ask pipeline** — `040e610` (feat)
2. **Task 2 RED: failing suite for upload shell + chunk list** — `2116101` (test)
3. **Task 2 GREEN: upload shell + page-cited chunk list** — `39b9d6c` (feat)

**Plan metadata:** `docs(01-03): …` — this file is committed by the executor's final metadata commit.

_TDD: RED → GREEN present; no REFACTOR commit needed (suite stayed green, no cleanup outstanding)._

## Verification (re-run at close-out, verbatim)

- Task 1 sampler: `upload+doc OK` — upload `{"docId":"36e59b0…","filename":"rental.txt","chunks":12}`, doc fetch carries `page` and no `embedding` key
- Task 2 sampler: `shell OK` — `GET /` contains the CTA, empty-state heading and privacy line; external-URL scanner: `no external URLs`
- Task 2 acceptance: `task2-acceptance.mjs` → **24/24 PASS** (verbatim copy rows, aria labels, 44px targets, accent discipline, wrap-not-clamp, D-04 scope lock)
- Plan-level: `npm --prefix . run test` → **21 pass / 0 fail** (17 from plans 01-01/01-02 untouched + 4 new)
- Live ask through the server → verified `{answer, quote, page}` (quote passed `verify()`); no-document → `400 {"error":"no document"}`

## Files Created/Modified

- `server.js` — Express 5 app: upload (multer diskStorage UUID names, 20 MB, .pdf/.txt, 300-page cap + deletion), doc fetch (strip embeddings, 404), ask (400/200/503 per contract), static `public/`, `app.listen(3000, '127.0.0.1')`
- `public/index.html` — UI-SPEC shell markup: banner, drop zone with verbatim copy, CTA (aria-label, 44×44), document header, chunk-list column, no-chunks message, remove-confirm `<dialog>` with verbatim destructive copy
- `public/app.js` — E1–E10 vanilla state machine: FormData upload flow, header `{filename} — N chunks` (singular/plural), `p. {page}` chips, verbatim banner from the server's error body, single-document session with full state preservation on failure
- `public/styles.css` — parchment tokens (4px scale, 400/600 only), chrome chips, reserved accent, focus ring `2px solid #295499`, list `max-height: calc(100vh …)` vertical-only scroll
- `public.test.js` — 4 node:test tests pinning the copy strings, API wiring, loopback-only assets, D-04 lock and design tokens
- `lib/pipeline.js` — `ingest(filePath, displayName?)` so `chunks.json` stores the uploader's original filename per docs/api.md
- `package.json` — test script extended with `public.test.js`

## Decisions Made

- **`ingest()` displayName param** — the stored `filename` had to become the uploader's original name (docs/api.md field contract and the E4 header); an optional second parameter keeps every CLI caller and test unchanged.
- **Error-row mirror in `app.js`** — Task 2's acceptance requires the three rows verbatim across `public/` files; the client mirrors them and genuinely uses the model-failure row when the fetch itself fails (server unreachable, no body to read). The server stays the contract owner.
- **Parse-then-ingest for the page cap** — a fresh PDF is parsed once for the 300-page check and again inside `ingest()`; the sha256 cache still prevents re-embedding on repeat uploads. Simplest correct code over a pre-parse cache-injection.
- **UI task as full TDD cycle** — the task declared `tdd="true"`; the statically-pinnable behaviors (copy strings, asset policy, scope lock, tokens) went RED→GREEN, while interactive states remain with the plan's end-of-phase human-check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `pipeline.ingest` stored the UUID storage path as the document filename**
- **Found during:** Task 1 (upload handler wiring)
- **Issue:** `ingest()` set `filename: path.basename(filePath)` — for a server upload that is `<uuid>.txt`, violating docs/api.md's "original file name as supplied by the uploader" and breaking the E4 header the UI must render from `/api/doc/:id`.
- **Fix:** optional `displayName` parameter on `ingest()`; the server passes `path.basename(req.file.originalname)`, the CLI omits it (backward compatible).
- **Files modified:** lib/pipeline.js
- **Verification:** upload response and `/api/doc/:id` both return `rental.txt`; `npm test` still 17/17 → later 21/21.
- **Committed in:** `040e610`

**2. [Rule 2 - Missing Critical] Malformed JSON on `/api/ask` returned the 500 model-failure copy**
- **Found during:** Task 1 (live ask checks — body-parser raised `entity.parse.failed`, my middleware fell through to 500)
- **Issue:** a client-side JSON syntax error would have told the user "Ollama is not running" — a false fact, and a 500 for a 400-class fault.
- **Fix:** error middleware maps `err.type === 'entity.parse.failed'` to `400 { error: 'invalid JSON body' }`.
- **Files modified:** server.js
- **Verification:** re-run of the malformed-body request → 400; server log no longer misattributes it.
- **Committed in:** `040e610`

**3. [Rule 3 - Blocking] The plan's Task-2 verify command false-fails under PowerShell 5.1**
- **Found during:** Task 2 (first `shell OK` attempt)
- **Issue:** `curl.exe` output assigned to a variable is a line array; `$p -notmatch 'Upload agreement'` FILTERS non-matching lines (truthy whenever any line differs) instead of testing the whole body, so the verify threw "CTA copy missing" on a perfectly correct server.
- **Fix:** join the lines before testing — `$p = (curl.exe -s …) -join ''` — same assertion, same semantics.
- **Files modified:** none in-repo (verify executed inline).
- **Verification:** `shell OK` printed.
- **Committed in:** n/a (evidence in this SUMMARY)

**4. [Rule 3 - Blocking] First RED capture used Node's spec reporter, which the evidence classifier rejects**
- **Found during:** Task 2 (RED phase)
- **Issue:** `gsd check tdd-red-evidence` returned `INVALID_RED (invalid_record): Unsupported report format` — Node 24's default reporter for the capture was `spec`, not TAP.
- **Fix:** reran the RED through the project's test command with `--test-reporter=tap` (the reference's supported-reporter rerun path); classifier then returned **RED_EVIDENCE_OK** (4 tests, 3 fail, target matched).
- **Files modified:** none in-repo (evidence record updated: `01-03-tdd-red-evidence.json`).
- **Committed in:** `2116101`

---

**Total deviations:** 4 auto-fixed (2 missing-critical, 2 blocking)
**Impact on plan:** no scope change — one 3-line backward-compatible extension to a sibling module, one correct status mapping, two harness/command fixes. Shipped code matches the plan's action text and the docs/api.md contract.

## TDD Gate Compliance

| Gate | Status | Evidence |
|------|--------|----------|
| RED | ✓ | `2116101` `test(01-03): …`; evidence `01-03-tdd-red-evidence.json` → **RED_EVIDENCE_OK** (4 tests, exit 1, target `serves an upload shell with the verbatim CTA, empty state and aria labels` matched, report_errors: []) |
| GREEN | ✓ | `39b9d6c` `feat(01-03): …`; `npm test` → 21 pass / 0 fail |
| REFACTOR | — (optional) | No cleanup needed; suite stayed green post-GREEN. |

**Semantic assessment (RED):** the target test executed and failed on the planned assertion (`CTA copy "Upload agreement" present` — `public/` did not exist yet), for the intended reason. No zero-test, load, syntax, or unrelated failures.

## Issues Encountered

- The hand-built 301-page test PDF failed pdfjs twice from two bugs in my generator (xref declared N entries while writing N+1; the Pages node overwrote page object 2 so kid ref 303 pointed past the end) — fixed in the throwaway generator; the fixture was never committed (`data/` is gitignored, temp artifacts deleted after the check).
- PowerShell harness quirks recurred (nested-quote mangling for `bash -c`, line-array `-match` semantics, console mojibake for UTF-8 arrows) — all verification rerun via script files, joined strings and Node for UTF-8-sensitive assertions.
- D-05 note: the Checkpoint-1 "clean commit before 13:30 IST" human action is past its IST window; the plan assigns the interactive browser review and the clean-commit ritual to the end-of-phase human-check batch — flagged for the phase verifier, not a code gap.

## User Setup Required

None — no external service configuration required. (Runtime needs local Ollama with `gemma3n:e2b` + `embeddinggemma`; both pre-installed and probe-verified on this machine.)

## Next Phase Readiness

- **Phase 1 is complete** — all three plans have SUMMARYs; the vertical slice runs browser AND CLI from the committed tree: `npm start` → http://127.0.0.1:3000, `node cli.js ask <doc> "<question>"`.
- Phase 2 inherits: `server.js` route surface to extend (never reshape — docs/api.md), the E1–E10 state machine and token set in `public/`, and the UI-SPEC tier-color reservations (`stated`/`interpretation`/`not_in_document` badges).
- Outstanding human items for the phase verifier: the end-of-phase interactive browser check (E1–E10 states, remove dialog, offline run) and the D-05 clean-commit/evaluation-notice ritual.
- Blockers unchanged: GitHub repo still pending from the organizers (G1 push gate).

---
*Phase: 01-contract-vertical-slice*
*Completed: 2026-10-18*

## Self-Check: PASSED

- All 8 key files exist on disk: FOUND (`server.js`, `public/index.html`, `public/app.js`, `public/styles.css`, `public.test.js`, `lib/pipeline.js`, `package.json`, `01-03-tdd-red-evidence.json`)
- All 3 task commits are ancestors of HEAD: `040e610`, `2116101`, `39b9d6c`: FOUND
- Plan-level verification re-run at close-out: Task 1 sampler `upload+doc OK`; Task 2 sampler `shell OK`; external-URL scanner `no external URLs`; `npm test` 21 pass / 0 fail; acceptance script 24/24 PASS
- Every task `acceptance_criteria` re-run: Task 1 — 7/7 PASS (loopback bind, 400 rows with verbatim copy + server alive, page-cap deletion, no embedding key, ask 400 + same verify gate, all-error JSON no stacks, A1 smoke under Express 5.3.0 + multer 2.4.0); Task 2 — 6/6 PASS (verbatim copy strings, accent discipline + system fonts, no external refs, wrap-no-ellipsis + vertical scroll only, aria labels + 44px, no Q&A control)
- Commits measured from ledger `c8087d7`: 3 (matches frontmatter `actuals.commits`); diff bytes 28,338 → 7,085 tokens (chars/4)
