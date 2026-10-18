# Testing Patterns

**Analysis Date:** 2026-10-18

> **Repo state:** no test files, no test config, and no `package.json` exist yet. The
> testing approach below is the one committed to in `tasks/plan.md` (Task 13, rubric C7)
> plus the checkpoint verification procedure in `tasks/todo.md`. Anything beyond that is
> marked **Not detected**.

## Test Framework

**Runner:**
- `node:test` — the built-in Node 24 test runner. Stated in `tasks/plan.md` Task 13 and
  `tasks/todo.md` line 36: "`node:test` — verifier rejects fabricated quote, tiers, page
  mapping".
- Config file: **None.** `node:test` needs no config; the plan calls for pinned deps and
  no build step, so do not add Jest/Vitest/Mocha.

**Assertion Library:**
- `node:assert/strict` (standard companion to `node:test`). In-repo working example:
  `.opencode/skills/design-taste/scripts/preflight.test.mjs` line 11:
  `import assert from "node:assert/strict";`

**Run Commands:**
```bash
node --test                # discover and run all *.test.js / *.test.mjs (Node 24 default glob)
node --test lib/           # run tests in one directory (pattern used in-repo: `node --test scripts/`)
node --test lib/verify.test.js   # single file
```
No `package.json` exists yet — when Task 0 creates it, wire these as scripts (e.g.
`"test": "node --test"`). No coverage command established (**Not detected**; `node --test
--experimental-test-coverage` exists in Node 24 but nothing in the plan requires it).

## Test File Location & Naming

**Location:**
- Not detected — zero test files exist. Plan assigns tests to P2 and targets `lib/`
  modules; no directory is named.

**Naming:**
- Follow the in-repo convention already present in this workspace:
  `<module>.test.js` next to the module (e.g. `lib/verify.test.js`,
  `lib/chunk.test.js`) — mirrored by `.opencode/skills/design-taste/scripts/preflight.test.mjs`
  and `preflight.gaps.test.mjs` which sit beside `preflight.mjs`.

**Structure:**
```
lib/            # implementation + colocated *.test.js (proposed; not yet created)
fixtures/       # adversarial + prompt-injection input documents (Task 11)
evidence/       # written test *results*: robustness.md, benchmarks.md, privacy-report.md
```

## What Must Be Tested (established — Task 13, rubric C7, 10 pts)

The plan names exactly three required tests; treat them as the minimum gate:

1. **Verifier rejects a fabricated quote** — a `quote` not present verbatim in the stored
   chunk text must be dropped and reported unverifiable (`lib/verify.js`).
2. **Tier normalisation** — model output is normalised into
   `stated` | `interpretation` | `not_in_document`, with `escalate` boolean preserved.
3. **Chunker page mapping** — chunks carry the correct `page` from `[{page, text}]`
   produced by `lib/parse.js` (`lib/chunk.js`).

Suite shape once written:

```js
// lib/verify.test.js (proposed shape — matches node:test + node:assert/strict style
// used in .opencode/skills/design-taste/scripts/preflight.test.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { verify } from "./verify.js";

test("drops a quote that is not verbatim in the chunk", () => {
  const out = verify({ quote: "invented wording", ... }, chunk);
  assert.equal(out.verifiable, false);
  assert.equal(out.tier, "not_in_document");
});
```

## Test Structure

**Suite Organization:**
```js
import { test } from "node:test";        // flat `test(...)` calls, no describe nesting
import assert from "node:assert/strict"; // strict equality assertions
```
In-repo reference for the full idiom (temp-dir fixtures, child-process runner helper,
`sectionSlice`-style pure helpers): `.opencode/skills/design-taste/scripts/preflight.test.mjs`.

**Patterns:**
- Setup: build inputs inline or in a temp dir (`mkdtempSync` + `writeFileSync`, cleaned
  with `rmSync`) — see `preflight.test.mjs:29-34` `withTempFile(content, ext)`.
- Teardown: remove temp dirs; no global setup exists.
- Assertion: `assert.equal` / `assert.deepEqual` from `node:assert/strict`; throw-on-
  failure is the failure signal — no matchers.

## Mocking

**Framework:** None. Not detected, and none planned.

**Patterns:**
- The LLM (`Ollama` at `127.0.0.1:11434`) is a **local HTTP service, not a library** —
  the plan's unit-test targets (`verify`, tier normalisation, chunker) are pure functions
  over data and should be tested **without** any network call.
- No mocking library may be added: Task 13's scope is verifier/tier/chunk logic, and the
  only permitted outbound socket in the whole app is `127.0.0.1:11434`. Tests must not
  reach the network at all.
- Where a process needs invoking, use Node's own `execFileSync` helper pattern from
  `preflight.test.mjs:20-27` (returns `{stdout, status}` instead of throwing).

**What NOT to Mock:** the verifier's normalisation path — feed it real normalised strings
(whitespace/dash/ligature variants) so the quote gate is proven against real text.

## Fixtures and Factories

**Test Data (established):**
- `fixtures/` — adversarial and prompt-injection documents, produced by Task 11 together
  with a runner that records results into `evidence/robustness.md` (rubric #6, 12 pts).
- Sample documents gathered by P2 during Phase 1 (`tasks/todo.md` line 14): at least one
  rental agreement, one employment contract, one malformed/adversarial file — licences
  noted (gate G4). These are the inputs for CLI/manual verification, not unit fixtures.
- Malformed / near-miss quote strings (PDF hyphenation, ligatures, dash variants) are the
  natural unit fixtures for `lib/verify.js` (see plan Risks table).

**Location:** `fixtures/` at repo root (committed); scratch/temp files go through temp
dirs and are excluded by `.gitignore` (Task 0: "no evidence temp files").

## Coverage

**Requirements:** None enforced. **Not detected** — no coverage tool, threshold, or CI.

**View Coverage (optional, Node 24 built-in):**
```bash
node --test --experimental-test-coverage
```

## Test Types

**Unit Tests:**
- `node:test` + `node:assert/strict` over pure `lib/` functions (verify gate, tier
  normalisation, chunk page mapping). No DB, no network, no framework.

**Integration / End-to-End (established as manual checkpoints in `tasks/todo.md`):**
- **Checkpoint 1 (13:30):** `node cli.js ask sample.pdf "…"` returns plain-language
  answer + verbatim quote + page; only localhost connections observed.
- **Checkpoint 2 (15:00):** browser end-to-end demo; privacy evidence captured on a full
  run; refusal and "document is silent" demonstrated.
- **Checkpoint 4 (20:00):** fresh-clone run-through by someone who did not build it.

**Evidence-as-test (scored, replaces automated E2E for now):**
- `scripts/privacy-evidence.ps1` records every non-loopback TCP connection of
  `node.exe`/`ollama.exe` during a full run under a firewall block rule and writes
  `evidence/privacy-report.md` — this is the privacy gate (crit 4, 15 pts; gate L2).
- Task 11 runner → `evidence/robustness.md` (adversarial/prompt-injection results).
- Task 12 benchmark → `evidence/benchmarks.md` (tokens/s, RSS, per-question latency).

**E2E Framework:** None (manual browser demo per `tasks/plan.md` Task 8).

## Common Patterns

**Async Testing:**
- `node:test` supports async test functions natively (`test("…", async () => { … })`).
  Not yet exercised in project code (**Not detected**).

**Error Testing:**
- Use `assert.throws` / `assert.rejects` from `node:assert/strict` when a throw contract
  exists. Note the domain contract: verified-vs-dropped claims are expressed as **data
  tiers**, not thrown errors — only genuine I/O/parse failures should throw.

---

*Testing analysis: 2026-10-18*
