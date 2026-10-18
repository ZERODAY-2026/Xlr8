---
phase: 01-contract-vertical-slice
plan: 01
subsystem: pipeline
tags: [node24, esm, pdfjs-dist, express5, multer, node-test, citation-gate, fixtures]

# Dependency graph
requires: []
provides:
  - "Pinned ESM scaffold (package.json + lockfile): express@5.3.0, multer@2.4.0, pdfjs-dist@6.4.299"
  - "docs/api.md — binding cross-phase contract (chunks.json shape, answer schema with reserved Phase-2 fields, three 127.0.0.1:3000 routes, CLI output strings)"
  - "Two self-authored CC0 demo fixtures (rental, employment) with in-document banner + fixtures/SOURCES.md (gate G4)"
  - "lib/parse.js (page-aware TXT/PDF via pdfjs legacy build), lib/chunk.js (within-page chunking), lib/verify.js (GRD-01 normalise-then-substring gate)"
  - "11-test node:test suite proving verbatim-pass with page, paraphrase/invented/empty rejection, normalisation, earliest-page, page-pure chunks"
affects: [01-02, 01-03, phase-02-verification-ui, phase-03-robustness]

# Actuals (#2632) — same estimateTokens scale: chars/4 over the realized diff
actuals:
  tokens: 14926
  tasks: 3
  commits: 4
plan_head_before: 094963f45c10e205f8a99208afbd6400d05fcfaa
plan_head_after: 01aea65

# Tech tracking
tech-stack:
  added: [express@5.3.0, multer@2.4.0, pdfjs-dist@6.4.299, node:test (built-in)]
  patterns:
    - "Contract-first: docs/api.md written before any lib/ code; change the contract there first"
    - "pdfjs-dist legacy build only (pdfjs-dist/legacy/build/pdf.mjs); no destroy() on v6 doc handles"
    - "Chunk-within-page: a chunk's page is its source page by construction; ids ascending by page then order"
    - "GRD-01 gate as code: NFKC → dash-collapse → soft-hyphen removal → line-break joins → whitespace collapse → lowercase, then exact substring; empty rejected before any substring test"
    - "Deterministic data shapes over exceptions for domain outcomes ({verifiable, page} / {unverifiable, reason})"

key-files:
  created:
    - package.json
    - package-lock.json
    - docs/api.md
    - fixtures/rental.txt
    - fixtures/employment.txt
    - fixtures/SOURCES.md
    - lib/parse.js
    - lib/chunk.js
    - lib/verify.js
    - lib/parse.test.js
    - lib/chunk.test.js
    - lib/verify.test.js
  modified: []

key-decisions:
  - "Test script runs 'node --test lib/*.test.js': Node v24.19.0 does not expand a directory argument to --test (plan's 'node --test lib/' crashed with MODULE_NOT_FOUND)"
  - "RED suite loads modules through a documented catch-shim so the committed failing tests fail on the planned assertions (undefined behavior) rather than module-load errors — required for a valid RED_EVIDENCE_OK"
  - "docs/api.md lists tier/kind/escalate/confidence_basis as 'reserved, lands Phase 2' so Phase 2 extends the answer object instead of reshaping it"
  - "REQUIREMENTS.md checkboxes for ING-03/GRD-01 left unchecked: shared-ID gate (both are also declared by sibling plans 01-02/01-03 without SUMMARYs yet)"

patterns-established:
  - "Contract-first ordering: docs/api.md before lib/ code (CONVENTIONS working agreement)"
  - "node:test + node:assert/strict, colocated <module>.test.js, no network, no mocks"
  - "TDD evidence chain: RED record persisted at .planning/phases/01-contract-vertical-slice/01-01-tdd-red-evidence.json, classifier-verified RED_EVIDENCE_OK before GREEN"

requirements-completed: [ING-03, GRD-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Pinned ESM scaffold: package.json (express 5.3.0, multer 2.4.0, pdfjs-dist 6.4.299, start/test scripts) + committed lockfile"
    verification:
      - kind: other
        ref: "npm ls express multer pdfjs-dist --depth=0 (exit 0, three exact versions)"
        status: pass
    human_judgment: false
  - id: D2
    description: "docs/api.md: the written cross-phase contract — chunks.json shape, answer schema with reserved Phase-2 fields, three routes on 127.0.0.1:3000, CLI output strings verbatim"
    verification:
      - kind: other
        ref: "acceptance grep script over docs/api.md: 18 contract assertions (all four areas, verbatim CLI strings, no runtime path outside ./data/)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Two CC0 synthetic fixtures with verbatim banner line + fixtures/SOURCES.md (self-authored, CC0 1.0, fictitious parties — gate G4)"
    verification:
      - kind: other
        ref: "node -e banner/60-days fixture check ('fixtures ok', exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Page-aware parser lib/parse.js: TXT → [{page:1, text}], PDF via pdfjs legacy build, hostile-PDF hardening, no destroy()"
    verification:
      - kind: unit
        ref: "lib/parse.test.js#parses fixtures/rental.txt as one page of non-empty text"
        status: pass
    human_judgment: false
  - id: D5
    description: "Within-page chunker lib/chunk.js: page-pure chunks, ascending ids, 2000-char cap, zero chunks on empty input"
    verification:
      - kind: unit
        ref: "lib/chunk.test.js (3 tests, all pass under node --test)"
        status: pass
    human_judgment: false
  - id: D6
    description: "GRD-01 citation gate lib/verify.js: verbatim quotes pass with page, paraphrase/invented/empty rejected, ligature/dash normalisation, earliest-page rule"
    verification:
      - kind: unit
        ref: "lib/verify.test.js (7 tests, all pass under node --test)"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-10-18
status: complete
---

# Phase 1 Plan 01: Contract + Vertical Slice Summary

**docs/api.md contract, two CC0 demo fixtures, and the parse→chunk→verify pipeline core with the GRD-01 citation gate proven green by an 11-test node:test suite (RED evidence classifier-verified before implementation).**

## Performance

- **Duration:** ~20 min (continuation run after the Task-0 package-legitimacy gate was approved)
- **Started:** 2026-10-18T09:21:54Z
- **Completed:** 2026-10-18T09:42Z
- **Tasks:** 3 (Task 0 checkpoint resolved pre-run; Tasks 1–2 executed)
- **Files modified:** 12

## Accomplishments

- Pinned ESM scaffold installed and committed: express@5.3.0, multer@2.4.0, pdfjs-dist@6.4.299 with a committed lockfile (fresh-clone reproducibility).
- `docs/api.md` landed **before any lib/ code** as the binding cross-phase contract: `chunks.json` shape, answer object `{answer, quote, page}` with `tier/kind/escalate/confidence_basis` reserved for Phase 2, the three `127.0.0.1:3000` routes, and the CLI output strings (`ANSWER:`/`QUOTE:`/`PAGE:`, `UNVERIFIABLE: quote not found in source`, usage and Ollama-error lines).
- Two self-authored Indian-style fixtures (rental + employment) open with the verbatim CC0 banner, the rental carries the mandatory `60 days' written notice` clause, and `fixtures/SOURCES.md` records self-authorship/CC0/fictitious parties (gate G4).
- Pipeline core built TDD: RED suite of 11 tests committed first with classifier-verified `RED_EVIDENCE_OK` evidence, then `lib/parse.js` / `lib/chunk.js` / `lib/verify.js` implemented to 11/11 green.

## Task Commits

Each task was committed atomically:

1. **Task 0: Human ack of package legitimacy** — resolved pre-run (user: "approved"); no commit
2. **Task 1: Scaffold, API contract, demo fixtures** — `e6fe6a1` (feat)
3. **Task 2 (Rule-3 fix): test script glob** — `c56408d` (fix)
4. **Task 2 RED: failing suite for pipeline core** — `bbeeddb` (test)
5. **Task 2 GREEN: implement parse/chunk/verify pipeline core** — `01aea65` (feat)

**Plan metadata:** `docs(01-01): complete contract+vertical-slice plan` — hash recorded in the executor completion report (this file is committed by it).

_TDD: RED → GREEN present; no REFACTOR commit (no cleanup was needed; tests stayed green)._

## Files Created/Modified

- `package.json` — pinned deps, `"type": "module"`, start/test scripts
- `package-lock.json` — committed lockfile for fresh-clone installs
- `docs/api.md` — cross-phase contract (storage, answer schema, routes, CLI contract, temp hygiene)
- `fixtures/rental.txt` — synthetic rental agreement (D-01/D-02), banner line 1, 60-day notice clause
- `fixtures/employment.txt` — synthetic employment offer letter (D-01/D-02), banner line 1, probation/termination
- `fixtures/SOURCES.md` — self-authored / CC0 1.0 / fictitious-party record (D-03, gate G4)
- `lib/parse.js` — TXT/PDF → `[{page, text}]`; pdfjs **legacy** build, `isEvalSupported: false`, no destroy()
- `lib/chunk.js` — within-page paragraph split, 2000-char cap, ids ascending by page then order
- `lib/verify.js` — GRD-01 normalise-then-substring gate (pure, deterministic)
- `lib/verify.test.js`, `lib/chunk.test.js`, `lib/parse.test.js` — node:test suite (11 tests)
- `.planning/phases/01-contract-vertical-slice/01-01-tdd-red-evidence.json` — persisted RED evidence (classifier-verified)

## Decisions Made

- **Test command changed to `node --test lib/*.test.js`** — `node --test lib/` crashes on Node v24.19.0 (directory args are executed as modules). Same suite, same intent; documented as a deviation and in `.planning/WINDOWS.md`.
- **RED-scheme shim in test files** — tests `import('./x.js').catch(...)` so the committed RED suite fails on the planned assertions instead of module-load errors; without it the TAP report is a file-level load failure and `tdd-red-evidence` classifies `INVALID_RED`. The catch never fires now that the modules exist (a load failure still fails the assertions loudly).
- **Verifier rejects a quote that normalises to the empty string too** (e.g. soft-hyphen-only) — the same load-bearing ordering rule as the whitespace case: an empty normalised string is a substring of everything.
- **Requirements not ticked yet** — ING-03/GRD-01 are shared with sibling plans 01-02/01-03, so the shared-ID gate defers `requirements.mark-complete` to the last finishing plan of the phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan's test command does not run on this host**
- **Found during:** Task 2 (RED phase — first `node --test lib/` run)
- **Issue:** Node v24.19.0 does not expand a directory argument to `--test`; `node --test lib/` executes `lib` as a module and crashes (`MODULE_NOT_FOUND`, exit 1, 0 tests discovered) — the plan's `<verify>` command and `test` script could never pass as written.
- **Fix:** test script and verify runs use `node --test lib/*.test.js` (Node's own glob expansion; works under cmd and PowerShell).
- **Files modified:** package.json
- **Verification:** `npm test` → 11 pass / 0 fail, exit 0.
- **Committed in:** `c56408d`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Mechanical command fix only; no scope change, no behavior change to shipped code.

## TDD Gate Compliance

| Gate | Status | Evidence |
|------|--------|----------|
| RED | ✓ | `bbeeddb` `test(01-01): …`; evidence record `01-01-tdd-red-evidence.json` → `gsd check tdd-red-evidence` = **RED_EVIDENCE_OK** (11/11 fail, exit 1, target `verifies a verbatim quote and cites the chunk page` matched, report_errors: []) |
| GREEN | ✓ | `01aea65` `feat(01-01): …`; `npm test` → 11 pass / 0 fail |
| REFACTOR | — (optional) | No cleanup was needed; suite stayed green post-GREEN. |

**Semantic assessment (RED):** the target test executed and failed with `AssertionError` (`deepStrictEqual`: actual `undefined`, expected `{ verifiable: true, page: 1 }`) — the planned assertion, failing for the intended reason (implementation absent). No zero-test, load, syntax, or unrelated failures.

## Issues Encountered

- **PowerShell `>` redirection wrote the TAP capture as UTF-16**, which the evidence classifier rejected as `Unsupported report format`. Resolved by capturing the test run's stdout directly in a Node `spawnSync` (raw bytes, no shell redirection). Evidence then classified `RED_EVIDENCE_OK`.
- **`head` is not available in PowerShell** — cosmetic only; pipelines use `Select-Object -First 1`.

## User Setup Required

None — no external service configuration required. (Runtime needs a local Ollama later; that lands with plan 01-02/01-03, not this one.)

## Next Phase Readiness

- Ready for plan **01-02**: `docs/api.md` fixes the storage/answer/route contracts it must implement against; fixtures exist for CLI/end-to-end checks; `npm test` is the green gate.
- Task-0 package approval is final for the three pinned versions — later plans install from the committed lockfile.
- Blockers unchanged: GitHub repo still pending from the organizers (G1 push gate).
- Note for verification: `.planning/WINDOWS.md` carries 1 open deviation entry (the test-command fix) for ship-gate visibility.

---
*Phase: 01-contract-vertical-slice*
*Completed: 2026-10-18*

## Self-Check: PASSED

- All 13 created files exist on disk (scaffold, contract, fixtures, 3 lib modules, 3 test suites, SUMMARY itself): FOUND
- All 4 task commits are ancestors of HEAD: `e6fe6a1`, `c56408d`, `bbeeddb`, `01aea65`: FOUND
- Plan-level verification re-run at close-out: `npm --prefix . run test` → 11 pass / 0 fail (exit 0); `npm ls express multer pdfjs-dist --depth=0` → three exact pinned versions (exit 0); fixture banner + 60-days check → `fixtures ok`; `git check-ignore -q data/chunks.json` → exit 0
- Every task `acceptance_criteria` re-run: Task 1 — 23/23 PASS; Task 2 — 22/22 PASS (scripts `task1-acceptance.mjs` / `task2-acceptance.mjs`)
- Commits measured from ledger `094963f`: 4 (matches frontmatter `actuals.commits`)
