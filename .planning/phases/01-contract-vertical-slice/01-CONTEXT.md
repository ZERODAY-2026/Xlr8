# Phase 1: Contract + Vertical Slice - Context

**Gathered:** 2026-10-18
**Status:** Ready for planning

<domain>
## Phase Boundary

A working offline vertical slice exists: from a fresh checkout, a PDF/TXT document is ingested page-aware, chunked and embedded locally, and a question asked at the CLI (`node cli.js ask <doc> "<question>"`) returns a plain-language answer whose quote is verified verbatim against the source before display — proving the hard grounding gate (GRD-01) before anything else is built. Browser work in this phase is the upload shell plus chunk list with page numbers only. Proves localhost-only networking (PRV-01), `gemma3n:e2b` answer generation (MDL-01) and `embeddinggemma` retrieval (MDL-02).

</domain>

<decisions>
## Implementation Decisions

### Demo fixture documents
- **D-01:** Phase 1 demos with 2 self-authored synthetic documents — a rental agreement and an employment contract — not CUAD samples. — **Reversibility:** reversible — swapping or adding fixtures later is local authoring work with no consumer lock-in beyond tests.
- **D-02:** Fixtures read Indian-style (landlord/tenant with security deposit, notice period, maintenance charges; employment letter with probation and termination clauses), written in plain English to stay inside the stated document scope.
- **D-03:** Each fixture opens with an in-document banner line ("SYNTHETIC SAMPLE — fictitious parties, created for this demo, released under CC0 1.0") and `fixtures/SOURCES.md` records sources and licence. Party names are clearly sample names. This is the gate G4 evidence path.

### Browser slice
- **D-04:** Strict roadmap split — Phase 1 browser = upload shell + chunk list with page numbers; Q&A happens at the CLI. P3 builds Phase 2's full Q&A UI once its UI-SPEC exists, avoiding rework. — **Reversibility:** costly — pulling Q&A UI forward before the Phase 2 UI contract exists means duplicated and reshaped work.

### Checkpoint
- **D-05:** Checkpoint 1 is **one clean commit before 13:00 IST** (organizer confirmed via user, 2026-10-18) — not a formal demo gate. This supersedes the 12:30 demo-gate reading in ROADMAP.md; planning targets 13:00 IST.

### the agent's Discretion
- Proof ritual at Checkpoint 1: casual connection spot-check during a full run (e.g. `Get-NetTCPConnection`); the formal `scripts/privacy-evidence.ps1` + `evidence/privacy-report.md` stays Phase 2 per roadmap.
- Upload limits at the shell: reject files over 20 MB or PDFs over ~300 pages with a clear message, never a crash (graceful-failure depth is Phase 3; exact limits up to planner).
- Storage location: uploaded files and `chunks.json` live under `./data/`, gitignored — keeps temp hygiene and OneDrive-synced leakage paths contained to one declared directory.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — Core Value, constraints (timeline, stack, privacy, memory, data licences, temp hygiene), Key Decisions table, out-of-scope list
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: ING-01, ING-02, ING-03, GRD-01, PRV-01, MDL-01, MDL-02; Document Scope; Traceability table
- `.planning/ROADMAP.md` § Phase 1 — goal, roles (P1/P2/P3), success criteria 1–4

### Human working plan (reconciled 1:1 with the roadmap)
- `tasks/plan.md` — timed checkpoints; note Checkpoint 1 shifted to 13:00 IST per organizer
- `tasks/todo.md` — role task breakdown this phase executes against

### Codebase maps (pre-scanned)
- `.planning/codebase/STACK.md` — Node 24, Express, pdfjs-dist, Ollama endpoints, no bundler
- `.planning/codebase/ARCHITECTURE.md` — pipeline stages, component responsibilities, layers, anti-patterns
- `.planning/codebase/CONVENTIONS.md` — naming, error handling (refusal paths, normalise-before-match), working agreement

No external ADRs/specs beyond the above — requirements fully captured in REQUIREMENTS.md plus decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None in code — greenfield: no `package.json` or source files exist yet (confirmed 2026-10-18). Pre-installed local assets: `gemma3n:e2b` (~7.8 GB), `embeddinggemma` (621 MB), `gemma3:4b` fallback, Ollama 0.40.6 — already verified working on this machine.

### Established Patterns
- CONVENTIONS.md: single-word lowercase modules in `lib/` (one responsibility per file), plain JS on Node 24, deterministic data shapes instead of exceptions for domain outcomes, evidence-over-assertion for privacy/performance claims
- ARCHITECTURE.md: verifier as code not prompt guidance; single JSON file storage — no vector DB; refusal paths instead of verdicts

### Integration Points
- Planned: `lib/parse.js`, `lib/chunk.js`, `lib/embed.js`, `lib/ollama.js`, `lib/verify.js`; Express routes `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id`; `cli.js` entry point; `public/` upload shell; contract documented in `docs/api.md`

</code_context>

<specifics>
## Specific Ideas

- Organizer's Checkpoint 1 requirement: one commit before 13:00 IST (user confirmed with organizer directly)
- Fixtures should feel relatable to an Indian hackathon audience while staying plain English

</specifics>

<deferred>
## Deferred Ideas

- CUAD real-world sample document(s) — deferred to Phase 3 for robustness/test-material breadth (fetch + attribution needed; synthetic fixtures cover Phases 1–2)

</deferred>

---

*Phase: 1-Contract + Vertical Slice*
*Context gathered: 2026-10-18*
