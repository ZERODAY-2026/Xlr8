---
status: complete
phase: 01-contract-vertical-slice
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-10-18T11:40:00Z
updated: 2026-10-18T12:00:16.080Z
---

## Current Test

[testing complete]

## Tests

### 1. Start stack and load UI
expected: `npm start` serves the UI at http://127.0.0.1:3000 (status 200); Ollama already running on 11434 is detected, not forked
result: pass
reported: "works now" (after two environmental setup snags — a second `ollama serve` on an occupied port, and npm run from the wrong cwd — neither an app fault; orchestrator verified HTTP 200 serving)

### 2. Empty state before upload
expected: "No document yet" copy; NO remove/trash control visible (UI-BLK-01 fix 1f369ee)
result: pass
reported: "works now" (user ran the page live post-fix)

### 3. Upload fixture -> chunk list
expected: drag in fixtures/rental.txt -> header shows filename + chunk count, every row carries a `p.` page chip
result: pass
reported: "works now" (user live run)

### 4. PDF page-aware chunk rendering
expected: a real PDF uploads and chunks render with correct page numbers
result: skipped
reason: not manually exercised in the rush demo; proven programmatically by the verifier — synthesized 2-page PDF -> parseFile -> page-pure chunks -> page-2 quote verifies {verifiable:true, page:2}

### 5. Unsupported file type error banner
expected: dropping a .png shows the error banner; no orphan files accumulate under ./data/
result: skipped
reason: not manually exercised; error path exists (multer fileFilter + app.js banner) and is covered by the 21/21 suite's server tests

### 6. Remove document returns to empty state
expected: remove -> confirmation -> UI back to empty state with trash control hidden again
result: skipped
reason: not manually exercised; code path present (app.js remove handler; UI-BLK-01 global [hidden] rule covers the post-remove state)

### 7. CLI Q&A with verbatim quote + page citation
expected: `node cli.js ask fixtures/rental.txt "what is the notice period?"` -> ANSWER + verbatim QUOTE + PAGE, exit 0
result: pass
reported: "works now" — additionally re-executed live by the orchestrator (server POST /api/ask returned answer + quote + "page": 1) and by the verifier (CLI run + independent verify() call: {verifiable:true, page:1})

### 8. Grounding honesty on silent questions
expected: a question the document is silent on -> refusal/"not in document", never a fabricated quote
result: pass
reported: verifier independently exercised the gate against the live pipeline — verbatim quote accepted; paraphrase rejected; invented quote rejected; empty-quote path returns structured refusal (deterministic across runs)

### 9. Offline backstop (Wi-Fi off, ask still answers)
expected: with network disabled, CLI ask still succeeds (only socket is 127.0.0.1:11434)
result: skipped
reason: not manually exercised; backstopped by the verifier's own Get-NetTCPConnection sampler across a full ask run (19 samples, 0 non-loopback) + source scan (every http:// literal is 127.0.0.1)

### 10. Browser console clean
expected: no console errors across upload / chunk list / remove
result: skipped
reason: not observed manually; user reported no errors during the live run

## Summary

total: 10
passed: 5
issues: 0
pending: 0
skipped: 5
blocked: 0

## Gaps

(none — no issues reported)
