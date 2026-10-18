---
schema_version: 1
open_count: 8
waived_count: 0
fixed_count: 0
total_count: 8
last_updated: 2026-10-18T10:33:15.774Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | deviation | package.json |  | Plan's test command 'node --test lib/' does not run on Node v24.19.0 (directory args not expanded); test script fixed to 'node --test lib/*.test.js' | open |  | 2026-10-18T09:36:29.537Z |  |
| 2 | 01 | deviation | .planning/phases/01-contract-vertical-slice/01-02-SUMMARY.md |  | Task 2 sampler command could not run verbatim through the toolchain; rewritten as a temp script with identical logic, evidence recorded in the SUMMARY instead of a repo file | open |  | 2026-10-18T09:59:41.752Z |  |
| 3 | 01 | unrun-verify | .planning/phases/01-contract-vertical-slice/01-02-PLAN.md |  | Offline backstop (Wi-Fi disconnect rerun, must_have #9) not run at execution; deferred to the end-of-phase human-check per the plan | open |  | 2026-10-18T09:59:42.296Z |  |
| 4 | 01 | deviation | lib/pipeline.js |  | 01-03: ingest() gained optional displayName so chunks.json stores the uploader original filename per docs/api.md (was UUID storage-path basename) | open |  | 2026-10-18T10:33:13.529Z |  |
| 5 | 01 | deviation | server.js |  | 01-03: malformed JSON on /api/ask maps to 400 invalid JSON body instead of the 500 model-failure copy | open |  | 2026-10-18T10:33:14.131Z |  |
| 6 | 01 | deviation |  |  | 01-03: plan Task-2 verify command false-fails under PowerShell 5.1 (-notmatch on line array) - rerun with joined string; no repo change | open |  | 2026-10-18T10:33:14.716Z |  |
| 7 | 01 | deviation | .planning/phases/01-contract-vertical-slice/01-03-tdd-red-evidence.json |  | 01-03: first RED capture used the spec reporter (classifier rejected) - reran with --test-reporter=tap, RED_EVIDENCE_OK | open |  | 2026-10-18T10:33:15.243Z |  |
| 8 | 01 | unrun-verify |  |  | 01-03 D5: interactive E1-E10 browser states + offline full-flow backstop assigned to the end-of-phase human-check batch per D-05 | open |  | 2026-10-18T10:33:15.774Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "01",
    "file": "package.json",
    "line": null,
    "description": "Plan's test command 'node --test lib/' does not run on Node v24.19.0 (directory args not expanded); test script fixed to 'node --test lib/*.test.js'",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T09:36:29.537Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "01",
    "file": ".planning/phases/01-contract-vertical-slice/01-02-SUMMARY.md",
    "line": null,
    "description": "Task 2 sampler command could not run verbatim through the toolchain; rewritten as a temp script with identical logic, evidence recorded in the SUMMARY instead of a repo file",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T09:59:41.752Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "01",
    "file": ".planning/phases/01-contract-vertical-slice/01-02-PLAN.md",
    "line": null,
    "description": "Offline backstop (Wi-Fi disconnect rerun, must_have #9) not run at execution; deferred to the end-of-phase human-check per the plan",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T09:59:42.296Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "01",
    "file": "lib/pipeline.js",
    "line": null,
    "description": "01-03: ingest() gained optional displayName so chunks.json stores the uploader original filename per docs/api.md (was UUID storage-path basename)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T10:33:13.529Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "01",
    "file": "server.js",
    "line": null,
    "description": "01-03: malformed JSON on /api/ask maps to 400 invalid JSON body instead of the 500 model-failure copy",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T10:33:14.131Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "01",
    "file": "",
    "line": null,
    "description": "01-03: plan Task-2 verify command false-fails under PowerShell 5.1 (-notmatch on line array) - rerun with joined string; no repo change",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T10:33:14.716Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 7,
    "kind": "deviation",
    "phase": "01",
    "file": ".planning/phases/01-contract-vertical-slice/01-03-tdd-red-evidence.json",
    "line": null,
    "description": "01-03: first RED capture used the spec reporter (classifier rejected) - reran with --test-reporter=tap, RED_EVIDENCE_OK",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T10:33:15.243Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 8,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "",
    "line": null,
    "description": "01-03 D5: interactive E1-E10 browser states + offline full-flow backstop assigned to the end-of-phase human-check batch per D-05",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T10:33:15.774Z",
    "resolved_at": null,
    "milestone": null
  }
]
````
