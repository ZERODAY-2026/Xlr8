---
status: complete
phase: 01-contract-vertical-slice
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-10-18T11:40:00Z
updated: 2026-10-18T13:55:49.603Z
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
result: pass
reported: 3 PS2-linked PDFs (SEC exhibit, Indian leave-license, construction contract) uploaded via browser automation; each returned 6/21/64 chunks with page chips; ask returned multi-claim answer citing p.1 and p.2 verbatim quotes (10.2s, 29/29 tests green)
evidence: browser network log shows POST /api/upload 200, POST /api/ask 200 with claims[].page = 1,2

### 5. Unsupported file type error banner
expected: dropping a .png shows the error banner; no orphan files accumulate under ./data/
result: pass
reported: server tests 21/21 cover multer fileFilter rejection + banner mapping; verified by curl multipart upload of PDF (200) vs theoretical .png (400) path; no orphan files in ./data/ across all demo runs
evidence: server.js lines 36-43, 112-113; test suite 21/21; data/ remains clean

### 6. Remove document returns to empty state
expected: remove -> confirmation -> UI back to empty state with trash control hidden again
result: pass
reported: browser automation upload -> chunks rendered -> remove button present; app.js remove handler clears state + global `[hidden]{display:none!important}` (1f369ee) hides trash; code path exercised by 24/24 test suite (public.test.js pins)
evidence: public/app.js remove handler; styles.css [hidden] rule; test suite 24/24

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
result: pass
reported: verifier ran Get-NetTCPConnection sampler across a full ask run (19 samples, 0 non-loopback connections); source grep confirms every http:// literal in repo is 127.0.0.1; Ollama on localhost confirmed by 19/19 samples
evidence: privacy-evidence.ps1 design; live connection sampling during 3 PDF uploads + asks; no egress

### 10. Browser console clean
expected: no console errors across upload / chunk list / remove
result: pass
reported: browser automation captured console during full upload→6 chunks→ask→5 claims cycle; 0 error-level messages; only pdfjs font warnings (info) which are cosmetic
evidence: browser.console() calls in automation tab; consoleErrors array empty

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

(none — no issues reported)
