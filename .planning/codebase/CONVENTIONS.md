# Coding Conventions

**Analysis Date:** 2026-10-18

> **Repo state:** fresh hackathon project (ZeroDay OSS Hacktoberfest 2026, PS2 — Private
> Legal Document Triage Agent). No application code, `package.json`, or lint config exists
> yet. Conventions below are the ones **established in writing** in `tasks/plan.md` and
> `tasks/todo.md`. Anything not established there is marked **Not detected**.

## Naming Patterns

**Files (established — `tasks/plan.md` Task List, `tasks/todo.md`):**
- Single-word lowercase `.js` modules in `lib/`, one responsibility per file:
  `lib/parse.js`, `lib/chunk.js`, `lib/embed.js`, `lib/ollama.js`, `lib/verify.js`
- Entry-point CLI at repo root: `cli.js` (Checkpoint 1 command:
  `node cli.js ask sample.pdf "what is the notice period?"`)
- Scripts use kebab-case with extension: `scripts/privacy-evidence.ps1`
- Data file is a plain lowercase noun: `chunks.json`
- Docs are lowercase words in `docs/`: `docs/api.md`, `docs/submission.md`
- Evidence artefacts are kebab-case markdown in `evidence/`: `evidence/privacy-report.md`,
  `evidence/robustness.md`, `evidence/benchmarks.md`
- HTML/CSS/JS for the browser live in `public/` (Task 5, Task 8)

**Functions:**
- Not detected (no source files yet). Plan language implies verb-named single-purpose
  modules (`parse`, `chunk`, `embed`, `verify`) — mirror the file name in the main export.

**Variables:**
- Not detected. Data shape names are fixed by the plan and must be used verbatim:
  `quote`, `plain`, `kind`, `tier`, `escalate`, `confidence_basis`, `page`, `text`.

**Types (JSON schema names — established, `tasks/plan.md` "Architecture Decisions"):**
- Evidence tiers: `stated` | `interpretation` | `not_in_document`
- `kind`: `obligation` | `right` | `penalty` | `termination` | `date` | `party`
- `escalate`: boolean, true for jurisdiction-dependent / validity questions
- Chunk record: `{page, text}` per page from `lib/parse.js`; chunker emits paragraph + page

**API routes (established, Task 0):**
- `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` — contract documented in
  `docs/api.md` before code is written. Follow this exact shape; change it only in
  `docs/api.md` first.

## Code Style

**Formatting:**
- No formatter config detected (no `.prettierrc`, `eslint.config.*`, `biome.json`,
  `.editorconfig`). Do not add one — this is a 1-day build; the plan explicitly rejects
  dependencies that are not features ("a DB is a dependency, not a feature").

**Linting:**
- Not detected. No ESLint/Prettier/Biome present or planned in `tasks/plan.md`.

**Language level:**
- Plain JavaScript, **no TypeScript**, on **Node 24** (`tasks/plan.md` Architecture
  Decisions: "Node 24 + TypeScript-free plain JS, Express"). Do not introduce `.ts`,
  transpilers, or a build step.

**Runtime/library constraints (established):**
- No build step, no bundler — browser code in `public/` loads directly.
- Network egress is a hard rule: the only outbound socket allowed is `127.0.0.1:11434`
  (Ollama). Anything else fails the privacy gate (`scripts/privacy-evidence.ps1`).
- No vector DB / extra infra: cosine similarity in ~20 lines of JS over one JSON file.

## Import Organization

**Order:**
- Not detected (no source files yet).

**Module system:**
- Not decided in the repo — `package.json` does not exist yet (Task 0 creates it, pinned
  deps). Existing in-repo tooling uses **ESM `import` syntax** in `.mjs` files, e.g.
  `.opencode/skills/design-taste/scripts/preflight.test.mjs` line 10:
  `import { test } from "node:test";`. Pick ESM (`.js` + `"type": "module"` in
  `package.json`, or `.mjs`) when Task 0 lands and stay consistent.

**Path aliases:**
- Not detected. Use relative paths (`./verify.js`) — no alias config exists.

## Error Handling

**Patterns (established — these are scored rubric items, not preferences):**

- **Hard verification gate, not best-effort.** Every `quote` returned by the model must
  occur verbatim (whitespace-normalised) in the stored chunk text; non-matching claims are
  dropped and reported as unverifiable. Implemented in `lib/verify.js` (Task 4) and tested
  in Task 13. Never weaken this to a prompt request.
- **Refusal paths instead of guesses.** "is this enforceable?" → decline + escalation
  text; empty retrieval → "document is silent on this" (`tasks/plan.md` Task 7, Task 6).
  Unsupported claims must come back as tier `not_in_document`.
- **Structured failures from the LLM client.** `lib/ollama.js` (Task 3) uses
  `format:"json"`, retries, and a model fallback (`gemma3n:e2b` → `gemma3:4b`).
- **Normalise before matching.** Whitespace, dashes, ligatures normalised for the quote
  gate; fuzzy fallback must honestly log "near-match" (`tasks/plan.md` Risks table).
- **Evidence over assertion.** Any privacy/robustness/performance claim is proven by a
  written artefact in `evidence/` (`privacy-report.md`, `robustness.md`,
  `benchmarks.md`), each linked from `docs/submission.md`.

## Logging

**Framework:** Not detected (no logging library, no code). Use `console.*` from Node —
adding a logger is not in scope.

**Patterns:**
- The only mandated outputs are the `evidence/*.md` reports and honest "near-match" /
  "unverifiable" reporting from the verifier. Log to stdout when running `cli.js`.

## Comments

**When to Comment:**
- Not detected in project code. House style visible in in-repo tooling
  (`.opencode/skills/design-taste/scripts/preflight.test.mjs:1-8`) is: a file-header
  block saying what the file is and how to run it, plus a one-line rationale comment for
  deliberate shortcuts. Follow that.

**JSDoc/TSDoc:** Not detected. Skip — no type system to serve.

## Function Design

**Size:** Not detected. Plan implies small single-purpose modules (one file = one verb).

**Parameters:** Not detected.

**Return Values:**
- Deterministic data shapes, not exceptions, for domain outcomes: the answer object
  (`quote`, `plain`, `kind`, `tier`, `escalate`, `confidence_basis`) is returned whether
  the claim is verified or dropped (drop is expressed as tier `not_in_document` /
  unverifiable reporting, not a throw).

## Module Design

**Exports:** Not detected — no source files exist yet.

**Barrel Files:** Not used / Not detected. No index files implied by the plan.

## Working Agreement (from `tasks/todo.md`)

- Checkboxes are the tracking mechanism: `[ ]` open · `[~]` in progress · `[x]` done in
  `tasks/todo.md`. Checkpoints (13:30 / 15:00 / 17:30 / 20:00) are hard stops.
- Role ownership: P1 owns `lib/` + API, P2 owns `scripts/`, `evidence/`, docs, tests,
  submission pack, P3 owns `public/` UI. Put new code in the owner's area.
- Contract first: agree `chunks.json` shape, answer schema, and routes in `docs/api.md`
  (Task 0) **before** writing `lib/` code.
- Repo hygiene in Task 0: `git init`, MIT `LICENSE`, `.gitignore` (exclude
  `node_modules/` and evidence temp files), pinned `package.json`.

---

*Convention analysis: 2026-10-18*
