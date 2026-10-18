---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-10-18T09:59:42.296Z
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
  }
]
````
