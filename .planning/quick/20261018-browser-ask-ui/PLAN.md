---
phase: quick
slug: browser-ask-ui
created: 2026-10-18
status: in-progress
---

# Quick Task: Browser Ask UI (Phase-2 slice pulled forward)

**User decision:** hackathon deadline 20:30 IST — pull the browser Q&A forward from Phase 2 as a
minimal slice. Evidence-tier badges, refusal-copy polish, and answer-schema changes STAY in
Phase 2 (do not implement them here).

**Goal:** After upload shows the chunk list, the user can type a question in the browser and see
the grounded answer — plain-language answer text, the verbatim quote, and a page chip — rendered
from the existing `POST /api/ask` route. This makes the full demo flow (upload → chunks → ask →
verbatim cited answer) possible without leaving the browser.

**Contract (docs/api.md — unchanged, do not edit):**
- `POST /api/ask` JSON `{question}` → `{answer, quote, page}` on success, `{error}` on failure.
- Loopback only — no external URLs anywhere in `public/` (privacy rule, hard gate).

**Tasks:**
1. `public/index.html` + `public/app.js` + `public/styles.css`: ask form (label + text input +
   Ask button) and answer region (hidden until answered). Render `answer` as plain text,
   `quote` in a blockquote, `page` as the existing page-chip style. Loading state while the
   local model thinks (CPU inference takes 30-60s — button disabled + "Thinking locally…"
   status, fetch must not be aborted). `error` responses render as the existing error banner
   style. Accessible labels consistent with the existing upload controls.
2. `public.test.js`: flip the D-04 "no Q&A UI in public/" scope lock — the phase-1 CLI-only pin
   is intentionally lifted by this task. Keep the no-external-URL assertion; add string pins
   in the existing suite style asserting `/api/ask` IS referenced from app.js and the new
   elements exist in index.html.
3. Verify: `npm test` green (all existing tests + updated pins); `node --check` on touched JS.
   The dev server is RUNNING on 127.0.0.1:3000 — do NOT start, restart, or kill it; static
   files serve from disk, and `POST /api/ask` is already live (proven by curl). Do NOT run
   live model asks during verification (the pipeline was already proven end-to-end).

**Out of scope (Phase 2):** evidence-tier badges, refusal/escalation copy, `tier` field in the
API response, answer history, multi-document state.
