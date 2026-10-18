# Codebase Concerns

**Analysis Date:** 2026-10-18

> Context: this repo is pre-implementation — no application code exists yet. The only
> tracked content is agent/tooling config (`.opencode/`), GSD planning state
> (`.planning/`), and the hackathon plan (`tasks/plan.md`, `tasks/todo.md`). Concerns
> below are present-state hygiene, supply-chain, environment, and plan-level risks.
> No fabricated bugs.

## Tech Debt

**No version control initialized:**
- Issue: no `.git/` directory exists (`Test-Path .git` = false). The entire plan
  (`tasks/plan.md` Task 0) schedules `git init` but it has not happened. There is no
  rollback, no diffing, no fresh-clone run-through (Checkpoint 4 depends on cloning),
  and G3/G5 submission gates cannot be evidenced without commit history.
- Files: `tasks/plan.md` (Task 0, line ~62), `tasks/todo.md` (Phase 0)
- Impact: any file loss or accidental overwrite is unrecoverable; hackathon submission
  gates requiring history/attribution fail.
- Fix approach: run `git init` + MIT `LICENSE` + `.gitignore` (excluding `node_modules`,
  `.planning/` churn if desired, and `evidence/` temp files) as the very first action,
  commit the plan docs as the baseline commit.

**No `.gitignore`, no `LICENSE`, no `README.md`:**
- Issue: all three absent at repo root (verified). When `git init` happens without a
  `.gitignore`, the ~16 MB `.opencode/` tree and any future `node_modules/` get
  committed on the first `git add .`.
- Files: repo root
- Impact: bloated repo, possible accidental commit of runtime junk, missing MIT
  licence required by the hackathon (plan Task 0 / G-gates).
- Fix approach: create `.gitignore`, `LICENSE` (MIT), and a README stub before the
  first commit.

**No dependency manifest / no pinned dependencies:**
- Issue: no `package.json` exists anywhere in the project tree. All planned deps
  (`express`, `pdfjs-dist`) will be added during a 1-day event; the plan explicitly
  calls for pinned `package.json` (Task 0, Task 15) but nothing is pinned yet.
- Files: `tasks/plan.md` (Architecture Decisions, Task 0, Task 15)
- Impact: unreproducible builds; "fresh clone run-through" (Checkpoint 4) fails if
  versions drift; no lockfile means judge installs can break.
- Fix approach: `npm init` with exact versions (no `^`) + commit `package-lock.json`
  at Task 0, re-verify pins at Task 15.

**Third-party skill bundle committed without provenance review:**
- Issue: `.opencode/skills/` contains 150 skill directories (343 files, ~3.7 MB)
  copied in bulk from a third-party zip, and `.opencode/gsd-core/` contains ~655 files
  (~12.2 MB) of the GSD framework. No recorded source URL, version, or review. The
  bundle also ships executable code: `.opencode/hooks/` (e.g.
  `gsd-read-injection-scanner.js`, `gsd-write-guard.js`, `managed-hooks-registry.cjs`),
  `.opencode/plugins/` (`gsd-core.js`), and `.opencode/scripts/`.
- Files: `.opencode/skills/`, `.opencode/gsd-core/`, `.opencode/hooks/`,
  `.opencode/plugins/`, `.opencode/scripts/`
- Impact: unaudited third-party code runs in the dev environment; if the project repo
  is published for the hackathon, ~16 MB of tooling noise ships with it and judges see
  an unclear provenance story.
- Fix approach: record origin + version of the zip/GSD install in a short
  `.opencode/PROVENANCE.md`; before publishing, exclude `.opencode/` from the public
  repo (via `.gitignore` or subtree) unless judges need it.

**GSD framework files tracked inside the app repo:**
- Issue: `.opencode/gsd-file-manifest.json` (106 KB) and a 134 KB migration journal
  (`.opencode/gsd-migration-journal/2026-10-18T05-04-57-759Z-06639e660abb8e61.json`)
  are session-generated state living in the working tree.
- Files: `.opencode/gsd-file-manifest.json`, `.opencode/gsd-install-state.json`,
  `.opencode/gsd-migration-journal/`
- Impact: churny generated files pollute commits and diffs.
- Fix approach: ignore generated GSD state in `.gitignore`; commit only the config
  (`opencode.json`) and curated skills if needed.

## Known Bugs

None — no application code exists yet.

## Security Considerations

**Unpinned, auto-installing MCP server:**
- Risk: `.opencode/opencode.json` launches the GSD MCP server as
  `npx -y -p @opengsd/gsd-core gsd-mcp-server --no-prompts` — `npx -y` fetches and
  executes whatever version is latest on npm at each cold start. No version pin, no
  integrity check, and a network call to the npm registry happens every session start.
- Files: `.opencode/opencode.json` (lines 10–23)
- Current mitigation: none; `settings.json` is empty (`{}`).
- Recommendations: pin the package version in the npx invocation
  (`-p @opengsd/gsd-core@<exact-version>`), or vendor the already-present
  `.opencode/gsd-core/` copy and run it locally. Note this also matters for the
  project's own privacy story — the plan (`tasks/plan.md` lines 36–38) claims the only
  network calls are Ollama update checks; the tooling itself makes npm-registry calls
  at session start, which should be documented in the privacy evidence.

**Broad read permissions granted to tooling:**
- Risk: `.opencode/opencode.json` grants `read` and `external_directory` allow rules
  for the gsd-core tree; hooks like `gsd-read-guard.js` / `gsd-secret-read-guard.js`
  exist but hook registration state was not verified in this audit.
- Files: `.opencode/opencode.json` (lines 2–9), `.opencode/hooks/`
- Recommendations: keep permissions minimal; confirm which hooks are actually
  registered before relying on them as guards.

**Sensitive legal documents handled by a planned local-only app:**
- Risk: the app will ingest personal legal documents (rental agreements, employment
  contracts). Data-at-rest is a plain `chunks.json` on disk with no encryption
  (encryption explicitly de-scoped in `tasks/plan.md` line 125).
- Files: `tasks/plan.md` (Architecture Decisions, bonus table line 125)
- Current mitigation: privacy by construction — only outbound socket is
  `127.0.0.1:11434`, plus a planned connection-monitor evidence script
  (`scripts/privacy-evidence.ps1`, Task 9).
- Recommendations: state "unencrypted local cache" as a known limitation in README
  (Task 16), and ensure `chunks.json` / uploaded docs land in gitignored paths.

**Working directory inside OneDrive:**
- Risk: the repo lives at `C:\Users\gagan\OneDrive\Documents\Hackday` — OneDrive
  sync can lock files during builds, delay `node_modules` I/O, create conflict-copies
  during fast hackathon edits, and sync local-only artifacts (uploaded legal
  documents, model caches) to cloud storage — which undercuts the "never leaves the
  machine" privacy claim.
- Recommendations: add `node_modules/`, `chunks.json`, uploaded docs, and any Ollama
  cache paths to `.gitignore` AND set OneDrive to "always keep on this device / don't
  sync" for the project folder, or move the project outside OneDrive if possible.

## Performance Bottlenecks

None measurable yet (no code). Plan-level performance risks recorded in
`tasks/plan.md` (lines 131–132):

- **RAM headroom:** `gemma3n:e2b` is ~7.8 GB on a 15 GB box; CPU inference may be too
  slow for a live demo. Mitigations already in plan: top-k 6 retrieval, pre-warm,
  `gemma3:4b` fallback, recorded demo as backup. Verify RSS at Checkpoint 1.
- **Ollama version constraint:** `gemma3n:e2b` may require a newer Ollama than
  installed; the update must happen at setup time (network call to be documented).
- **Python 3.7.9 on host:** unusable for modern libs — this is why the plan commits to
  Node 24 + plain JS. Do not attempt Python-based tooling on this box.

## Fragile Areas

**`tasks/plan.md` + `tasks/todo.md` (the only project artifacts):**
- Why fragile: single source of truth for API contract, schema, and schedule; not yet
  under version control (see Tech Debt). Loss = loss of the whole design.
- Safe modification: commit first; keep `docs/api.md` (Task 0) as the canonical
  contract once written, and treat plan.md as history.
- Test coverage: N/A (docs only).

**Planned quote verifier (`lib/verify.js`, not yet written):**
- Why fragile: it is the rubric-critical hard gate (15 pts, fabrication defence) but
  is scheduled only for Task 4 and its tests only for Task 13 (Phase 3, de-scopable).
  Known risk from plan: PDF hyphenation/ligatures can break exact-quote matching.
- Safe modification: land the verifier + its `node:test` (fabricated quote rejected)
  in Phase 1/2, not Phase 3 — do not let it be cut if time runs out.

## Scaling Limits

- **Single-document, in-memory design by intent:** one document at a time, chunks +
  embeddings in one JSON file, cosine similarity in ~20 lines of JS (`tasks/plan.md`
  lines 18–19). Will not scale past a few documents — acceptable for the hackathon;
  flagged so future phases don't mistake it for a bug.
- **Model size vs. hardware:** 15 GB RAM caps usable models at ~7.8 GB; larger models
  or concurrent questions will fail. Fallback `gemma3:4b` is the safety valve.

## Dependencies at Risk

- **`@opengsd/gsd-core` via unpinned `npx`:** see Security above — supply-chain risk
  and cold-start network dependency.
- **`pdfjs-dist` (planned):** version-sensitive ESM/CJS behavior in Node 24; pin exact
  version on install.
- **`gemma3n:e2b` / `embeddinggemma` via Ollama:** require specific minimum Ollama
  versions; fallback model `gemma3:4b` is already local.

## Missing Critical Features

None flagged — this is a greenfield pre-implementation repo; the feature set lives in
`tasks/plan.md` and is not yet expected to exist.

## Test Coverage Gaps

- **No test framework or test files exist** (no `*.test.*`/`*.spec.*`, no runner
  config, no `package.json`). The plan defers tests to Task 13 (Phase 3, after the
  17:30 hard stop zone begins). Risk: the verifier, tier normalisation, and chunker
  page-mapping go untested if time runs short.
- Priority: High for `lib/verify.js` (fabricated-quote rejection test) — it backs the
  fabrication gate; Medium for chunker page mapping; Low for the rest.

---

*Concerns audit: 2026-10-18*
