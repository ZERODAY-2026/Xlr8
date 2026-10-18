---
phase: 01-contract-vertical-slice
plan: 02
subsystem: pipeline
tags: [ollama, embeddinggemma, gemma3n, cli, retrieval, cosine-topk, citation-gate, loopback-privacy, esm]

# Dependency graph
requires: []
provides:
  - "Checkpoint-1 tracer slice: `node cli.js ask <doc> \"<question>\"` runs file → parse → chunk → embed → cosine top-6 → gemma3n JSON chat → verbatim verify → ANSWER/QUOTE/PAGE stdout"
  - "lib/embed.js — embeddinggemma client with the mandated task prefixes, batched embedChunks, cosineTopK (768-dim)"
  - "lib/ollama.js — single choke point for the only allowed socket (hard-coded 127.0.0.1:11434): JSON-mode chat, one retry, gemma3:4b fallback"
  - "lib/pipeline.js — ingest with sha256 docId cache (./data/chunks.json is the only write path) + askFile/askStored glue through verify()"
  - "cli.js — docs/api.md §4 output contract with exit codes; hardening proven by cli.test.js (transport ERROR line, usage edge)"
  - "PRV-01/MDL-01 evidence: loopback-only sampler output + `ollama ps` listing gemma3n recorded verbatim below"
affects: [01-03, phase-02-verification-ui, phase-03-robustness]

# Actuals (#2632) — same estimateTokens scale: chars/4 over the realized diff
actuals:
  tokens: 4246
  tasks: 2
  commits: 5
plan_head_before: df610ad15cab8cb740d2379a1c90e3e8db34b22c
plan_head_after: 38db979

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hard-coded loopback base in both Ollama clients — no env override; transport failures collapse onto the single docs/api.md ERROR line with err.transport"
    - "EmbeddingGemma task prefixes verbatim: query 'task: search result | query: ', passage 'title: none | text: '"
    - "Single-batch /api/embed for a whole document (array input probe-verified 768-dim × N)"
    - "chat failure sequence: model → retry same model → gemma3:4b once; reply validated as non-empty {quote, plain} before leaving the client"
    - "verify() gate on every run: quote passes → {answer, quote, page}; fails → quote dropped entirely, {unverifiable, reason}"

key-files:
  created:
    - lib/embed.js
    - lib/ollama.js
    - lib/ollama.test.js
    - lib/pipeline.js
    - cli.js
    - cli.test.js
    - data/chunks.json (gitignored runtime artifact for the rental fixture)
  modified:
    - package.json (test script also runs cli.test.js)

key-decisions:
  - "cosineTopK returns the selected top-k ordered by chunk id (page order) so verify() cites the earliest matching chunk per the docs/api.md §2 page contract; retrieval scoring unchanged"
  - "Schema exhaustion after retry+fallback throws 'model returned unusable JSON after retry and fallback — no quote to verify, nothing displayed' instead of the Ollama-down contract line — that line would assert a false fact (Ollama is reachable); the CLI still prints one ERROR line and exits 1"
  - "Transport failures run the same retry→fallback sequence as schema failures (plan wording) — ECONNREFUSED fails in milliseconds, one code path, same final ERROR line"
  - "lib/ollama.test.js + cli.test.js stub global fetch (data: URL import shim, zero sockets) because the plan's acceptance criteria for retry/fallback, the transport ERROR line and the usage edge have no other runnable proof"

patterns-established:
  - "Tracer slice: one production path wired end-to-end through every layer before any expansion (plan 01-03 reuses askStored)"
  - "Contract-line error strings live next to the client that throws them; the CLI only prefixes 'ERROR: ' and exits 1 — never a stack trace"

requirements-completed: [ING-02, GRD-01, PRV-01, MDL-01, MDL-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "lib/embed.js: prefix-aware embeddinggemma client, batched embedChunks (768-dim), cosineTopK top-6 retrieval"
    requirement: MDL-02
    verification:
      - kind: integration
        ref: "node -e shape check on data/chunks.json ('chunks.json ok', 12 chunks, dim=768) + e2e ask producing a verified quote"
        status: pass
      - kind: other
        ref: "grep over task files: only http literal is 127.0.0.1:11434; process.env absent"
        status: pass
    human_judgment: false
  - id: D2
    description: "lib/ollama.js: JSON-mode chat client with one retry then gemma3:4b fallback, field validation, hard-coded loopback base"
    requirement: MDL-01
    verification:
      - kind: unit
        ref: "lib/ollama.test.js (4 tests: retry→fallback sequence, valid pass-through, missing-field rejection, transport contract line)"
        status: pass
    human_judgment: false
  - id: D3
    description: "lib/pipeline.js: ingest (sha256 docId cache, ./data/ only) + askFile/askStored glue with the GRD-01 verify gate on every run"
    requirement: GRD-01
    verification:
      - kind: e2e
        ref: "node cli.js ask fixtures/rental.txt \"what is the notice period?\" → ANSWER/QUOTE/PAGE, exit 0; verify(quote, stored chunks) => {verifiable:true,page:1}"
        status: pass
      - kind: other
        ref: "cache proof: data/chunks.json mtime identical before/after a second identical ask"
        status: pass
    human_judgment: false
  - id: D4
    description: "cli.js: docs/api.md §4 output contract — verified answer lines, UNVERIFIABLE line (exit 0), usage edge (exit 1), single ERROR line (exit 1, no stack trace)"
    requirement: ING-02
    verification:
      - kind: unit
        ref: "cli.test.js (transport contract line exact + empty stderr; empty/missing question → usage + exit 1) in npm test"
        status: pass
      - kind: integration
        ref: "e2e ask runs (3×) printing ANSWER:/QUOTE:/PAGE: with exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "PRV-01 localhost-only proof for a full ask run: 2-second Get-NetTCPConnection sampler over the ask's node PID + ollama PIDs"
    requirement: PRV-01
    verification:
      - kind: other
        ref: "sampler run: 'sampler: 1 samples taken; non-loopback rows: 0; ask exit code: 0' → 'loopback-only OK', exit 0 (verbatim below)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Offline backstop: full CLI ask completes with Wi-Fi disconnected (plan human-check, end-of-phase)"
    verification: []
    human_judgment: true
    rationale: "Requires physically disconnecting the machine's network — assigned by the plan to the end-of-phase UAT batch (human-check), cannot be automated without risking the demo machine's connectivity mid-run"

# Metrics
duration: 15min
completed: 2026-10-18
status: complete
---

# Phase 1 Plan 02: Contract + Vertical Slice Summary

**End-to-end tracer CLI: `node cli.js ask` ingests a document (sha256-cached chunks.json with prefixed embeddinggemma vectors), retrieves cosine top-6, generates with local gemma3n, and prints ANSWER/QUOTE/PAGE only after the verbatim verify() gate passes — with loopback-only and local-model evidence captured.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-10-18T15:16:37Z
- **Completed:** 2026-10-18T15:31Z
- **Tasks:** 2
- **Files modified:** 7 (6 created, package.json extended)

## Accomplishments

- The full Checkpoint-1 path runs production-quality on one command: `node cli.js ask fixtures/rental.txt "what is the notice period?"` → `ANSWER:` plain-language text, `QUOTE:` verbatim fixture text (proved `{"verifiable":true,"page":1}` through `lib/verify.js` against the stored chunks), `PAGE: 1`, exit 0.
- MDL-02 retrieval: embeddinggemma with the verbatim task prefixes, one batched `/api/embed` per ingest (12 chunks × 768 dims in `data/chunks.json`), cosine top-k 6 with L2-normalised dot product.
- MDL-01 generation: `gemma3n:e2b` through JSON-mode `/api/chat` at the hard-coded `127.0.0.1:11434`, with one retry then `gemma3:4b` fallback on unusable replies — 4 unit tests pin the exact `[e2b, e2b, 4b]` sequence.
- GRD-01 gate enforced on every run: failed verification returns `{unverifiable: true, reason: 'quote not found in source'}` and the quote never reaches stdout; the system prompt separately forbids legal verdicts/advice and treats excerpts as data (T-01-04).
- ING-02 edges: missing/empty question → usage line + exit 1 (tested); transport failure → the single docs/api.md ERROR contract line + exit 1 with empty stderr (tested via fetch-blocked spawn — zero sockets opened).
- PRV-01 spot-check ran during a full ask: `loopback-only OK`, ask exit 0; `ollama ps` after the run lists `gemma3n:e2b` (and `embeddinggemma`).

## Task Commits

Each task was committed atomically:

1. **Task 1 unit 1: prefix-aware embed client** - `fa3102d` (feat)
2. **Task 1 unit 2: ollama chat client with fallback** - `643e332` (feat)
3. **Task 1 unit 3: ask pipeline with hard verification gate** - `d74e0b6` (feat)
4. **Task 1 unit 4: cli ask entry point** - `4503ee1` (feat)
5. **Task 2: localhost-only spot check evidence + CLI transport contract** - `38db979` (test)

**Plan metadata:** committed by this plan's final metadata commit (see executor completion report).

## Verification (re-run at close-out, verbatim)

**Tracer end-to-end (`node cli.js ask fixtures/rental.txt "what is the notice period?"`, exit 0):**

```
ANSWER: Either the Landlord or the Tenant can end the agreement by giving the other person 60 days' written notice. This means that if either party wants to leave the property, they need to provide the other party with a letter stating that they will be leaving in 60 days.
QUOTE: Either party may end this agreement by giving the other party 60 days' written notice.
PAGE: 1
```

- `verify(quote, chunks from data/chunks.json)` → `{"verifiable":true,"page":1}`
- `data/chunks.json` → `chunks.json ok — docId=36e59b07922b filename=rental.txt chunks=12 dim=768`
- DocId cache: mtime `2026-10-18T09:50:23.3899425Z` identical before/after a second identical ask
- `npm run test` → **17 pass / 0 fail** (11 plan-01 + 4 ollama + 2 cli)

**Task 2 PRV-01 sampler (full ask run, plan's verify logic):**

```
ANSWER: The tenant paid a security deposit of Rs. 56,000. This deposit is refundable, but it will be returned after 30 days after the tenancy ends. The amount will be reduced if there is any unpaid rent or damage to the property beyond normal wear and tear.
QUOTE: As security for the performance of the Tenant's obligations, the Tenant has paid a refundable security deposit of Rs. 56,000 (Rupees Fifty-Six Thousand Only), equal to two months' rent. The deposit shall be returned within 30 days of the end of the tenancy, after deduction of any unpaid rent or damage beyond normal wear and tear.
PAGE: 1
sampler: 1 samples taken; non-loopback rows: 0; ask exit code: 0
loopback-only OK
```

(script exit code 0)

**Task 2 MDL-01 (`ollama ps` after the run):**

```
NAME                     ID              SIZE      PROCESSOR    CONTEXT    RUNNER      UNTIL
gemma3n:e2b              dae166dc6a5e    2.4 GB    100% GPU     4096       llamacpp    4 minutes from now
embeddinggemma:latest    85462619ee72    685 MB    100% GPU     2048       llamacpp    4 minutes from now
```

**Tracer feedback gate:** interactive + `end-of-phase` + `<verify>` carries only `<automated>` → re-ran both automated verifies, both passed → `⚡ Tracer verified end-to-end — expanding` (no checkpoint synthesized).

## Files Created/Modified

- `lib/embed.js` — embeddinggemma `/api/embed` client (verbatim task prefixes), batched `embedChunks`, cosine `cosineTopK`; loopback-only base
- `lib/ollama.js` — JSON-mode `/api/chat` with retry + `gemma3:4b` fallback, `{quote, plain}` validation, hard-coded loopback base (no env override)
- `lib/ollama.test.js` — 4 tests pinning the failure sequence and transport contract line (fetch stubbed)
- `lib/pipeline.js` — `ingest` (sha256 docId cache, `./data/` only write path), `askFile`/`askStored` glue through `verify()`; no-verdict system prompt
- `cli.js` — `ask` entry point, docs/api.md §4 contract strings, exit codes, no stack traces
- `cli.test.js` — CLI transport ERROR line (exact) + usage edge (spawn with fetch blocked, zero sockets)
- `package.json` — test script extended to `node --test lib/*.test.js cli.test.js`

## Decisions Made

- **Top-k returned in chunk-id order** so `verify()` cites the earliest matching chunk (docs/api.md §2 "earliest chunk" page contract) without touching retrieval scoring.
- **Schema exhaustion ≠ Ollama-down message.** After retry+fallback, the client throws `model returned unusable JSON…` rather than asserting "Ollama unavailable" when Ollama is in fact reachable; the CLI still prints exactly one `ERROR: …` line and exits 1 (plan's must-have says "before reporting an error", not which wording).
- **One batched `/api/embed` per ingest** (array input probe-verified live: `batch ok: true 2 768`) — faster cold ingest at Checkpoint 1 than per-chunk loops, same contract output.
- **Test-only fetch stubs** (global `fetch` override / `data:` URL `--import`) — keeps the suites' no-network guarantee while making the retry/fallback and transport-line must-haves executable rather than eyeballed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 2's verbatim sampler command cannot run through this toolchain**
- **Found during:** Task 2 (first sampler attempt)
- **Issue:** the plan's `powershell -Command "…$n…"` command has its `$` variables expanded by the outer PowerShell before reaching the inner one, so it parse-fails; rewritten literally, PS 5.1 `Start-Process -PassThru` reports `ExitCode` as `$null` even after `WaitForExit()`, so the exit-code guard silently exited 0 with the `loopback-only OK` assertion never printed (observed directly).
- **Fix:** sampler runs from a script file with identical logic (same question, same 2-second `Get-NetTCPConnection` loop, same loopback filter); process handle captured while alive (`$null = $n.Handle`) then `WaitForExit()`+`Refresh()` — probe-verified (`v1 Handle+Refresh: [7]`, `v2 Wait-PassThru: [7]`).
- **Files modified:** none in-repo (script kept in the approved temp dir — `evidence/`/`scripts/` are Phase 2 scope per acceptance criteria)
- **Verification:** final run printed `sampler: 1 samples taken; non-loopback rows: 0; ask exit code: 0` → `loopback-only OK`, exit 0.
- **Committed in:** evidence recorded in this SUMMARY (`38db979` carries the CLI-contract test half of Task 2)

**2. [Rule 2 - Missing Critical] Acceptance criteria for retry/fallback, transport line and usage edge had no runnable proof**
- **Found during:** Task 1 acceptance loop (criterion 8) and Task 2 (criterion 3)
- **Issue:** the plan mandates "invalid model JSON triggers one retry then the gemma3:4b fallback before the ERROR line" and "transport failures print only the ERROR contract line … no stack trace", but neither could be demonstrated against a live Ollama without an actual failure.
- **Fix:** `lib/ollama.test.js` (4 tests) and `cli.test.js` (2 tests, spawn with all fetches blocked) added; package.json test script extended to include `cli.test.js`.
- **Files modified:** lib/ollama.test.js, cli.test.js, package.json
- **Verification:** `npm run test` → 17 pass / 0 fail.
- **Committed in:** `643e332` (ollama tests), `38db979` (cli tests + script)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing-critical)
**Impact on plan:** no scope change — evidence recorded in-repo only where the plan allowed it (`evidence/` and `scripts/` deliberately untouched); shipped code matches the plan's action text.

## Issues Encountered

- PowerShell harness quirks: `$`-expansion in nested `powershell -Command` (fixed via script files), `Select-String` regex-quoting failures (worked around with simpler patterns), `Get-Date -AsUTC` unavailable on PS 5.1 (used epoch math).
- Nothing in the product code failed on first run — the three e2e asks and all 17 tests passed from their first or second invocation.

## User Setup Required

None — no external service configuration required. (Runtime needs local Ollama with `gemma3n:e2b` + `embeddinggemma`; both pre-installed and probe-verified on this machine.)

## Next Phase Readiness

- Ready for plan **01-03**: `lib/pipeline.js askStored(question)` is exported and tested against `./data/chunks.json` for the server to reuse; `docs/api.md` routes remain to be implemented; `npm test` is the green gate (17 tests).
- Evidence for Checkpoint 1 (SC2/SC3/SC4 CLI rows) is captured above; the **offline backstop human-check** (disconnect Wi-Fi → rerun ask → ANSWER/QUOTE/PAGE still print, `ollama ps` shows gemma3n) stays assigned to the end-of-phase UAT batch per plan.
- Sample-depth caveat for the sampler: 1 sample in the fixed run (the cached ask finishes in ~4 s) — a long-lived non-loopback socket would still have been caught, but this is a spot-check by design; the formal Phase 2 evidence script owns the full-connection record.
- Blockers unchanged: GitHub repo still pending from the organizers (G1 push gate).

---
*Phase: 01-contract-vertical-slice*
*Completed: 2026-10-18*

## Self-Check: PASSED

- All 7 created/modified files exist on disk: FOUND (`lib/embed.js`, `lib/ollama.js`, `lib/ollama.test.js`, `lib/pipeline.js`, `cli.js`, `cli.test.js`, `data/chunks.json`)
- All 5 task commits are ancestors of HEAD: `fa3102d`, `643e332`, `d74e0b6`, `4503ee1`, `38db979`: FOUND
- Plan-level verification re-run at close-out: e2e ask → ANSWER/QUOTE/PAGE exit 0 with `{"verifiable":true,"page":1}`; chunks.json shape check → `chunks.json ok`; `npm run test` → 17 pass / 0 fail; sampler → `loopback-only OK` exit 0; `ollama ps` → `gemma3n:e2b`
- Every task `acceptance_criteria` re-run: Task 1 — 8/8 PASS (contract prefixes, verify proof, 768-dim shape, docId cache mtime, loopback-only literals + no `process.env`, no-verdicts prompt framing, usage exit 1, retry→fallback via 4 tests); Task 2 — 4/4 PASS (loopback-only OK + exit 0, gemma3n in `ollama ps`, ERROR contract line + exit 1 + no stack trace, no `scripts/`/`evidence/` files)
- Commits measured from ledger `df610ad`: 5 (matches frontmatter `actuals.commits`)
