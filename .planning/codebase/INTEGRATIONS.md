# External Integrations

**Analysis Date:** 2026-10-18

> **Status: pre-implementation.** No application code exists yet. This document records
> the integrations **planned** in `tasks/plan.md` plus the agent tooling that exists
> today under `.opencode/`. The project's defining constraint is that the application
> makes **no outbound network connections** except to a local Ollama server.

## APIs & External Services

**Local LLM (planned, the app's only runtime integration):**
- Ollama HTTP API - runs entirely on localhost; all inference and embeddings stay on-device
  - Chat: `POST http://127.0.0.1:11434/api/chat` with model `gemma3n:e2b`, `format: "json"`; fallback model `gemma3:4b` (`tasks/plan.md:20-21`)
  - Embeddings: `POST http://127.0.0.1:11434/api/embed` with model `embeddinggemma` (`tasks/plan.md:22-23`)
  - SDK/Client: none - plan specifies a thin `lib/ollama.js` client with retries and model fallback (`tasks/plan.md:80`)
  - Auth: none (loopback-only, no credentials)

**Cloud/third-party APIs:**
- None. The privacy design explicitly forbids any non-loopback socket (`tasks/plan.md:31-35`).

## Data Storage

**Databases:**
- None. Deliberate decision: no vector DB; chunks and embeddings are stored in a single on-disk JSON file, `chunks.json`, with cosine similarity computed in JS (`tasks/plan.md:18-19`).

**File Storage:**
- Local filesystem only
  - `chunks.json` - per-document chunks + embeddings (planned, `tasks/plan.md:18`)
  - `evidence/privacy-report.md`, `evidence/robustness.md`, `evidence/benchmarks.md` - generated evidence artifacts (`tasks/plan.md:33-34`, `tasks/plan.md:91-95`)
  - `fixtures/` - adversarial / prompt-injection test documents (`tasks/plan.md:93`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None. The app has no user accounts, no sessions, and no auth. It is a single-user, local, offline tool; the browser UI talks to a local Express server.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, no telemetry - telemetry would violate the privacy guarantee).

**Logs:**
- Planned: privacy evidence script `scripts/privacy-evidence.ps1` records every non-loopback TCP connection of `node.exe`/`ollama.exe` during a full run under an active firewall block rule, writing `evidence/privacy-report.md` (`tasks/plan.md:32-34`, `tasks/plan.md:84-85`).
- Benchmarking output to `evidence/benchmarks.md` (tokens/s, RSS, per-question latency) (`tasks/plan.md:95`).

## CI/CD & Deployment

**Hosting:**
- None. Single-machine, offline, on-device demo. No deployment target.

**CI Pipeline:**
- None detected. Tests use the built-in `node:test` runner, runnable locally (`tasks/plan.md:97-98`).

## Environment Configuration

**Required env vars:**
- `OLLAMA_NO_UPDATE_CHECKS=true` - disables Ollama's single setup-time outbound update check, documented as the one allowed network call (carries no document content) (`tasks/plan.md:36-38`)

**Secrets location:**
- None. No API keys, tokens, or credentials are used anywhere in the planned application.

**Agent tooling (not app runtime):**
- `.opencode/opencode.json` defines a local MCP server launched via `npx -y -p @opengsd/gsd-core gsd-mcp-server --no-prompts` - this is development tooling, not part of the shipped app.

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Network Policy (Defining Constraint)

- The application must hold **no outbound socket except `127.0.0.1:11434`** (`tasks/plan.md:31`).
- This is verified by construction via `scripts/privacy-evidence.ps1` + a firewall block rule, and demonstrated in the recorded demo (`tasks/plan.md:32-35`, `tasks/todo.md:45`).
- Any future integration that adds a non-loopback connection breaks a scored judging criterion (privacy, rubric #4) and must be treated as a design change, not an implementation detail.

---

*Integration audit: 2026-10-18*
