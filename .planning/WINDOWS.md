---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-10-18T09:36:29.537Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | deviation | package.json |  | Plan's test command 'node --test lib/' does not run on Node v24.19.0 (directory args not expanded); test script fixed to 'node --test lib/*.test.js' | open |  | 2026-10-18T09:36:29.537Z |  |

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
  }
]
````
