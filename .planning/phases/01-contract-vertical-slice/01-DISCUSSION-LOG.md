# Phase 1: Contract + Vertical Slice - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-18
**Phase:** 1-Contract + Vertical Slice
**Areas discussed:** Demo fixture documents, Browser slice depth

---

## Demo fixture documents

| Option | Description | Selected |
|--------|-------------|----------|
| 2 synthetic docs | Self-authored, clearly labelled, CC0; rental + employment; CUAD joins Phase 3 | ✓ |
| 1 synthetic doc only | Fastest, but single fixture looks scripted | |
| Synthetic + CUAD sample | Adds real CC BY 4.0 doc now; attribution + fetch step today | |

**User's choice:** 2 synthetic docs (Recommended)
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Indian-style | Deposit, notice period, maintenance charges, probation; plain English; judge-familiar | ✓ |
| Generic Western | Broader readability, less judge familiarity | |

**User's choice:** Indian-style (Recommended)
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| In-doc banner + SOURCES.md | Banner line in document text + fixtures/SOURCES.md, CC0 1.0 | ✓ |
| Metadata file only | Clean doc but judges can't tell it's synthetic from the upload alone | |

**User's choice:** In-doc banner + SOURCES.md (Recommended)
**Notes:** Covers gate G4 with zero ambiguity

---

## Browser slice depth

| Option | Description | Selected |
|--------|-------------|----------|
| Strict roadmap split | Browser = upload + chunk list; Q&A via CLI; P3 builds Phase 2 UI after its UI-SPEC | ✓ |
| Pull browser Q&A forward | Minimal question box earlier; risk of rework by Phase 2 contract | |
| Build it, don't show it | Question box behind hidden flag | |

**User's choice:** Strict roadmap split (Recommended)
**Notes:** User initially pushed back that checkpoints were being over-thought; clarified with organizer that Checkpoint 1 only requires one commit before 13:00 IST. First attempt at this question returned Unanswered; retried and answered.

---

## the agent's Discretion

- Checkpoint proof ritual: casual connection spot-check at Checkpoint 1; formal evidence script stays Phase 2
- Upload limits: shell rejects >20 MB / ~300-page PDFs with clear message
- Storage: uploads + `chunks.json` under `./data/`, gitignored

## Deferred Ideas

- CUAD sample document(s) → Phase 3 robustness breadth
