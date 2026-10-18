<!-- refreshed: 2026-10-18 -->
# Architecture

**Analysis Date:** 2026-10-18

**Status:** Pre-implementation. No application code exists yet. The repo contains only agent/tooling configuration (`.opencode/`) and planning documents (`tasks/`). The architecture below describes the **planned** system as specified in `tasks/plan.md` — treat it as the contract for new code, not as existing code.

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     Clients                                  │
│  Browser UI (`public/`)          CLI (`cli.js`)              │
└────────┬────────────────────────────────┬────────────────────┘
         │ HTTP (localhost)               │ direct module calls
         ▼                                │
┌─────────────────────────────────────────────────────────────┐
│                  Express API (server entry)                  │
│  POST /api/upload · POST /api/ask · GET /api/doc/:id        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Core pipeline (`lib/`)                      │
│  parse.js → chunk.js → embed.js → retrieve (cosine top-k)   │
│  → ollama.js (chat, JSON mode) → verify.js (quote gate)     │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Local storage (JSON on disk): `chunks.json`                 │
│  No vector DB — chunks + embeddings in one JSON file         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼  (only outbound network: 127.0.0.1:11434)
┌─────────────────────────────────────────────────────────────┐
│  Ollama (local): /api/chat gemma3n:e2b (fallback gemma3:4b)  │
│                  /api/embed embeddinggemma                   │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Single-process, local-first pipeline / modular monolith. No framework beyond Express; no database; no cloud services.

**Key Characteristics:**
- Offline by construction: the only permitted outbound socket is `127.0.0.1:11434` (Ollama). Privacy is proven by monitoring, not promised (`scripts/privacy-evidence.ps1` → `evidence/privacy-report.md`).
- Deterministic verification gate: the LLM's `quote` must occur verbatim (whitespace-normalised) in the stored chunk; non-matching claims are dropped and reported as unverifiable. This is code, not prompt guidance (`lib/verify.js`).
- Structured output enforced at the API boundary: Ollama `format:"json"` plus a normalised answer schema with `tier` (`stated` | `interpretation` | `not_in_document`), `kind`, `escalate`, `confidence_basis`.
- Storage is a single JSON file (`chunks.json`) — a vector DB was explicitly rejected as a dependency, not a feature.

## Layers

**Clients:**
- Purpose: human interaction (browser demo + CLI for checkpoints)
- Location (planned): `public/`, `cli.js`
- Contains: static HTML/JS UI; CLI arg parsing calling `lib/` directly
- Depends on: Express API (browser) or `lib/` modules (CLI)
- Used by: judges/demo operators

**API:**
- Purpose: HTTP surface over the pipeline
- Location (planned): Express app; routes `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id`
- Contains: route handlers, request validation, static serving of `public/`
- Depends on: all `lib/` modules
- Used by: `public/` UI

**Pipeline core:**
- Purpose: parse → chunk → embed → retrieve → generate → verify
- Location (planned): `lib/` (`parse.js`, `chunk.js`, `embed.js`, `ollama.js`, `verify.js`)
- Contains: pure-ish JS functions over document text and JSON data
- Depends on: `pdfjs-dist`, Ollama HTTP API (localhost only)
- Used by: API layer, CLI, tests

**Persistence:**
- Purpose: hold chunks + embeddings for the current document
- Location (planned): `chunks.json` on disk
- Depends on: nothing
- Used by: retrieval step, `GET /api/doc/:id`

**Evidence & fixtures:**
- Purpose: produce judge-facing proof (privacy, robustness, benchmarks)
- Location (planned): `scripts/`, `fixtures/`, `evidence/`
- Used by: submission docs (`docs/submission.md`)

## Data Flow

### Primary Request Path (planned)

1. Upload: PDF/TXT → `lib/parse.js` (pdfjs-dist per-page text) → `lib/chunk.js` (paragraph + page) → `lib/embed.js` (`embeddinggemma`) → `chunks.json`
2. Ask: question → cosine top-k retrieval over stored embeddings → `lib/ollama.js` chat (`gemma3n:e2b`, `format:"json"`) → `{quote, plain, kind, tier, escalate}`
3. Verify + respond: `lib/verify.js` checks `quote ∈ chunk` (whitespace-normalised) → keep or drop as unverifiable → UI renders answer + side-by-side source passage + page number + tier badge

### Privacy Evidence Flow (planned)

1. Enable firewall block rule (loopback exempt)
2. Run full app workflow while `scripts/privacy-evidence.ps1` records every non-loopback TCP connection of `node.exe`/`ollama.exe`
3. Write `evidence/privacy-report.md`

**State Management:** None beyond the on-disk `chunks.json` for the current document; documents are handled one at a time. No session state, no DB, no cache.

## Key Abstractions

**Answer schema (planned):**
- Purpose: normalised, judge-inspectable answer shape separating what the doc *says* from what it *implies* and what it does not answer
- Fields: `quote` (verbatim), `plain` (plain language), `kind` (obligation/right/penalty/termination/date/party), `tier` (`stated` | `interpretation` | `not_in_document`), `escalate`, `confidence_basis`
- Enforced by: `lib/verify.js` (tier normalisation) + JSON-mode prompt

**Citation verifier (planned):**
- Purpose: hard gate against fabricated citations
- Location: `lib/verify.js`
- Pattern: normalise whitespace/dashes/ligatures, then exact substring match of `quote` in chunk text; near-matches logged honestly as unverifiable

**chunks.json record (planned):**
- Purpose: single source of retrieval truth (text + page + embedding)
- Contract to be agreed in Phase 0 (`docs/api.md`, Task 0) before implementation

## Entry Points

**Application server (planned):**
- Location: Express app (server entry at repo root)
- Triggers: `npm start` / `node <server>.js`
- Responsibilities: serve `public/`, expose `/api/upload`, `/api/ask`, `/api/doc/:id`

**CLI (planned):**
- Location: `cli.js`
- Triggers: `node cli.js ask sample.pdf "what is the notice period?"`
- Responsibilities: end-to-end pipeline without a browser (Checkpoint 1 gate)

**Tooling (existing, not application code):**
- Location: `.opencode/` (agents, commands, hooks, skills, `gsd-core/`), invoked via OpenCode/GSD commands — workflow infrastructure only, unrelated to the app at runtime.

## Architectural Constraints

- **Threading:** Single Node process; CPU-bound local LLM inference happens in a separate `ollama.exe` process. No worker threads planned.
- **Global state:** None planned; `chunks.json` is the only shared artifact, treated as one-document-at-a-time state.
- **Network:** Hard constraint — no outbound socket except `127.0.0.1:11434`. Ollama update checks disabled (`OLLAMA_NO_UPDATE_CHECKS=true`, run `ollama serve`).
- **Runtime:** Node 24, plain JavaScript (no TypeScript) — chosen because system Python is 3.7.9 and unusable for modern libs.
- **Environment:** Windows host (PowerShell evidence scripts); 15 GB RAM box constrains model choice (`gemma3n:e2b` ~7.8 GB, fallback `gemma3:4b`).

## Anti-Patterns

### Adding a database or vector store

**What happens:** Reaching for SQLite/Redis/a vector DB for document chunks.
**Why it's wrong:** The plan explicitly rejects it — one document at a time, cosine similarity in ~20 lines of JS; a DB is a dependency, not a feature.
**Do this instead:** Keep chunks + embeddings in `chunks.json` with a small in-file cosine ranker.

### Trusting LLM output without verification

**What happens:** Rendering model answers/citations directly in the UI.
**Why it's wrong:** Fabricated citations fail a hard judging gate; the whole credibility of the product rests on verbatim quotes.
**Do this instead:** Route every claim through `lib/verify.js`; drop non-matching quotes and surface them as unverifiable.

### Any outbound network call besides localhost

**What happens:** CDN fonts, analytics, package telemetry, or default Ollama update checks during a run.
**Why it's wrong:** Breaks the privacy guarantee and the evidence capture in `evidence/privacy-report.md`.
**Do this instead:** All assets local, all inference local; disable update checks; verify via `scripts/privacy-evidence.ps1`.

## Error Handling

**Strategy:** Not yet implemented. Planned behaviours from `tasks/plan.md`:
- Retrieval empty → "document is silent on this" response (not an error)
- Legal-validity questions ("is this enforceable?") → refusal path with escalation text, never a verdict
- Quote verification failure → drop claim, report as unverifiable
- Ollama slowness/failure → retries and fallback model `gemma3:4b` in `lib/ollama.js`

## Cross-Cutting Concerns

**Logging:** Not detected (no code). Evidence artifacts (`evidence/*.md`) serve as the audit trail.
**Validation:** Input documents validated at upload; answer schema validated by JSON mode + verifier.
**Authentication:** None — local-only single-user app.

---

*Architecture analysis: 2026-10-18*
