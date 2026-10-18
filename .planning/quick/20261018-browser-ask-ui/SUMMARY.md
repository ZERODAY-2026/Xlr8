---
phase: quick
plan: browser-ask-ui
subsystem: ui
tags: [browser-ui, vanilla-js, api-ask, grounding, accessibility]

# Dependency graph
requires:
  - phase: 01-contract-vertical-slice
    provides: "Upload shell + chunk list in public/, POST /api/ask route proven live, docs/api.md contract"
provides:
  - "Browser ask form wired to POST /api/ask (loopback only)"
  - "Answer panel rendering plain-language answer + verbatim quote + page chip"
  - "D-04 CLI-only scope lock lifted in public.test.js with new ask-UI pins"
affects: [02-evidence-tiers, 03-refusal-copy]

# Actuals (#2632)
actuals:
  tokens: 1816    # chars/4 over the realized diff (public/ files, tasks 1-2)
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns: ["answer panel shares chunk-card/page-chip chrome; model text via textContent only"]

key-files:
  created: []
  modified:
    - public/index.html
    - public/app.js
    - public/styles.css
    - public.test.js

key-decisions:
  - "Ask button uses chrome-neutral (btn-neutral) styling — accent #295499 stays reserved for the upload CTA + focus ring per 01-UI-SPEC"
  - "Unverifiable-quote and error responses both render in the existing destructive banner; the UI never renders a quote the verifier rejected"
  - "ask() shares the upload `busy` flag so an ask and an upload cannot race the single-document session"

requirements-completed: []

coverage:
  - id: D1
    description: "Ask form + answer panel wired to POST /api/ask with accessible labels and loading state"
    verification:
      - kind: unit
        ref: "public.test.js#app.js drives the ask flow against the local API"
        status: pass
      - kind: unit
        ref: "public.test.js#index.html carries the ask form and answer region"
        status: pass
      - kind: other
        ref: "GET http://127.0.0.1:3000/ serves updated shell (HTTP 200, ask-form + answer present)"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-04 scope lock flipped: Q&A allowed in public/, external URLs still banned"
    verification:
      - kind: unit
        ref: "public.test.js#no external http(s) references in public/ (privacy loopback-only gate)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live end-to-end ask demo flow (upload → chunks → ask → grounded answer) in the browser"
    verification: []
    human_judgment: true
    rationale: "Live model asks take 30-60s CPU each and were explicitly excluded from executor verification (dev server running, route proven by curl beforehand); a human must click through the demo once before judging."

# Metrics
duration: ~25min active (77min wall incl. context reads)
completed: 2026-10-18
status: complete
---

# Quick Task: Browser Ask UI Summary

**Browser Q&A slice shipped: ask form + grounded answer panel (plain answer, verbatim quote, page chip) rendered from POST /api/ask, loopback only — full upload→chunks→ask→cited-answer demo now possible without leaving the browser.**

## Performance

- **Duration:** ~25 min active work (77 min wall including required context reads)
- **Started:** 2026-10-18T11:07:01Z
- **Completed:** 2026-10-18T12:23:44Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Ask form (label `Ask about this document`, text input, Ask button) appears only with a loaded document; answer region hidden until answered
- Answer renders `answer` as plain text (textContent — no model HTML), `quote` in a blockquote using the existing chunk-card + page-chip chrome, `page` as `p. N`
- Loading state for 30–60s CPU inference: button disabled, `Thinking locally…` status (role="status"), fetch never aborted
- Error and `unverifiable` responses render in the existing destructive banner; the verified quote is the only quote the UI can render
- D-04 "no Q&A in public/" pin flipped per this task's mandate; loopback-only no-external-URL gate kept; new string pins for `/api/ask`, `Thinking locally…`, and the new elements
- `npm test`: 24/24 green (18 pre-existing + 6 new/updated); `node --check public/app.js` clean; live GET of the running server serves the new shell (HTTP 200)

## Task Commits

Each task was committed atomically:

1. **Task 1: ask form + answer panel (index.html/app.js/styles.css)** - `7591ffd` (feat)
2. **Task 2: flip D-04 pin, add ask-UI pins (public.test.js)** - `bdf3d4e` (test)
3. **Task 3: verification** - no commit needed (ran `npm test`, `node --check`, live GET)

## Files Created/Modified

- `public/index.html` - Ask section: form (label + input + Ask button), status line, answer region with blockquote
- `public/app.js` - ask() flow against POST /api/ask; shared busy flag; render/unverifiable handling; ask UI cleared on document remove
- `public/styles.css` - ask styles reusing existing design tokens; no new accent uses
- `public.test.js` - D-04 lock lifted, loopback gate kept, ask-UI pins added

## Decisions Made

- **Ask button is chrome-neutral, not accent** — 01-UI-SPEC reserves accent #295499 for the upload CTA, active state and focus ring only; the Ask button reuses the `.btn-neutral` treatment
- **Unverifiable → banner** — `{unverifiable, reason}` (docs/api.md §2) renders in the error banner; the UI never displays an unverified quote
- **Shared `busy` flag** — an in-flight ask blocks upload and vice versa, preventing a session swap mid-ask (POST /api/ask uses the most recent document)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 (evidence tiers, refusal copy, `tier` in the answer object) can build directly on this answer panel; D3 (live demo click-through) should be exercised once before judging
- Out-of-scope items deliberately untouched: tier badges, refusal/escalation copy, answer history, multi-doc state

---
*Phase: quick/browser-ask-ui*
*Completed: 2026-10-18*

## Self-Check: PASSED

- FOUND: public/index.html (ask section present, verified by test + live GET)
- FOUND: public/app.js (`node --check` clean, `/api/ask` pin passes)
- FOUND: public/styles.css (design-token test passes)
- FOUND: public.test.js (24/24 tests green)
- FOUND: commit 7591ffd (ancestor of HEAD)
- FOUND: commit bdf3d4e (ancestor of HEAD)
