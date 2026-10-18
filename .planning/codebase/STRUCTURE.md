# Codebase Structure

**Analysis Date:** 2026-10-18

**Status:** Pre-implementation repo. Only agent/tooling config (`.opencode/`) and planning docs (`tasks/`) exist. No application source, no `package.json`, no `lib/`, `public/`, or tests yet. The "Where to Add New Code" section below encodes the planned layout from `tasks/plan.md` — follow it when creating the first files.

## Directory Layout

```
Hackday/                          # project root (Windows, not yet a git repo)
├── .opencode/                    # OpenCode/GSD agent tooling (NOT application code)
│   ├── agents/                   # GSD subagent definitions (*.md + *.compact.md)
│   ├── commands/                 # GSD slash-command definitions (gsd-*.md)
│   ├── skills/                   # ~180 skill dirs (each with SKILL.md)
│   ├── gsd-core/                 # GSD framework: bin/, contexts/, references/, templates/, workflows/
│   ├── hooks/                    # JS/SH lifecycle hooks (guards, statusline, session state)
│   ├── plugins/                  # gsd-core.js plugin + gsd-statusline/
│   ├── scripts/                  # GSD maintenance scripts (*.cjs)
│   ├── gsd-migration-journal/    # GSD migration records
│   ├── .gsd-staging/             # staged user artifacts
│   ├── .gsd-profile/             # user profile data
│   ├── opencode.json             # OpenCode runtime config
│   ├── settings.json             # OpenCode settings
│   ├── gsd-file-manifest.json    # GSD installed-file manifest
│   └── gsd-install-state.json    # GSD install state
├── .planning/                    # GSD planning state (this analysis lives here)
│   └── codebase/                 # codebase map documents (ARCHITECTURE.md, STRUCTURE.md)
├── tasks/                        # hackathon project planning docs
│   ├── plan.md                   # full implementation plan (PS2 legal triage agent)
│   └── todo.md                   # checklist with checkpoints/deadlines
└── (planned, not yet created:)
    ├── lib/  public/  scripts/  fixtures/  evidence/  docs/
    ├── cli.js  server entry  package.json  README.md  LICENSE  .gitignore
```

## Directory Purposes

**`.opencode/`:**
- Purpose: OpenCode runtime + GSD (Get Shit Done) workflow tooling. Infrastructure for AI-assisted development, not part of the shipped app.
- Contains: agent definitions (`.opencode/agents/`), slash commands (`.opencode/commands/`), skills (`.opencode/skills/`, each dir has `SKILL.md`), the GSD framework (`.opencode/gsd-core/` with `bin/`, `contexts/`, `references/`, `templates/`, `workflows/`), lifecycle hooks (`.opencode/hooks/`, e.g. `gsd-write-guard.js`, `gsd-prompt-guard.js`), plugins (`.opencode/plugins/gsd-core.js`), and maintenance scripts (`.opencode/scripts/`).
- Key files: `.opencode/opencode.json`, `.opencode/settings.json`, `.opencode/gsd-file-manifest.json`, `.opencode/gsd-install-state.json`
- Note: treat everything under `.opencode/` as read-only tooling. Do not place application code here.

**`.planning/`:**
- Purpose: GSD planning state. This map (`.planning/codebase/`) is consumed by planning/execution commands.
- Contains: `codebase/` (analysis documents)

**`tasks/`:**
- Purpose: project plan for the hackathon deliverable.
- Key files: `tasks/plan.md` (architecture decisions, data flow, task list with owners P1/P2/P3, risks), `tasks/todo.md` (deadline-tracked checklist, checkpoints are hard stops)

## Key File Locations

**Entry Points:**
- Not detected (none exist yet). Planned: Express server entry at repo root, `cli.js` CLI entry.

**Planning / Contract:**
- `tasks/plan.md`: authoritative architecture decisions (Node 24 + Express, pdfjs-dist, Ollama `gemma3n:e2b` + `embeddinggemma`, no vector DB, citation verifier, three-tier evidence schema)
- `tasks/todo.md`: task/checkpoint checklist

**Configuration:**
- `.opencode/opencode.json`: OpenCode runtime config (tooling only)
- `package.json` (planned, Task 0): pinned dependencies — does not exist yet

**Core Logic:**
- Not detected. Planned under `lib/`: `lib/parse.js`, `lib/chunk.js`, `lib/embed.js`, `lib/ollama.js`, `lib/verify.js`

**Testing:**
- Not detected. Planned: `node:test` tests (Task 13) covering verifier fabricated-quote rejection, tier normalisation, chunker page mapping.

## Naming Conventions

**Files (established by the plan, not yet by code):**
- `lib/` modules: lowercase, single-purpose noun/verb — `parse.js`, `chunk.js`, `embed.js`, `ollama.js`, `verify.js`
- Scripts: kebab-case with extension type marked — `scripts/privacy-evidence.ps1`
- Evidence artifacts: kebab-case markdown in `evidence/` — `privacy-report.md`, `robustness.md`, `benchmarks.md`
- Docs: `docs/api.md`, `docs/submission.md`

**Directories:**
- All-lowercase, single-word: `lib/`, `public/`, `scripts/`, `fixtures/`, `evidence/`, `docs/`
- Tooling dirs are dot-prefixed: `.opencode/`, `.planning/`

**GSD tooling (for reference only):**
- Agents: `gsd-<role>.md` with `.compact.md` variants in `.opencode/agents/`
- Commands: `gsd-<verb>.md` in `.opencode/commands/`

## Where to Add New Code

This is a greenfield repo. The layout below is the agreed convention from `tasks/plan.md` — use it for all new application code.

**New Feature (core pipeline):**
- Implementation: `lib/` — one module per concern: `lib/parse.js` (pdfjs-dist → `[{page, text}]`), `lib/chunk.js`, `lib/embed.js`, `lib/ollama.js` (chat + JSON mode + fallback), `lib/verify.js` (quote gate + tier normalisation)
- Tests: `node:test` test files (Task 13; co-located or under a `test/` dir — pick one and stay consistent; verifier/chunker/page-mapping tests are required)

**API / Server:**
- Express app with routes `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` — server entry at repo root; route contract to be written to `docs/api.md` in Task 0 before implementation
- Static client assets: `public/`

**CLI:**
- `cli.js` at repo root — calls `lib/` directly, no HTTP

**Scripts / Evidence:**
- Ops and measurement scripts: `scripts/` (e.g. `scripts/privacy-evidence.ps1`)
- Judge-facing proof output: `evidence/` (`privacy-report.md`, `robustness.md`, `benchmarks.md`)
- Test inputs for adversarial/prompt-injection runs: `fixtures/`

**Utilities:**
- Shared helpers stay in `lib/` next to their consumer module; no separate utils dir planned

**Project Metadata (Task 0 creates these):**
- `package.json` (pinned deps), `LICENSE` (MIT), `.gitignore` (exclude `node_modules`, evidence temp files), `docs/api.md`, later `README.md` and `docs/submission.md`

**Do not put application code in:** `.opencode/` (tooling), `.planning/` (GSD state), `tasks/` (planning docs).

## Special Directories

**`.opencode/`:**
- Purpose: AI development tooling (agents, commands, skills, hooks, GSD framework)
- Generated: mostly installed/managed by GSD (`gsd-file-manifest.json` tracks it)
- Committed: yes (tooling config is checked in)

**`.planning/`:**
- Purpose: GSD planning + codebase-map state
- Generated: yes (by GSD commands)
- Committed: team-dependent; orchestrator handles git operations

**`evidence/` (planned):**
- Purpose: judge-facing proof artifacts (privacy, robustness, benchmarks)
- Generated: yes (by scripts/runs)
- Committed: yes for final reports; temp files excluded via `.gitignore`

---

*Structure analysis: 2026-10-18*
