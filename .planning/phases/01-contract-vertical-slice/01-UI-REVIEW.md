# Phase 1 — UI Review

**Audited:** 2026-10-18
**Baseline:** 01-UI-SPEC.md (approved design contract — Upload shell + chunk list scope, D-04)
**Screenshots:** captured (3/3 — desktop 1440×900, tablet 768×1024, mobile 375×812, from http://localhost:3000; no dev server was running, the audit started `node server.js` itself and stopped it after capture) at `.planning/ui-reviews/01-20261018-161858/`
**Interaction captures:** off (workflow.ui_interaction_capture is false) — Experience Design findings are code-derived (app.js/styles.css state machine) unless explicitly cited from a screenshot

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | 8 of 9 contract rows verbatim, but the unsupported-type error row is reworded from the spec's `{ext}` template and the empty-state copy stays on screen after a document loads |
| 2. Visuals | 3/4 | Clear centered focal point, aria-labels present — but a stray trash icon floats below the drop zone in the default empty state at every viewport |
| 3. Color | 3/4 | Parchment/white/chrome distribution and destructive token correct; accent `#295499` used on **4** surfaces against exactly **3** reserved (drag-over outline undeclared) |
| 4. Typography | 3/4 | Only declared sizes 13/16/20 and weights 400/600 in use, chunk text 16/400/1.5 wrap-not-clamp — but the declared Display 28px "page title" role renders nowhere (no visible page title in markup) |
| 5. Spacing | 3/4 | 4px token scale declared and used almost everywhere; two off-scale `2px` values (`padding: 2px …` page chip, `margin-top: 2px` banner icon) violate "multiples of 4 only" |
| 6. Experience Design | 2/4 | **BLOCKER:** E3 empty row ("control hidden entirely") fails in first paint — `[hidden]` is defeated by `display:flex`/`inline-flex`, so the remove-document button renders (and is dead) with zero documents |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **BLOCKER — Remove-document control visible in the empty state (E3 explicit contract row broken in default view).** All three screenshots show a trash icon below the drop zone with no document loaded; clicking it does nothing (`app.js:165` early-returns on `current === null`). Root cause: author `display` rules override the UA `[hidden]` rule — `.doc-header { display: flex }` (`styles.css:179`) and `.icon-btn { display: inline-flex }` (`styles.css:206`) both beat the UA stylesheet's `[hidden] { display: none }`, so `index.html:44`/`index.html:46`'s `hidden` attributes never apply. The banner got the fix (`.banner[hidden] { display: none }`, `styles.css:173`) but nothing else did. — Impact: judges' first screen shows a dead destructive control and a spec-locked state is wrong before any interaction. — Fix: one global line in `styles.css` after the reset: `[hidden] { display: none !important; }` (fixes the class of bug in one place rather than per-selector), then re-capture the empty state. `public.test.js` string-pins can't catch this — add one assertion that `.doc-header`/`.icon-btn` declare no `display` rule reachable while `[hidden]`, or leave it to the end-of-phase human-check item.

2. **Unsupported-type error row does not resolve the `{ext}` placeholder the Copywriting Contract specifies.** Spec row: `"That file is a {ext} file. Try a PDF or plain-text (.txt) document."` — implemented as `"That file type is not supported. …"` (`server.js:19`, mirrored `app.js:29`). The size/pages row's combined `{size} / {pages}` template was likewise split into two strings. — Impact: when a judge drops a `.png`, the tool never says *which* type was rejected — the specific-feedback half of problem+next-action is gone, and `01-03-SUMMARY`'s "verbatim copy" claim is only true of the plan's reworded strings, not the approved spec's. — Fix: change `ERR_TYPE` in `server.js:19` to carry the extension (multer's `file.originalname` is already parsed there): `` `That file is a ${path.extname(original) || 'unknown'} file. Try a PDF or plain-text (.txt) document.` `` and mirror in `app.js` for the transport-failure fallback; keep the two size/pages rows split if the planner prefers, but record the template resolution as an accepted deviation against `01-UI-SPEC.md` so the contract stops drifting.

3. **Empty-state copy "No document yet" stays on screen above the loaded document header.** `render()` (`app.js:125-162`) never touches the drop zone, so post-upload the page reads "No document yet" **above** "rental.txt — 12 chunks" (DOM order: dropzone → doc-header, `index.html:22`→`44`). The spec's E1 populated backstop only says the drop zone "remains as the replacement affordance" — it never says what the heading becomes, and the current heading becomes factually false the moment upload succeeds. — Impact: the primary demo flow (upload → chunk list) shows a self-contradicting screen to judges. — Fix: when `current` is set, swap the `h1` to a replacement heading (e.g. "Replace document") and a one-line body ("Drop another PDF or TXT file here to replace it. Files never leave this machine."), restoring the verbatim empty copy on remove (`app.js:170-182`); get the new strings added to the Copywriting Contract so verbatim discipline holds.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Present verbatim (grep/inspection confirmed):**
- CTA "Upload agreement" — `index.html:33`, `aria-label` `index.html:27`
- Empty heading "No document yet" — `index.html:23`; body "…Files never leave this machine." — `index.html:24`
- Privacy reassurance line — `index.html:25` (exact match to spec row)
- Loading copy "Extracting pages → chunking → embedding locally. …" — `app.js:32`, injected `app.js:37`; "Processing…" relabel `app.js:81`
- Size error row — `server.js:18` / `app.js:28`; model-failure row — `server.js:21-22` / `app.js:30-31`
- Success header pattern `{filename} — {N} chunks` with singular/plural — `app.js:136`
- Destructive confirm copy + "Remove document" / "Keep document" buttons — `index.html:65-68`
- No-chunks message — `index.html:60`
- No generic labels anywhere: `Submit|Click Here|OK|Cancel|Save` grep hits are code identifiers only (`app.js:23,99,112,184`); the neutral dialog button is contract-verbatim "Keep document".

**WARNING — unsupported-type row reworded** (`server.js:19`, `app.js:29`): the `{ext}` placeholder of the spec row is never resolved; see Priority 2. The combined `{size} / {pages}` template row (`01-UI-SPEC.md:93`) was resolved as two separate rows — defensible, but it is a deviation from the contract's literal template and is recorded nowhere as such.

**WARNING — false copy post-upload:** "No document yet" persists while a document is loaded (Priority 3). The spec gap is upstream (E1 populated backstop is silent on copy), but the shipped screen contradicts itself in the main demo flow.

### Pillar 2: Visuals (3/4)

- Focal point correct: drop zone is centered, largest-contrast white card on parchment, accent CTA is the single loudest element (screenshots, all 3 viewports). Spec's "Operate mode" anchor pre-upload is met.
- Icon-only controls paired with `aria-label`s: `index.html:27` ("Upload agreement"), `index.html:46` ("Remove document") — checker D2 flag satisfied in markup.
- Hierarchy clear through size/weight/color: 20/600 heading → 16/400 body → 13/600 muted meta.
- **BLOCKER-visible:** the orphan trash icon (both `hidden` attributes defeated, see Pillar 6) sits alone below the card at every viewport — it reads as an unexplained floating control and breaks the composition of the pre-upload anchor.
- WARNING — no visible page title: `01-03-PLAN` Task 2 action 1 lists "page title" as the first markup item; `index.html` has only the `<title>` tag. The spec's Display 28px role ("page title") therefore never renders — the page opens with the empty-state `h1` instead (see Pillar 4).

### Pillar 3: Color (3/4)

- 60/30/10 holds in screenshots: `#FAF8F4` parchment dominates, `#FFFFFF` card + `#F1EDE5` chrome secondary, accent confined to the CTA.
- Token values match the spec table exactly: `--bg #FAF8F4`, `--card #FFFFFF`, `--hairline #E4DED2`, `--chrome #F1EDE5`, `--text #1C2430`, `--muted #5A6272`, `--destructive #B42318`, `--accent #295499` (`styles.css:12-19`).
- **WARNING — accent used 4× against exactly 3 reserved slots** (`grep var(--accent)`): `styles.css:89` CTA ✓ (slot 1), `styles.css:107` focus ring ✓ (slot 3), `styles.css:151` progress bar (spec slot 2 is "active nav/tab item" — no nav exists this phase; in-flight progress as "active state" is a reasonable stand-in but is not what the contract lists), `styles.css:63` drag-over outline ✗ (**no spec slot at all**). Spec: "Accent reserved for exactly… Never 'all interactive elements'." — Fix: the drag-over state should reuse the focus-ring treatment as-is only if the spec adds a slot; otherwise use a neutral outline (`--hairline`/`--muted`) and reserve accent.
- WARNING — `01-UI-SPEC.md:79` says page chips use chrome "not accent" — satisfied (`styles.css:238-248`) ✓.
- Minor: destructive `#B42318` declared for "failed-upload banners, Remove-document confirmation only", but `styles.css:215` also paints the remove icon red on hover — defensible as the remove control's affordance, yet a third undeclared use.
- Minor: undeclared rgba values — spinner border `rgba(255,255,255,0.4)` (`styles.css:114`, white-on-accent derivation, fine) and dialog backdrop `rgba(28,36,48,0.4)` (`styles.css:280`, a token derivation the spec never declared — spec is silent, so informational).

### Pillar 4: Typography (3/4)

- `font-size` declarations in `styles.css`: **only 13px, 16px, 20px** — all declared roles. No stray sizes.
- `font-weight` declarations: **only 400 and 600** — exactly the two-weight contract; no 500/700 anywhere.
- Line heights 1.5 (body), 1.4 (label), 1.2 (heading) match the role table.
- Verbatim chunk text: `.chunk-text` 16px/400/1.5 with `overflow-wrap: anywhere`, no `text-overflow`/clamp (`styles.css:251-257`) ✓ wrap-not-clamp contract. Header filename ellipsis (`styles.css:193-198`) is the spec-required E4 overflow behavior, correctly scoped to the filename only.
- WARNING — the Display role (28px/600, "page title") is declared in the spec's typography table but used nowhere: there is no page-title element in `index.html` (only `<title>`), and `01-03-PLAN` asked for "page title" markup. Either add the visible title (and the missing 28px role renders) or strike the Display row from the contract — as shipped, the spec and the markup disagree.
- Minor — the privacy reassurance line renders 13px/600 (`styles.css:65-72`): the Label role's declared usage list is "meta, badges, page chips, buttons"; a two-line trust statement in semibold label type is within the letter (meta) but the key trust message for a non-lawyer audience is the smallest, heaviest text on the screen.

### Pillar 5: Spacing (3/4)

- Token block declares exactly the spec's 4/8/16/24/32/48/64 scale (`styles.css:5-11`) and uses the vars throughout: card `24`, drop zone `64/24`, page `48/16`, banner/chunk-card/dialog `16`, gaps `4/8`, header `32/16`.
- 44×44 minimums on both icon-only controls (`styles.css:87` `min-height:44px` on CTA, `styles.css:204-205` `44×44` on `.icon-btn`) and `44px` on dialog buttons ✓ (declared exception).
- **WARNING — off-scale literals, "multiples of 4 only":** `styles.css:246` `padding: 2px var(--space-sm)` (page-chip vertical padding — spec assigns badge inner padding to `xs 4px`) and `styles.css:174` `margin-top: 2px` (banner icon). Fix: `4px` / `4px` (or drop the margin and let flex alignment carry it).
- Minor — off-token layout literals: `.chunk-list { max-height: calc(100vh - 240px) }` (`styles.css:220`) hardcodes 240 rather than a token-driven header offset (E5 says `calc(100vh - header)`); `.dialog { width: calc(100% - 64px) }` (`styles.css:272`) reuses the 64 value literally instead of `var(--space-3xl)`. Values are on-scale, so cosmetic only.
- No Tailwind/arbitrary-value classes (hand-written CSS by design); no negative margins; spacing rhythm in screenshots is consistent.

### Pillar 6: Experience Design (2/4)

State coverage audit (E1–E10, code-derived; interactive states not captured — capture key off; plan defers the E1–E10 interactive pass to the end-of-phase human-check per `01-03-PLAN`):

- **BLOCKER — E3 empty row fails in first paint (screenshots, all 3 viewports):** contract row `01-UI-SPEC.md:118` "No document → control hidden entirely". Both the `#doc-header` `hidden` (`index.html:44`) and the `#remove-btn` `hidden` (`index.html:46`) are neutralized: `.doc-header { display:flex }` (`styles.css:179`) and `.icon-btn { display:inline-flex }` (`styles.css:206`) override the UA `[hidden]` rule. Result: a visible, dead trash button in the default state — the exact state judges see first. (`.banner` was patched with `.banner[hidden] { display:none }` at `styles.css:173`; the same guard was not applied elsewhere.) Fix as Priority 1.
- Loading (E1/E2/E8): `cta.disabled` + "Processing…" + spinner + verbatim loading copy for the whole in-flight period (`app.js:80-85`); progress bar only on replacement (`app.js:85`, `if (current)`); remove disabled during flight (`app.js:84`) ✓.
- Error (E5/E7): banner `role="alert"` above drop zone (`index.html:12`), server's verbatim `body.error` shown (`app.js:102`), previous header/list untouched by construction (`render` only on success), CTA re-enabled (`app.js:52`), one banner at a time (`app.js:39-48`), new selection clears (`app.js:62`) ✓.
- Empty (E1/E10): verbatim empty state ✓; zero-chunks → verbatim no-chunks message, never a blank list (`app.js:142-147`) ✓.
- Populated/overflow: header + white cards + chrome chips (`app.js:149-160`), list `overflow-y:auto; overflow-x:hidden` with `max-height` (`styles.css:219-223`) ✓.
- Destructive confirmation: native `<dialog>` `showModal()` with verbatim copy and both contract buttons (`index.html:64-70`, `app.js:164-184`) ✓.
- Drag-and-drop implemented to match what the copy promises (`app.js:187-201`) ✓.
- WARNING (code-derived): if `POST /api/upload` succeeds but `GET /api/doc/:id` then fails, `app.js:116-120` falls back to `chunks: []` and renders the E10 message "No text chunks were extracted…" — a factual claim about extraction that was never run (the doc fetch, not extraction, failed). Low-probability same-server edge, but it asserts a false fact; fall back to the banner instead.
- No framework → no ErrorBoundary; `fetch` failures are caught (`app.js:92-97`, `110-115`) and collapse onto contract copy ✓. No external assets anywhere in `public/` (grep `https?://` → zero hits) — PRV-01 by construction.
- Test-suite gap: `public.test.js` pins strings only (`html.includes(...)`, `css.includes(...)`) — it passes today despite the BLOCKER above, because the `hidden` attributes *are* present in the markup. The distinction between declared and effective visibility is exactly what static pins miss.

---

## Files Audited

- `public/index.html` (74 lines) — markup, verbatim copy, aria labels, hidden attributes
- `public/styles.css` (303 lines) — tokens, type roles, accent/destructive usage, `[hidden]` overrides, spacing scale
- `public/app.js` (201 lines) — E1–E10 state machine, copy constants, render paths
- `server.js` (122 lines) — error-row ownership, static serving, loopback bind
- `public.test.js` — what the UI test suite actually pins (string-level only)
- `01-UI-SPEC.md` — baseline (Design System, Spacing, Typography, Color, Copywriting Contract, E1–E10 table)
- `01-03-PLAN.md`, `01-01-PLAN.md`, `01-01/02/03-SUMMARY.md`, `01-CONTEXT.md`, `ui-brand.md` — intent vs. built
- Screenshots: `.planning/ui-reviews/01-20261018-161858/{desktop,tablet,mobile}.png` (captured 3/3 via `npx playwright screenshot --channel=msedge`; no Chromium download, Edge channel)
- Registry audit: not applicable — no `components.json` (`NO_SHADCN`), `01-UI-SPEC.md` Registry Safety table declares no registries.
