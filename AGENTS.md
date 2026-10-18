<!-- GSD:project-start source:PROJECT.md -->

## Project

**LegalTriage (PS2) — Private Legal Document Triage Agent**

An offline, on-device legal-document explainer built for ZeroDay OSS Hacktoberfest 2026, problem statement PS2. A non-lawyer uploads a rental agreement, employment contract, legal notice or service agreement (PDF or TXT); the tool explains clauses in plain language with verbatim cited passages, keeps what the document *states* apart from what it *implies*, flags what the document does not answer, and declines to give legal verdicts. Every byte of document content stays on the machine. The immediate users are the hackathon judges, scoring against the published PS2 rubric before 20:30 IST on 18 October 2026.

**Core Value:** Every claim in every answer maps to a verbatim quote from the uploaded document that a judge can check — and when the document is silent, the tool says so instead of guessing. This drives every tradeoff: rubric criteria 2 (grounding), 3 (uncertainty/refusal) and 4 (privacy) carry a **safety cap at 40/100** if any lands in the Poor band, so polish is worthless until those three are proven.

### Constraints

- **Timeline**: submission deadline 20:30 IST, 18 October 2026 — hard feature freeze at 17:30, fresh-clone run-through at 20:00 — because a demo that only works on the builder's machine fails gates G2 and G3
- **Tech stack**: Node 24 + Express, plain JS (no TypeScript build step), `pdfjs-dist` for page-aware PDF text — because page numbers are required for "page N" citations and Python 3.7.9 cannot host modern parsing libraries
- **Model**: Gemma 3n-class run through local Ollama — required technology for the track, and the only thing allowed to see document content
- **Privacy**: the process may open no socket other than `127.0.0.1:11434`; Ollama update checks disabled (`OLLAMA_NO_UPDATE_CHECKS=true`, `ollama serve` instead of the tray app) and documented as the one setup-time network call — because the guide requires any remaining network access to carry no content and be off or optional
- **Memory**: ~15 GB RAM shared with the browser during a live demo — because CPU inference plus a 7.8 GB model plus a browser is a real swap risk, retrieval is capped at top-k 6 chunks
- **Repo**: GitHub repository is assigned by the organizers later today and cannot be pushed to yet — because G1 requires a public repo by submission, local `git init` plus clean atomic commits now, push the moment the repo exists
- **Data licences**: only CC-licensed or self-authored documents may be committed, with sources and attributions disclosed — because G4 forbids committing private or non-redistributable data. India Code's terms were not verified and the site blocks automated access; Open India Law needs Hugging Face login and is ~54 GB, so neither is committed
- **Temp hygiene**: extracted text, chunks and embeddings live in the project directory and must not leak into system temp folders — because judges explicitly check temporary files

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JSON / Markdown - Agent configuration and planning docs only (`.opencode/`, `tasks/`)
- JavaScript (plain, **no TypeScript**) - Application code, Node 24, Express
- PowerShell - `scripts/privacy-evidence.ps1` privacy audit script (planned, `tasks/plan.md:84`)

## Runtime

- Node.js 24 - stated as installed on the host (`tasks/plan.md:15`)
- Ollama - local LLM server on `127.0.0.1:11434`, run via `ollama serve` with `OLLAMA_NO_UPDATE_CHECKS=true` (`tasks/plan.md:36-38`)
- npm (implied by planned `package.json` with pinned deps, `tasks/plan.md:63`)
- Lockfile: missing (no `package-lock.json` yet)

## Frameworks

- Express - HTTP API server; routes planned: `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` (`tasks/plan.md:61-62`)
- Ollama `/api/chat` - LLM inference, model `gemma3n:e2b` with `format: "json"`, fallback `gemma3:4b` (`tasks/plan.md:20-21`)
- Ollama `/api/embed` - embeddings via `embeddinggemma` (`tasks/plan.md:22-23`)
- `node:test` - built-in Node test runner for verifier, tier normalisation, chunker page mapping (`tasks/plan.md:97-98`)
- Not detected - no bundler, transpiler, or build step planned (plain JS served/run directly by Node)

## Key Dependencies

- `pdfjs-dist` - PDF parsing with **per-page** text extraction, required for "page N" citations (`tasks/plan.md:16-17`)
- No vector database - chunks + embeddings stored in a single JSON file (`chunks.json`); cosine similarity implemented in ~20 lines of JS (`tasks/plan.md:18-19`)
- No TypeScript, no ORM, no frontend framework stated in the plan (browser UI is plain, `tasks/plan.md:24-25` in todo Task 8)
- `@opengsd/gsd-core` - GSD MCP server, launched via `npx -y` in `.opencode/opencode.json:10-23` (not an app dependency)
- Bundled plugin runtime: `.opencode/plugins/gsd-core.js` + `.opencode/plugins/package.json`

## Configuration

- No `.env` files present and none planned. The app is designed to run with **zero configuration** apart from a local Ollama instance.
- Planned runtime env var: `OLLAMA_NO_UPDATE_CHECKS=true` (disables Ollama's one outbound update check; `tasks/plan.md:36-38`)
- Not detected - no `tsconfig.json`, bundler config, or `package.json` exists yet.
- `.opencode/opencode.json` - permissions + GSD MCP server definition
- `.opencode/settings.json` - empty (`{}`)

## Platform Requirements

- Windows host (PowerShell evidence script, `ollama.exe`/`node.exe` process names in `tasks/plan.md:32-33`)
- Node 24 + git installed
- Ollama with `gemma3n:e2b` (~7.8 GB) on a ~15 GB box; `gemma3:4b` as fallback (`tasks/plan.md:131`)
- CPU-only inference (no GPU assumed); retrieval keeps prompts to top-k 6 chunks for speed (`tasks/plan.md:132`)
- Not applicable - single-machine, offline, on-device demo app; no deployment target.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Single-word lowercase `.js` modules in `lib/`, one responsibility per file:
- Entry-point CLI at repo root: `cli.js` (Checkpoint 1 command:
- Scripts use kebab-case with extension: `scripts/privacy-evidence.ps1`
- Data file is a plain lowercase noun: `chunks.json`
- Docs are lowercase words in `docs/`: `docs/api.md`, `docs/submission.md`
- Evidence artefacts are kebab-case markdown in `evidence/`: `evidence/privacy-report.md`,
- HTML/CSS/JS for the browser live in `public/` (Task 5, Task 8)
- Not detected (no source files yet). Plan language implies verb-named single-purpose
- Not detected. Data shape names are fixed by the plan and must be used verbatim:
- Evidence tiers: `stated` | `interpretation` | `not_in_document`
- `kind`: `obligation` | `right` | `penalty` | `termination` | `date` | `party`
- `escalate`: boolean, true for jurisdiction-dependent / validity questions
- Chunk record: `{page, text}` per page from `lib/parse.js`; chunker emits paragraph + page
- `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` — contract documented in

## Code Style

- No formatter config detected (no `.prettierrc`, `eslint.config.*`, `biome.json`,
- Not detected. No ESLint/Prettier/Biome present or planned in `tasks/plan.md`.
- Plain JavaScript, **no TypeScript**, on **Node 24** (`tasks/plan.md` Architecture
- No build step, no bundler — browser code in `public/` loads directly.
- Network egress is a hard rule: the only outbound socket allowed is `127.0.0.1:11434`
- No vector DB / extra infra: cosine similarity in ~20 lines of JS over one JSON file.

## Import Organization

- Not detected (no source files yet).
- Not decided in the repo — `package.json` does not exist yet (Task 0 creates it, pinned
- Not detected. Use relative paths (`./verify.js`) — no alias config exists.

## Error Handling

- **Hard verification gate, not best-effort.** Every `quote` returned by the model must
- **Refusal paths instead of guesses.** "is this enforceable?" → decline + escalation
- **Structured failures from the LLM client.** `lib/ollama.js` (Task 3) uses
- **Normalise before matching.** Whitespace, dashes, ligatures normalised for the quote
- **Evidence over assertion.** Any privacy/robustness/performance claim is proven by a

## Logging

- The only mandated outputs are the `evidence/*.md` reports and honest "near-match" /

## Comments

- Not detected in project code. House style visible in in-repo tooling

## Function Design

- Deterministic data shapes, not exceptions, for domain outcomes: the answer object

## Module Design

## Working Agreement (from `tasks/todo.md`)

- Checkboxes are the tracking mechanism: `[ ]` open · `[~]` in progress · `[x]` done in
- Role ownership: P1 owns `lib/` + API, P2 owns `scripts/`, `evidence/`, docs, tests,
- Contract first: agree `chunks.json` shape, answer schema, and routes in `docs/api.md`
- Repo hygiene in Task 0: `git init`, MIT `LICENSE`, `.gitignore` (exclude

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File (planned) |
|-----------|----------------|----------------|
| Page-aware parser | PDF/TXT → `[{page, text}]` via `pdfjs-dist` | `lib/parse.js` |
| Chunker | Paragraph+page chunks | `lib/chunk.js` |
| Embedder | `embeddinggemma` embeddings → `chunks.json` | `lib/embed.js` |
| Ollama client | `/api/chat` with `format:"json"`, retries, model fallback | `lib/ollama.js` |
| Citation verifier | Verbatim quote-exists gate + tier normalisation | `lib/verify.js` |
| API server | Express routes: upload, ask, doc fetch | server entry (Express app) |
| CLI | `node cli.js ask <file> "<question>"` | `cli.js` |
| Browser UI | Upload, chunk list, Q&A with side-by-side citations, tier badges | `public/` |
| Privacy evidence | Records all non-loopback TCP connections during a run | `scripts/privacy-evidence.ps1` |
| Robustness fixtures | Adversarial + prompt-injection inputs, runner | `fixtures/`, evidence runner |

## Pattern Overview

- Offline by construction: the only permitted outbound socket is `127.0.0.1:11434` (Ollama). Privacy is proven by monitoring, not promised (`scripts/privacy-evidence.ps1` → `evidence/privacy-report.md`).
- Deterministic verification gate: the LLM's `quote` must occur verbatim (whitespace-normalised) in the stored chunk; non-matching claims are dropped and reported as unverifiable. This is code, not prompt guidance (`lib/verify.js`).
- Structured output enforced at the API boundary: Ollama `format:"json"` plus a normalised answer schema with `tier` (`stated` | `interpretation` | `not_in_document`), `kind`, `escalate`, `confidence_basis`.
- Storage is a single JSON file (`chunks.json`) — a vector DB was explicitly rejected as a dependency, not a feature.

## Layers

- Purpose: human interaction (browser demo + CLI for checkpoints)
- Location (planned): `public/`, `cli.js`
- Contains: static HTML/JS UI; CLI arg parsing calling `lib/` directly
- Depends on: Express API (browser) or `lib/` modules (CLI)
- Used by: judges/demo operators
- Purpose: HTTP surface over the pipeline
- Location (planned): Express app; routes `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id`
- Contains: route handlers, request validation, static serving of `public/`
- Depends on: all `lib/` modules
- Used by: `public/` UI
- Purpose: parse → chunk → embed → retrieve → generate → verify
- Location (planned): `lib/` (`parse.js`, `chunk.js`, `embed.js`, `ollama.js`, `verify.js`)
- Contains: pure-ish JS functions over document text and JSON data
- Depends on: `pdfjs-dist`, Ollama HTTP API (localhost only)
- Used by: API layer, CLI, tests
- Purpose: hold chunks + embeddings for the current document
- Location (planned): `chunks.json` on disk
- Depends on: nothing
- Used by: retrieval step, `GET /api/doc/:id`
- Purpose: produce judge-facing proof (privacy, robustness, benchmarks)
- Location (planned): `scripts/`, `fixtures/`, `evidence/`
- Used by: submission docs (`docs/submission.md`)

## Data Flow

### Primary Request Path (planned)

### Privacy Evidence Flow (planned)

## Key Abstractions

- Purpose: normalised, judge-inspectable answer shape separating what the doc *says* from what it *implies* and what it does not answer
- Fields: `quote` (verbatim), `plain` (plain language), `kind` (obligation/right/penalty/termination/date/party), `tier` (`stated` | `interpretation` | `not_in_document`), `escalate`, `confidence_basis`
- Enforced by: `lib/verify.js` (tier normalisation) + JSON-mode prompt
- Purpose: hard gate against fabricated citations
- Location: `lib/verify.js`
- Pattern: normalise whitespace/dashes/ligatures, then exact substring match of `quote` in chunk text; near-matches logged honestly as unverifiable
- Purpose: single source of retrieval truth (text + page + embedding)
- Contract to be agreed in Phase 0 (`docs/api.md`, Task 0) before implementation

## Entry Points

- Location: Express app (server entry at repo root)
- Triggers: `npm start` / `node <server>.js`
- Responsibilities: serve `public/`, expose `/api/upload`, `/api/ask`, `/api/doc/:id`
- Location: `cli.js`
- Triggers: `node cli.js ask sample.pdf "what is the notice period?"`
- Responsibilities: end-to-end pipeline without a browser (Checkpoint 1 gate)
- Location: `.opencode/` (agents, commands, hooks, skills, `gsd-core/`), invoked via OpenCode/GSD commands — workflow infrastructure only, unrelated to the app at runtime.

## Architectural Constraints

- **Threading:** Single Node process; CPU-bound local LLM inference happens in a separate `ollama.exe` process. No worker threads planned.
- **Global state:** None planned; `chunks.json` is the only shared artifact, treated as one-document-at-a-time state.
- **Network:** Hard constraint — no outbound socket except `127.0.0.1:11434`. Ollama update checks disabled (`OLLAMA_NO_UPDATE_CHECKS=true`, run `ollama serve`).
- **Runtime:** Node 24, plain JavaScript (no TypeScript) — chosen because system Python is 3.7.9 and unusable for modern libs.
- **Environment:** Windows host (PowerShell evidence scripts); 15 GB RAM box constrains model choice (`gemma3n:e2b` ~7.8 GB, fallback `gemma3:4b`).

## Anti-Patterns

### Adding a database or vector store

### Trusting LLM output without verification

### Any outbound network call besides localhost

## Error Handling

- Retrieval empty → "document is silent on this" response (not an error)
- Legal-validity questions ("is this enforceable?") → refusal path with escalation text, never a verdict
- Quote verification failure → drop claim, report as unverifiable
- Ollama slowness/failure → retries and fallback model `gemma3:4b` in `lib/ollama.js`

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
