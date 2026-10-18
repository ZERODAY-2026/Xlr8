# Todo — PS2 Legal Triage (deadline 20:30)

Legend: `[ ]` open · `[~]` in progress · `[x]` done. Checkpoints are hard stops.

## Phase 0 — Contract (by 10:30)
- [ ] Task 0: API contract in `docs/api.md`; `git init`, MIT LICENSE, `.gitignore`, pinned `package.json` — **all three**

## Phase 1 — Vertical slice (by 12:30)
- [ ] Task 1 (P1): `lib/parse.js` — pdfjs-dist page-aware text + TXT path
- [ ] Task 2 (P1): `lib/chunk.js`, `lib/embed.js`, `chunks.json`, cosine retrieval
- [ ] Task 3 (P1): `lib/ollama.js` — chat, `format:"json"`, fallback to `gemma3:4b`
- [ ] Task 4 (P1): `lib/verify.js` — verbatim quote gate + tier normalisation
- [ ] Task 5 (P3): upload + chunk list with page numbers
- [ ] Gather 3–5 sample documents + licences (P2, during Phase 1)

### Checkpoint 1 (12:30)
- [ ] CLI ask → answer + quote + page works end-to-end
- [ ] Only localhost connections observed
- [ ] Human review before Phase 2

## Phase 2 — Scored behaviour (by 15:00)
- [ ] Task 6 (P1): answer schema — `tier`, `kind`, `escalate`, `confidence_basis`
- [ ] Task 7 (P1): refusal paths + "document is silent" case
- [ ] Task 8 (P3): Q&A UI — side-by-side source, tier badges, escalation banner, disclaimer
- [ ] Task 9 (P2): `scripts/privacy-evidence.ps1` → `evidence/privacy-report.md`

### Checkpoint 2 (15:00)
- [ ] Browser end-to-end demo works
- [ ] Privacy evidence captured on a full run
- [ ] Refusal + silent-document demonstrated

## Phase 3 — Beyond the minimum (by 17:30)
- [ ] Task 10: structured extraction panel (parties, dates, penalties, notice periods)
- [ ] Task 11: adversarial + prompt-injection fixtures → `evidence/robustness.md`
- [ ] Task 12: speed/memory benchmark → `evidence/benchmarks.md`
- [ ] Task 13: `node:test` — verifier rejects fabricated quote, tiers, page mapping
- [ ] Task 14 (stretch): two-version comparison

### Checkpoint 3 (17:30) — hard stop, no new work
- [ ] All of Tasks 10–13 green

## Phase 4 — Ship (by 20:30)
- [ ] Task 15 (P2): README — overview, setup, run, config, troubleshooting, pinned deps, hardware, model sizes, architecture (S2–S4)
- [ ] Task 16 (P2): dataset sources/licences/attribution, known limitations (S5, S8)
- [ ] Task 17: 5-minute recording incl. limits, refusal, silent case, privacy evidence (S7, S9)
- [ ] Task 18: `docs/submission.md` — S1–S10, L1–L10, G1–G5 with proof locations

### Checkpoint 4 (20:00)
- [ ] Fresh-clone run-through by whoever did not build it
- [ ] Submit before 20:30
