# UAT: Phase 01 — Contract + Vertical Slice

**Mode:** end-of-phase (batched live check)
**Status:** pending — run the demo below, then answer the question in session.
**Context:** verifier proved everything observable offline (21/21 tests, live CLI ask + quote gate re-verified, loopback-only sampler, synthesized 2-page PDF page-citation proof). What remains is the browser + offline run only you can do. The demo **is** the UAT.

## E1–E10 — the demo script (≈5 min)

1. **Start:** `ollama serve` (with `OLLAMA_NO_UPDATE_CHECKS=true`) if not running → `npm start` → open `http://127.0.0.1:3000`.
2. **Empty state:** no trash icon visible before any upload (UI-BLK-01 fix `1f369ee`), copy reads "No document yet".
3. **Upload:** drag in `fixtures/rental.txt` → header shows "rental.txt — N chunks", every chunk row shows a `p.` page chip.
4. **PDF path:** upload a real (short-paragraph) PDF → chunks render with correct page numbers. *(Known limit: paragraphs >2000 chars are truncated — CR-01, deferred; demo with the fixtures or typical clause-per-paragraph PDFs.)*
5. **Bad input:** drop a `.png` → error banner appears (message wording drifts from spec — accepted), no orphan files pile up in `./data/`.
6. **Remove:** remove document → confirmation, UI returns to empty state, trash icon hidden again.
7. **CLI Q&A:** `node cli.js ask fixtures/rental.txt "what is the notice period?"` → `ANSWER:` + verbatim `QUOTE:` + `PAGE: 1`, exit 0.
8. **Grounding honesty:** `node cli.js ask fixtures/rental.txt "what is the penalty for late rent?"` (or any question the fixture is silent on) → refusal/"not in document" path, never a fabricated quote.
9. **Offline backstop:** disable Wi-Fi → repeat step 7 → still answers (only socket is 127.0.0.1:11434).
10. **Console clean:** no errors in the browser devtools console across steps 3–6.

## Judgment-tier checks (quick verbal confirm)

- Temp hygiene: derived text/chunks live in `./data/` + `chunks.json` (gitignored) — nothing in system temp.
- Unverifiable claims are never displayed (quote gate drops them — proven by tests + verifier).
- No legal verdicts anywhere in output (escalation copy only).

## Known accepted limitations (do not fail UAT on these)

- CR-01 long-paragraph truncation · CR-02 no Host/Origin check · UI copy drift items #2/#3 — all dispositioned in `01-REVIEW-DISPOSITION.md`, scheduled Phase 2.
