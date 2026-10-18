# Roadmap: LegalTriage (PS2) — Private Legal Document Triage Agent

## Overview

Four phases cover the whole day, reconciled 1:1 with the human working plan in `tasks/plan.md` and `tasks/todo.md` — each GSD phase ends at one of that plan's hard timed checkpoints, so the team executes against a single set of deadlines. Phase 1 folds the 10:00–10:30 contract task into the vertical slice and ends at Checkpoint 1 (13:30 — Stage 1 evaluation also begins at 13:30 IST): a working offline slice with the citation verifier as a hard gate. Phase 2 (Checkpoint 2, 15:00) lands the three safety-capped rubric criteria — grounding display, uncertainty/refusal, and privacy evidence — plus the browser Q&A demo. Phase 3 (Checkpoint 3, 17:30 hard freeze) lands everything else that scores: robustness, structured extraction, benchmarks, tests. Phase 4 (Checkpoint 4, 20:00 fresh-clone run-through; submit by 20:30) is documentation, evidence capture, recording and submission — nothing new is built after the freeze. P1 (backend), P2 (privacy evidence, docs, tests) and P3 (browser UI) work in parallel inside every phase.

**Checkpoint reconciliation (GSD phase ↔ tasks/plan.md):**

| GSD Phase | tasks/plan.md | Window | Checkpoint |
|-----------|---------------|--------|------------|
| 1. Contract + Vertical Slice | Phase 0 + Phase 1 | 10:00–13:30 | 13:30 — CLI end-to-end, localhost-only; Stage 1 evaluation begins |
| 2. Scored Behaviour | Phase 2 | 13:30–15:00 | 15:00 — browser demo, privacy evidence, refusals |
| 3. Robustness & Evidence | Phase 3 | 15:00–17:30 | 17:30 — hard feature freeze |
| 4. Ship | Phase 4 | 17:30–20:30 | 20:00 fresh-clone run; submit by 20:30 |

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Contract + Vertical Slice** - Offline slice: ingest a document, ask a question, get a verified verbatim citation — grounding gate exists from day one
- [ ] **Phase 2: Scored Behaviour** - Browser demo that proves the three safety-capped criteria: cited/tiered answers, refusal + escalation, reproducible privacy evidence
- [ ] **Phase 3: Robustness & Evidence** - Survives judge-style abuse and unscripted documents; structured extraction panel and measured benchmarks land before the 17:30 freeze
- [ ] **Phase 4: Ship** - Docs, evidence, recording and submission; a stranger runs the demo from a fresh clone before 20:30

## Phase Details

### Phase 1: Contract + Vertical Slice

**Goal**: A working offline vertical slice exists: from a fresh checkout, a PDF/TXT document is ingested page-aware and a question is answered with a verified verbatim citation — proving the hard grounding gate before anything else is built.
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Checkpoint**: 13:30 IST (Checkpoint 1 in tasks/plan.md; Stage 1 evaluation also begins 13:30 IST) — human review before proceeding
**Roles**: P1 — parse/chunk/embed/Ollama client/verifier + `POST /api/ask` CLI & API; P2 — API contract (`docs/api.md`), git/LICENSE/.gitignore/pinned `package.json`, sample documents + licences (G4), localhost-only check; P3 — upload shell + chunk list with page numbers
**Requirements**: ING-01, ING-02, ING-03, GRD-01, PRV-01, MDL-01, MDL-02
**Success Criteria** (what must be TRUE):
  1. A user can upload a PDF or TXT file in the browser and see the extracted text chunks listed with their page numbers
  2. `node cli.js ask <doc> "<question>"` returns a plain-language answer with a verbatim quote that occurs in the document and names its page — and a paraphrased or fabricated quote is rejected and reported unverifiable
  3. Answers come from local Ollama (`gemma3n:e2b`) with retrieval embeddings from `embeddinggemma`, demonstrable with the machine offline
  4. During a full run, connection monitoring shows no socket other than `127.0.0.1:11434`

**Plans**: 3

Plans:
**Wave 1**
- [ ] 01-01-PLAN.md — Contract, fixtures, and page-aware pipeline core (verifier hard gate)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 01-02-PLAN.md — CLI tracer: local ask with verified verbatim citation, localhost-only proof

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 01-03-PLAN.md — Express upload shell + chunk list with page numbers

### Phase 2: Scored Behaviour

**Goal**: The end-to-end browser demo scores on rubric criteria 2 (grounding), 3 (uncertainty/refusal) and 4 (privacy) — every answer carries a verified quote and evidence tier, verdict questions are refused with escalation, and privacy is proven by a reproducible evidence report.
**Mode**: mvp
**Depends on**: Phase 1
**Checkpoint**: 15:00 IST (Checkpoint 2 in tasks/plan.md)
**Roles**: P1 — answer schema (`tier`, `kind`, `escalate`, `confidence_basis`), refusal paths, "document is silent" path, prompt that forbids verdicts; P2 — `scripts/privacy-evidence.ps1` + firewall rule → `evidence/privacy-report.md`, temp-hygiene and update-check audit; P3 — Q&A UI: side-by-side source panel, tier badges, escalation banner, disclaimer footer
**Requirements**: UND-01, GRD-02, GRD-03, UNC-01, UNC-02, UNC-03, UNC-04, PRV-02, PRV-03, PRV-04, UIX-01, UIX-02
**Success Criteria** (what must be TRUE):
  1. In the browser a user completes upload → question → answer, each claim showing its verbatim source passage side-by-side with page number, a `stated`/`interpretation`/`not_in_document` badge, and a "not legal advice" disclaimer on every screen
  2. Asking "is this enforceable?" (or any verdict question) returns a refusal plus specific escalation advice with an escalation banner — never a legal opinion
  3. Asking a question the document does not answer returns an explicit "the document is silent on this", tagged `not_in_document`
  4. `scripts/privacy-evidence.ps1` runs end-to-end and writes `evidence/privacy-report.md` showing zero non-loopback connections during a full run, no document content in temp folders, logs or telemetry, and the disabled Ollama update check documented as the one setup-time network call
  5. Clause explanations name obligations, rights, deadlines, penalties and termination conditions in plain language, each attached to its quoted source

**Plans**: TBD

### Phase 3: Robustness & Evidence

**Goal**: The demo survives judge-style abuse — malformed files, huge documents, vague wording, prompt injection — and every remaining scored item (robustness 12, Gemma integration 10, structured extraction) is landed and evidenced before the 17:30 hard freeze.
**Mode**: mvp
**Depends on**: Phase 2
**Checkpoint**: 17:30 IST — hard feature freeze; nothing new starts after this
**Roles**: P1 — structured extraction (parties, dates, penalties, notice periods) + speed/memory benchmark script; P2 — adversarial + prompt-injection fixtures (`fixtures/`) with runner → `evidence/robustness.md`, `node:test` suite; P3 — structured extraction panel UI + demo polish
**Requirements**: UND-02, ROB-01, ROB-02, MDL-03
**Success Criteria** (what must be TRUE):
  1. Feeding a malformed file, an over-long document, or vague/conflicting wording yields a graceful, honest response — never a crash or silent hang — proven by the committed fixture suite in `evidence/robustness.md`
  2. Prompt-injection text embedded inside an uploaded document cannot surface a citation that fails the verifier: no unverified quote is ever displayed
  3. A structured panel shows the document's parties, dates, penalties and notice periods, each with its page-cited source
  4. Committed `evidence/benchmarks.md` reports tokens/s, peak RSS and per-question latency measured on this machine by a reproducible script

**Plans**: TBD

### Phase 4: Ship

**Goal**: A stranger can clone the public repo and run the demo using only the README, every gate and deliverable is provable from committed files, and the submission lands before 20:30 IST.
**Mode**: mvp
**Depends on**: Phase 3
**Checkpoint**: 20:00 IST fresh-clone run-through by someone who did not build it; submit before 20:30
**Roles**: P2 — README (overview, setup, run, config, troubleshooting), pinned deps, architecture, dataset/licence disclosure, known limitations, `docs/submission.md` checklist; P1 — repro fixes, benchmark/model writeup, contribution statement; P3 — ~5-minute recording (incl. refusal, silent-document case, privacy evidence)
**Requirements**: MDL-04, DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06
**Success Criteria** (what must be TRUE):
  1. Someone who did not build it clones the fresh public repository and runs the full demo (upload → question → cited answer) following only the README, with no paid services (gates G2/G3)
  2. The README covers overview, setup, run, config and troubleshooting with pinned dependencies and an MIT LICENSE, plus an architecture explanation of how processing stays on-device (DOC-01, DOC-02)
  3. Dataset sources, licences and attributions are disclosed, and model acquisition — weights, licence accepted, variant, quantization, runtime — is documented (DOC-03, MDL-04)
  4. Testing results and known limitations are stated honestly, reproduction instructions and a ~5-minute recording are in the repo, and a short main-contribution statement exists (DOC-04, DOC-05, DOC-06)
  5. `docs/submission.md` maps S1–S10, L1–L10 and gates G1–G5 to a proof location for each, the repo is public with no secrets committed (G1, G5), and the submission is in before 20:30 IST

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Contract + Vertical Slice | 0/TBD | Not started | - |
| 2. Scored Behaviour | 0/TBD | Not started | - |
| 3. Robustness & Evidence | 0/TBD | Not started | - |
| 4. Ship | 0/TBD | Not started | - |
