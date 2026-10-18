# Technology Stack

**Analysis Date:** 2026-10-18

> **Status: pre-implementation.** This repository contains **no application code**. There is
> no root `package.json`, no source files, no lockfile, and no build config. The only
> technology present is agent tooling under `.opencode/`. The application stack below is
> **planned, not installed** — it is recorded in `tasks/plan.md` and `tasks/todo.md` and
> will materialize when Phase 0/1 tasks are executed.

## Languages

**Primary (existing):**
- JSON / Markdown - Agent configuration and planning docs only (`.opencode/`, `tasks/`)

**Planned (per `tasks/plan.md:14-15`, not yet written):**
- JavaScript (plain, **no TypeScript**) - Application code, Node 24, Express
- PowerShell - `scripts/privacy-evidence.ps1` privacy audit script (planned, `tasks/plan.md:84`)

Rationale recorded in the plan: Python on the host is 3.7.9 (unusable for modern libs), so Node 24 + plain JS was chosen.

## Runtime

**Environment (planned):**
- Node.js 24 - stated as installed on the host (`tasks/plan.md:15`)
- Ollama - local LLM server on `127.0.0.1:11434`, run via `ollama serve` with `OLLAMA_NO_UPDATE_CHECKS=true` (`tasks/plan.md:36-38`)

**Package Manager:**
- npm (implied by planned `package.json` with pinned deps, `tasks/plan.md:63`)
- Lockfile: missing (no `package-lock.json` yet)

## Frameworks

**Core (planned):**
- Express - HTTP API server; routes planned: `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` (`tasks/plan.md:61-62`)
- Ollama `/api/chat` - LLM inference, model `gemma3n:e2b` with `format: "json"`, fallback `gemma3:4b` (`tasks/plan.md:20-21`)
- Ollama `/api/embed` - embeddings via `embeddinggemma` (`tasks/plan.md:22-23`)

**Testing (planned):**
- `node:test` - built-in Node test runner for verifier, tier normalisation, chunker page mapping (`tasks/plan.md:97-98`)

**Build/Dev:**
- Not detected - no bundler, transpiler, or build step planned (plain JS served/run directly by Node)

## Key Dependencies

**Critical (planned, none installed):**
- `pdfjs-dist` - PDF parsing with **per-page** text extraction, required for "page N" citations (`tasks/plan.md:16-17`)

**Deliberately absent (per plan):**
- No vector database - chunks + embeddings stored in a single JSON file (`chunks.json`); cosine similarity implemented in ~20 lines of JS (`tasks/plan.md:18-19`)
- No TypeScript, no ORM, no frontend framework stated in the plan (browser UI is plain, `tasks/plan.md:24-25` in todo Task 8)

**Infrastructure (existing, agent tooling only):**
- `@opengsd/gsd-core` - GSD MCP server, launched via `npx -y` in `.opencode/opencode.json:10-23` (not an app dependency)
- Bundled plugin runtime: `.opencode/plugins/gsd-core.js` + `.opencode/plugins/package.json`

## Configuration

**Environment:**
- No `.env` files present and none planned. The app is designed to run with **zero configuration** apart from a local Ollama instance.
- Planned runtime env var: `OLLAMA_NO_UPDATE_CHECKS=true` (disables Ollama's one outbound update check; `tasks/plan.md:36-38`)

**Build:**
- Not detected - no `tsconfig.json`, bundler config, or `package.json` exists yet.

**Agent config:**
- `.opencode/opencode.json` - permissions + GSD MCP server definition
- `.opencode/settings.json` - empty (`{}`)

## Platform Requirements

**Development (per plan, `tasks/plan.md`):**
- Windows host (PowerShell evidence script, `ollama.exe`/`node.exe` process names in `tasks/plan.md:32-33`)
- Node 24 + git installed
- Ollama with `gemma3n:e2b` (~7.8 GB) on a ~15 GB box; `gemma3:4b` as fallback (`tasks/plan.md:131`)
- CPU-only inference (no GPU assumed); retrieval keeps prompts to top-k 6 chunks for speed (`tasks/plan.md:132`)

**Production:**
- Not applicable - single-machine, offline, on-device demo app; no deployment target.

---

*Stack analysis: 2026-10-18*
