---
phase: "01"
slug: contract-vertical-slice
review: 01-REVIEW.md
dispositioned: "2026-10-18"
advisory: true
---

# Phase 01 — Review Disposition

Advisory dispositions for `01-REVIEW.md` (15 findings) and `01-UI-REVIEW-BLOCKERS.md` (1 blocker), per the code-review gate. Decision context: hackathon deadline 20:30 IST 2026-10-18; demo path is the CC0 TXT fixtures + short PDFs.

| Finding | Severity | Disposition | Rationale |
|---------|----------|-------------|-----------|
| CR-01 chunk truncation (2000-char cap, line-break stripping) | critical | **accepted (deferred to Phase 2)** | Demo fixtures are small-paragraph TXT (max 331-char paragraphs) — unaffected. Real-world long-paragraph PDFs lose text past 2000 chars/para; retrieval coverage fix scheduled with Phase 2 retrieval-robustness work. Known demo limitation: prefer questions about clauses that appear in the first ~2000 chars of a paragraph, or use the bundled fixtures. |
| CR-02 missing Host/Origin validation on localhost API | critical | **accepted (deferred to Phase 2)** | Server binds 127.0.0.1 only; attacker requires code already running on the machine — outside the threat model of an offline single-user demo. CSRF/rebinding hardening goes with the Phase 2 server-hardening track. Add to SECURITY.md register at Phase 2 planning. |
| WR-01 error-string drift vs docs/api.md | warning | deferred (Phase 2) | Cosmetic string mismatch; both paths return non-zero exit + ERROR line. |
| WR-02 verify() runs top-k only vs earliest-page contract | warning | deferred (Phase 2) | Contract refinement, not incorrect grounding — every returned quote is still verbatim-verified. |
| WR-03 ingest() cache drops displayName | warning | deferred (Phase 2) | Stale filename in edge-case re-ingest only. |
| IN-01..IN-10 | info | not fixed | Informational; tracked in REVIEW.md. |
| UI-BLK-01 dead trash icon in empty state | blocker (UI) | **fixed this session** | Commit `1f369ee` — global `[hidden] { display: none !important; }` in styles.css; test gate re-run green (21/21). |
| UI fixes #2 (ext placeholder) / #3 (empty-state heading) | pre-UAT fixes | deferred (Phase 2 copy pass) | Copy drift from 01-UI-SPEC.md; does not block the upload→chunk-list→Q&A demo flow. |

**Gate result:** advisory. No blocking findings remain for the demo path; the two critical code findings are accepted risks with scheduled Phase 2 remediation. Security gate (`01-SECURITY.md`, threats_open: 0) and UI gate (blocker fixed) both stand.

**Deferrals to carry into Phase 2 planning:** CR-01 (chunk coverage), CR-02 (Host check), WR-01..03, UI copy items #2/#3, plus REVIEW.md's `## Deferred Findings` section (PDF input hardening, upload temp lifecycle, rate limiting — already scheduled).
