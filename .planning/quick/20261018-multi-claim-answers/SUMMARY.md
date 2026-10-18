---
phase: quick
plan: multi-claim-answers
subsystem: api
tags: [grounding, verify-gate, ollama, prompt, browser-ui, api-contract]

# Dependency graph
requires:
  - phase: 01-contract-vertical-slice
    provides: "lib/verify.js GRD-01 gate, lib/pipeline.js ask flow, lib/ollama.js JSON chat client, public/ answer panel, docs/api.md answer contract"
  - phase: quick/browser-ask-ui
    provides: "Browser ask form + answer panel rendering {answer, quote, page}"
provides:
  - "Multi-claim model contract: {plain, claims:[{quote, plain}]} accepted by lib/ollama.js usable()"
  - "Per-claim verify pass in lib/pipeline.js — additive claims array on the answer object"
  - "Browser answer panel rendering one page-chip + verbatim quote block per verified claim"
  - "docs/api.md documents the additive/optional claims field"
affects: [02-evidence-tiers, 03-refusal-copy]

# Actuals (#2632) — chars/4 over the realized code diff ab39e0e..298aff5 (9 files, excl. this SUMMARY/metadata)
actuals:
  tokens: 4008
  tasks: 5
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive contract extension: new optional field, legacy shape still accepted and produced"
    - "One exported pure helper (verifiedClaims) so the per-claim gate is unit-testable without a socket"

key-files:
  created:
    - lib/pipeline.test.js
  modified:
    - lib/ollama.js
    - lib/pipeline.js
    - lib/ollama.test.js
    - public/index.html
    - public/app.js
    - public/styles.css
    - public.test.js
    - docs/api.md

key-decisions:
  - "Purely additive: {answer, quote, page} unchanged and quote/page mirror claims[0]; a consumer ignoring claims sees the Phase-1 object"
  - "The GRD-01 gate is never relaxed — each claim's quote runs through the same lib/verify.js substring check; unverifiable claims are dropped"
  - "Zero verified claims collapses to the unchanged {unverifiable:true, reason:'quote not found in source'}"
  - "public.test.js pins moved into the task-3 commit (not task 5) because the markup change invalidates them and every commit must stay npm-test green"
  - "verifiedClaims exported from lib/pipeline.js as a pure function so the gate is testable with fixture chunks — no socket, no ./data writes (dev server owns ./data)"

requirements-completed: []

coverage:
  - id: D1
    description: "lib/ollama.js accepts a multi-claim reply ({plain, claims[1-8]} with per-claim quotes) alongside the legacy {quote, plain}; num_predict raised to 1100"
    verification:
      - kind: unit
        ref: "lib/ollama.test.js#accepts a multi-claim reply whose claims each carry a quote"
        status: pass
      - kind: unit
        ref: "lib/ollama.test.js#valid-shaped reply passes through without fallback"
        status: pass
    human_judgment: false
  - id: D2
    description: "lib/pipeline.js verifies every claim, keeps only verified claims in model order, returns the additive claims array; a legacy reply yields one claim; zero verified -> unchanged unverifiable outcome"
    verification:
      - kind: unit
        ref: "lib/pipeline.test.js#keeps only the verified claims, in model order; a legacy reply yields one claim"
        status: pass
    human_judgment: false
  - id: D3
    description: "Browser renders the answer paragraph then one page-chip + verbatim quote block per verified claim; a single claim renders as before"
    verification:
      - kind: unit
        ref: "public.test.js#app.js drives the ask flow against the local API"
        status: pass
      - kind: unit
        ref: "public.test.js#index.html carries the ask form and answer region"
        status: pass
    human_judgment: true
    rationale: "Static string pins prove the markup and renderer exist; whether a 2-5 claim answer reads clearly and that a single claim is visually unchanged needs a human eye on the running page — live model asks were excluded (dev server detached on 127.0.0.1:3000)."
  - id: D4
    description: "docs/api.md documents the additive/optional claims field on the answer object and the POST /api/ask success shape"
    verification:
      - kind: other
        ref: "manual: docs/api.md §2 + §3 POST /api/ask success line updated"
        status: pass
    human_judgment: false
  - id: D5
    description: "Live judge question ('critical things in this doc which I need to be aware of') returns several cited clauses end-to-end"
    verification: []
    human_judgment: true
    rationale: "Live model asks cost 5-40s CPU each and were explicitly forbidden during execution (dev server running detached); a human must ask one broad question in the browser once before judging."

# Metrics
duration: ~30min active
completed: 2026-10-18
status: complete
---

# Quick Task: Multi-Clause Answers Summary

**Broad legal questions now return 2-5 individually-verified clauses — each with its own verbatim quote and page chip — while the single-answer contract, the GRD-01 gate, and every existing consumer stay byte-for-byte compatible.**

## Performance

- **Duration:** ~30 min active work
- **Started:** 2026-10-18T10:35:00Z (approx, session start)
- **Completed:** 2026-10-18
- **Tasks:** 5
- **Files modified:** 9 (8 modified, 1 created)

## Accomplishments

- **Multi-claim model contract** — `lib/ollama.js` `usable()` now accepts either the legacy `{quote, plain}` or `{plain, claims:[…]}` (1-8 claims, each with its own non-empty `quote`, optional `plain` string); `num_predict` raised 768 → 1100 for headroom across several short quotes.
- **Per-claim verify pass** — new pure `verifiedClaims(reply, top)` in `lib/pipeline.js` normalises the reply (legacy → one claim), runs each `quote` through the unchanged `lib/verify.js` gate, and keeps only verified claims in model order as `{quote, page, plain?}`. `answer()` returns `{answer, quote, page, claims}` where `quote`/`page` mirror `claims[0]`.
- **Refusal path preserved** — zero verified claims returns the exact existing `{unverifiable:true, reason:'quote not found in source'}`; the gate is never relaxed, and an invented quote is dropped (pinned by the new pipeline test).
- **Browser answer panel** — `public/index.html` answer region is now `#answer-text` + an `#answer-claims` container; `renderClaims()` in `public/app.js` builds a `blockquote.chunk-card.answer-quote` per claim with a reused `p. N` page chip, the verbatim quote, and the claim's one-liner when present. A legacy reply without `claims` falls back to the single `{quote, page}`. One verified claim renders exactly as the pre-change panel did.
- **Contract documented** — `docs/api.md` §2 and the `POST /api/ask` success line now show `claims` as additive/optional; the reserved Phase-2 field list (`tier`, `kind`, `escalate`, `confidence_basis`) is unchanged.
- **Tests** — `npm test` 29/29 green (27 pre-existing + 2 new); `node --check` clean on every touched JS file (`lib/ollama.js`, `lib/pipeline.js`, `public/app.js`, `lib/ollama.test.js`, `lib/pipeline.test.js`).

## Task Commits

Each task was committed atomically on `main`:

1. **Task 1: multi-claim `usable()` + num_predict 1100** - `b401ec4` (feat)
2. **Task 2: per-claim verify, additive claims array, new SYSTEM_PROMPT** - `d4955c8` (feat)
3. **Task 3: render one quote block per verified claim (+ invalidated test pins)** - `a6d1aaa` (feat)
4. **Task 4: document the additive claims field** - `a962eb3` (docs)
5. **Task 5: two test additions (ollama multi-claim + pipeline per-claim gate)** - `298aff5` (test)

**Plan metadata:** `358743f` (docs: complete quick task + STATE row)

## Files Created/Modified

- `lib/ollama.js` - `usable()` accepts `{plain, claims[1-8]}` or legacy `{quote, plain}`; `num_predict` 768 → 1100
- `lib/pipeline.js` - verbatim multi-claim `SYSTEM_PROMPT`; exported `verifiedClaims()`; `answer()` returns the additive `claims` array
- `lib/pipeline.test.js` - **new**; `verifiedClaims` keeps only verified claims in model order, legacy reply → one claim
- `lib/ollama.test.js` - new test: a multi-claim reply passes through without fallback
- `public/index.html` - answer region: `#answer-text` + `#answer-claims`
- `public/app.js` - `renderClaims()` builds one quote block per claim; legacy fallback
- `public/styles.css` - `.answer-claims` spacing, `.answer-claim-body`, `.claim-plain`
- `public.test.js` - moved the `<blockquote` pin into the app.js test and replaced the `#answer-page` pin with `#answer-claims`
- `docs/api.md` - additive `claims` field on the answer object and the `POST /api/ask` success shape

## Decisions Made

- **Additive, never reshaping** — `{answer, quote, page}` keeps working and `quote`/`page` mirror `claims[0]`; the wire shape only ever gains an optional `claims` array. `cli.js` keeps working untouched through the backward-compatible fields.
- **Gate unchanged** — every claim passes the same `lib/verify.js` substring check; `lib/verify.js` was read but not edited. Unverifiable claims are dropped and never displayed.
- **Pure helper for testability** — `verifiedClaims` is exported so the gate is exercised with fixture chunks: no socket, no `./data` writes (the detached dev server owns `./data`, so writing `chunks.json` in a test was unsafe).
- **Legacy reply tolerance** — `usable()` and `verifiedClaims()` both accept `{quote, plain}`, so a model (or an older server) replying in the old shape still produces a correct answer.
- **Client fallback** — `renderClaims()` falls back to `[body]` when `claims` is absent, so the UI degrades gracefully against an older `/api/ask` response.

## Deviations from Plan

**1. Task 5's "update any `public.test.js` pin that the markup change invalidates" was absorbed into Task 3.**

- **Found during:** Task 3 (browser answer panel) — the plan's Hard Rule says `npm test` must be fully green before every commit, but the markup change breaks the `id="answer-page"` / `<blockquote` pins, which the plan schedules for Task 5.
- **Fix:** the two invalidated pins were updated inside the Task 3 commit (`a6d1aaa`) — the `<blockquote` pin moved to the `app.js` test (where the blockquote is now created) and the `#answer-page` pin became `#answer-claims`. Task 5 then only added the two new tests.
- **Files modified:** `public.test.js` (in the Task 3 commit)
- **Verification:** `npm test` green at every commit; 29/29 at the end
- **Committed in:** `a6d1aaa` (Task 3)

---

**Total deviations:** 1 (task-ordering adjustment, not a code change)
**Impact on plan:** No scope creep; the only effect is *which* commit carries the pin updates. The alternative (committing Task 3 red) would have violated the plan's own Hard Rule.

## Issues Encountered

None. `server.js` needed no change — it does `res.json(result)`, so the additive `claims` array rides through the route untouched (verified read-only; `server.js` was not edited).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 (evidence tiers: `tier`/`kind`/`escalate`/`confidence_basis`) can extend the same answer object — the `claims` array is the natural per-clause carrier and the reserved field list is untouched.
- D3 and D5 carry `human_judgment: true`: a human should ask one broad question (e.g. *"critical things in this doc which I need to be aware of"*) in the running browser once, and confirm a single-clause answer still looks exactly as before.
- Deliberately untouched: `lib/verify.js`, `lib/embed.js`, `lib/parse.js`, `lib/chunk.js`, `server.js`, `cli.js`; tier badges / refusal copy / answer history stay out.

---
*Phase: quick/multi-claim-answers*
*Completed: 2026-10-18*

## Self-Check: PASSED

- FOUND: lib/ollama.js (`node --check` clean)
- FOUND: lib/pipeline.js (`node --check` clean)
- FOUND: lib/pipeline.test.js (new file; test passes)
- FOUND: lib/ollama.test.js (multi-claim test passes)
- FOUND: public/index.html, public/app.js, public/styles.css, public.test.js (29/29 green)
- FOUND: docs/api.md (claims field documented)
- FOUND: commit b401ec4 (ancestor of HEAD)
- FOUND: commit d4955c8 (ancestor of HEAD)
- FOUND: commit a6d1aaa (ancestor of HEAD)
- FOUND: commit a962eb3 (ancestor of HEAD)
- FOUND: commit 298aff5 (ancestor of HEAD)
