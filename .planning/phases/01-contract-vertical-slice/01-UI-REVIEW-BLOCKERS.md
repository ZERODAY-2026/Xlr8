---
phase: "01"
slug: contract-vertical-slice
source: 01-UI-REVIEW.md
created: "2026-10-18"
blockers: 1
---

# Phase 01 — UI Review Blockers

BLOCKER-class findings extracted from `01-UI-REVIEW.md` (6-pillar visual audit, overall 17/24).
Fixes for these are mandatory before end-of-phase UAT.

## UI-BLK-01: Remove-document control visible in the empty state (E3 contract row broken in default view)

**File:** `public/styles.css:179` and `public/styles.css:206` (also `public/index.html:44`, `public/index.html:46`)
**Issue:** All three audit screenshots show a trash icon below the drop zone with no document loaded; clicking it does nothing (`app.js:165` early-returns on `current === null`). Root cause: author `display` rules override the UA `[hidden]` rule — `.doc-header { display: flex }` (`styles.css:179`) and `.icon-btn { display: inline-flex }` (`styles.css:206`) both beat the UA stylesheet's `[hidden] { display: none }`, so the `hidden` attributes in `index.html:44`/`index.html:46` never apply. The banner got the fix (`.banner[hidden] { display: none }`, `styles.css:173`) but nothing else did.
**Impact:** Judges' first screen shows a dead destructive control; spec-locked state `01-UI-SPEC.md:118` ("No document → control hidden entirely") is wrong before any interaction.
**Fix:** One global line in `styles.css` after the reset: `[hidden] { display: none !important; }` (fixes the class of bug in one place rather than per-selector). Add one `public.test.js` assertion that no author `display` rule is reachable on `.doc-header`/`.icon-btn` while `[hidden]` (string-pin style, matching the existing suite), since the existing string-pins cannot catch this class of bug.

**Source audit:** `01-UI-REVIEW.md` Pillar 6 (Experience Design 2/4) + Pillar 2 (Visuals, BLOCKER-visible composition break).
